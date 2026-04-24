import "server-only";

// Narrow GitHub Contents API client for reading and writing a single file on
// the configured repo. Used by the feedback loop to auto-commit prompt
// changes. All three env vars must be present — requireGhEnv throws with a
// clear message so callers can surface a 500 cleanly.

const GITHUB_API = "https://api.github.com";

export interface GitHubFile {
  sha: string;
  content: string; // decoded UTF-8
}

interface GhEnv {
  token: string;
  owner: string;
  repo: string;
}

function requireGhEnv(): GhEnv {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  if (!token || !owner || !repo) {
    throw new Error(
      "[github] Missing GITHUB_TOKEN / GITHUB_REPO_OWNER / GITHUB_REPO_NAME",
    );
  }
  return { token, owner, repo };
}

function contentsUrl(owner: string, repo: string, filePath: string): string {
  // encodeURIComponent would escape slashes; re-allow them for the path
  const encoded = encodeURIComponent(filePath).replace(/%2F/gi, "/");
  return `${GITHUB_API}/repos/${owner}/${repo}/contents/${encoded}`;
}

export async function getFile(filePath: string): Promise<GitHubFile> {
  const { token, owner, repo } = requireGhEnv();
  const res = await fetch(contentsUrl(owner, repo, filePath), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "upwork-bid-bot-feedback-loop",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[github] getFile ${filePath} failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`.trim(),
    );
  }
  const json = (await res.json()) as {
    sha?: string;
    content?: string;
    encoding?: string;
  };
  if (!json.sha || typeof json.content !== "string") {
    throw new Error(`[github] getFile ${filePath}: malformed response`);
  }
  const encoding = (json.encoding ?? "base64") as BufferEncoding;
  const content = Buffer.from(json.content, encoding).toString("utf-8");
  return { sha: json.sha, content };
}

export async function commitFile(args: {
  path: string;
  message: string;
  content: string;
  sha: string;
  branch?: string;
}): Promise<{ commitSha: string }> {
  const { token, owner, repo } = requireGhEnv();
  const { path, message, content, sha, branch = "main" } = args;
  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    sha,
    branch,
  };
  const res = await fetch(contentsUrl(owner, repo, path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "upwork-bid-bot-feedback-loop",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 409) {
    throw new Error(
      "[github] commitFile: concurrent update — sha mismatch (409). Try again.",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[github] commitFile ${path} failed: ${res.status} ${res.statusText} ${text.slice(0, 200)}`.trim(),
    );
  }
  const json = (await res.json()) as { commit?: { sha?: string } };
  const commitSha = json.commit?.sha ?? "";
  return { commitSha };
}
