export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`[env] Missing required environment variable: ${key}`);
    throw new Error(`Missing env: ${key}`);
  }
  return val;
}
