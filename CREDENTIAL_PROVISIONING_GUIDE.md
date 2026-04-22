# CREDENTIAL_PROVISIONING_GUIDE.md

**Purpose:** Step-by-step guide for setting up and running the automated credential provisioning flow defined in CLAUDE.md §4b. Use this when: (a) starting a new project that needs 3rd-party API keys, or (b) a credential has expired and needs re-fetching.

**Scope:** Dev/test environments only. Production credentials are never handled via this flow — the owner provisions production credentials manually.

---

## Part 1 — One-time setup (do this once per machine)

Estimated time: 30 minutes. Done once, works for all future projects.

### 1.1 Install Claude in Chrome

- [ ] Open Chrome or Edge (this flow does not work in Brave, Arc, Safari, or Firefox)
- [ ] Visit the Chrome Web Store and search for "Claude" (extension name is literally "Claude")
- [ ] Click "Add to Chrome"
- [ ] Confirm you have version 1.0.36 or higher (check via the puzzle-piece menu → Manage extensions)
- [ ] Pin the extension to your toolbar so you can see when it's active
- [ ] Sign in with your Claude account when prompted
- [ ] Grant browser permissions when asked

### 1.2 Enable Claude in Chrome for Cowork (Claude Desktop)

- [ ] Open Claude Desktop (the app, not the web)
- [ ] Click your initials in the lower-left corner → Settings
- [ ] Find the Connectors section
- [ ] Toggle Claude in Chrome ON
- [ ] Confirm it appears in the Connectors dropdown in your chats

### 1.3 Enable Claude in Chrome for Claude Code

- [ ] Open a terminal in any project directory
- [ ] Run `claude --chrome` once to verify it connects, OR inside an existing session run `/chrome`
- [ ] When prompted, select "Enabled by default" so you don't have to pass `--chrome` every session
- [ ] If using VS Code: the Chrome extension is available automatically once the browser extension is installed — no additional config needed

### 1.4 Confirm your plan supports the models you need

- [ ] If you're on **Pro**: browser automation runs on Haiku 4.5. Works, but fumbles complex panels occasionally.
- [ ] If you're on **Max / Team / Enterprise**: you can pick Opus 4.7, Opus 4.6, or Sonnet 4.6 for browser tasks. Recommended for provisioning runs — the quality difference is meaningful.
- [ ] Set the model preference in the Chrome extension's settings panel.

### 1.5 Verify the `.env.local` convention for your project stack

This flow writes credentials to `.env.local` by convention. Confirm your project stack auto-loads this file:

- [ ] **Next.js / Vite / Remix / Nuxt / Astro:** auto-loads `.env.local`. No config needed.
- [ ] **Electron:** add `require('dotenv').config({ path: '.env.local' })` at the top of `main.js` or equivalent.
- [ ] **Node (plain):** add `require('dotenv').config({ path: '.env.local' })` at your app entry point. Install `dotenv` if not present.
- [ ] **Python:** add `from dotenv import load_dotenv; load_dotenv('.env.local')` at entry point. Install `python-dotenv` if not present.
- [ ] **Other:** confirm the stack's convention and document it in §20 of CLAUDE.md.

### 1.6 Verify `.gitignore` protects credentials

In every project, before any credential is written:

- [ ] Confirm `.gitignore` contains at minimum:
  ```
  .env
  .env.*
  .env.local
  .env*.local
  .credentials/
  ```
- [ ] Run `git check-ignore .env.local` — it should print `.env.local` (confirming it's ignored)
- [ ] Run `grep -i "env.local" $(git ls-files)` — it should return nothing (confirming no credential file is already tracked)

---

## Part 2 — Per-service provisioning flow

Run this every time you need a new API key for a service. Estimated time: 2-5 minutes per service.

### 2.1 Owner prep (in your browser)

- [ ] If this is a brand-new service: sign up, complete email verification, enter payment if required
- [ ] Log into the service in your normal Chrome profile
- [ ] Navigate to the service's API / tokens / developer panel — the specific page that has a "Generate API Key" or "Create Token" button
- [ ] Leave that tab open and visible
- [ ] Switch to Claude Desktop (or Claude Code)

### 2.2 Tell Cowork to provision

In Claude Desktop, inside your project's Claude.ai Project:

Paste a message like this (adapt service name):

```
I've opened the API panel for <SERVICE_NAME> in Chrome and I'm logged in.
The panel URL is <URL_YOU_SEE_IN_ADDRESS_BAR>.
Please provision a dev key for this project:
- Key name: <project>-dev  (e.g. linkedinright-dev)
- Target variable: <VARNAME>  (e.g. APOLLO_API_KEY)
- Write to: .env.local
Follow §4b of CLAUDE.md including the read-back verification.
```

### 2.3 Cowork presents the plan

Cowork (via Claude in Chrome) will respond with a plan:
- Which button it will click
- What name the key will have
- Which variable it will write to
- Whether any existing value will be overwritten

**Review the plan carefully.** If anything looks wrong (wrong key name, wrong variable, about to overwrite a live value), say "no, adjust X" before approving.

When it looks right, reply: `approve` or `go`.

### 2.4 Cowork executes

- A Chrome window will visibly do the work: click the button, name the key, copy the value
- This takes 10-60 seconds per service
- Don't touch Chrome while it's running — let the automation finish
- If Cowork hits an unexpected state (new TOS popup, 2FA re-challenge, page redesign), it will stop and ask

### 2.5 Read-back verification (non-negotiable)

Cowork will report back something like:

```
Provisioning complete:
- Service: Apollo
- Key name as shown in Apollo UI: linkedinright-dev
- First 8 chars of key value: sk_ABC12de
- Written to: APOLLO_API_KEY in .env.local
- Existing .env.local entries preserved: yes

Confirm this matches what you see in the Apollo panel?
```

- [ ] Open the service panel in Chrome
- [ ] Find the key in the list of keys
- [ ] Confirm the name matches (`linkedinright-dev`)
- [ ] Confirm the first 8 characters of the visible key match what Cowork reported (`sk_ABC12de`)
- [ ] Reply `confirmed` or `yes`

If the first 8 chars don't match, reply `mismatch — the key I see starts with <actual 8 chars>`. Cowork will investigate (probably wrong clipboard state) and re-run.

### 2.6 Direct handoff prompt

After confirmation, Cowork generates a prompt block for Claude Code like:

```
## Wire up Apollo integration

Apollo API key is now available at APOLLO_API_KEY in .env.local.

Symptom: the project needs Apollo lead enrichment integrated into 
the outreach pipeline, but no code currently reads APOLLO_API_KEY.

Expected behaviour: the outreach agent loads the Apollo client at 
startup, fails loudly if the key is missing, and uses Apollo's 
/v1/people/match endpoint to enrich lead records.

Hypothesis (unconfirmed — read the code first): there is likely 
an `apiClients/` or `integrations/` directory where other API 
clients live. Follow that convention.

Universal Debug Rule (§3): Read the actual code before confirming 
the approach. The hypothesis might be wrong. Evaluate the best 
approach, find edge cases, and address workflow conflicts too.

Plan-Before-Build (§5): Present a short plan + concrete questions 
before writing code. Do not start implementing until questions 
are answered.

Specific gotchas noticed during provisioning:
- Apollo's free/dev tier has a rate limit of 100 requests/hour
- The key has "test mode" scope by default — confirm this is fine 
  for dev/test usage

Access reminders (§4 + §4b): the credential is already in 
.env.local. Do NOT ask the owner to paste it — read from the file.
```

- [ ] Copy the entire prompt block
- [ ] Paste into Claude Code
- [ ] Claude Code will now respond with its own plan (§5) and questions before writing any code

---

## Part 3 — Handling a dead credential

When Claude Code detects a 401 / 403 / auth failure during build or test, it will stop and report:

```
APOLLO_API_KEY appears to be failing against the Apollo API 
(getting 401 on every request). Please re-run provisioning 
via Cowork per §4b.
```

- [ ] Open the service's API panel in Chrome
- [ ] If the old key is still there but revoked/expired: delete it first
- [ ] Generate a new key OR signal to Cowork that the panel is ready for re-fetch
- [ ] Run the Part 2 flow again, using the same variable name (`APOLLO_API_KEY`)
- [ ] Cowork will detect the existing line in `.env.local` and update it in place (§9 merge rule)
- [ ] Read-back verify, confirm, copy the fresh handoff prompt to Claude Code
- [ ] Claude Code resumes

---

## Part 4 — Things that will go wrong (and what to do)

Honest beta-quality caveats. None are catastrophic; all are recoverable.

| Problem | What's happening | What to do |
|---|---|---|
| Cowork says "I can't see the panel" | Claude in Chrome didn't attach to the tab you meant | Close other Chrome windows, leave only the panel tab visible, retry |
| Read-back first-8-chars don't match | Clipboard race condition, or wrong field was copied | Reply `mismatch` — Cowork will retry. If it fails twice, delete the generated key in the service UI and run fresh |
| Cowork clicks the wrong button | Service redesigned their panel since last run | Say `stop, that's the wrong button`. Describe which button to click. Cowork will adjust and retry |
| Cowork tries to navigate away from the panel | Violation of §4b | Stop the run immediately (`stop`). Report it as a bug — Cowork should never navigate |
| `.env.local` now contains duplicate variable | Read-modify-write failed | Open `.env.local` manually, delete the older/wrong line, keep the newer one |
| Key was generated but Cowork reports "write failed" | File permission issue or directory didn't exist | Create `.env.local` manually as an empty file, then ask Cowork to retry just the write step (don't re-generate the key) |
| Service requires 2FA to generate a new API key | Correctly refused — 2FA is owner-only | Complete the 2FA yourself in the panel, then tell Cowork "2FA done, continue" |
| Production key got provisioned by mistake | Violation of §4b (dev/test only) | **Revoke immediately** in the service's UI, rotate, and review how the provisioning prompt was phrased |

---

## Part 5 — Provisioning log (optional but recommended)

For projects where credentials matter, keep a lightweight log in §20 of CLAUDE.md:

```
### Credential Provisioning Log

| Date | Service | Variable | Key name | Provisioned by | Notes |
|---|---|---|---|---|---|
| 2026-04-19 | Apollo | APOLLO_API_KEY | linkedinright-dev | Cowork (session 12) | 100/hr rate limit on free tier |
| 2026-04-20 | SendGrid | SENDGRID_API_KEY | linkedinright-dev | Cowork (session 13) | Scoped to "Mail Send" only |
```

This is not required but helps when:
- A credential breaks six weeks later and you want to remember how it was set up
- You're rotating credentials and need to know which are dev vs prod
- You're handing the project to someone else

---

## Appendix — Services known to work well / poorly

Update this list as you gain experience. Fill in from your own runs.

**Known to work well:**
- (to be filled in after first successful runs)

**Known to need care:**
- (services with quirky panels, popups, or non-standard key-generation flows)

**Known to block automation:**
- (services that detect browser automation and refuse)
