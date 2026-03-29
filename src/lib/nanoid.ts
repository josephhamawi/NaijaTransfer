/**
 * Short code generation using nanoid.
 * - Transfer short codes: 10 characters, URL-safe
 * - API keys: 42 random characters + prefix = ~50 chars total
 * - File request codes: 10 characters
 */

// nanoid v5 is ESM-only; using dynamic import pattern
let nanoidModule: typeof import("nanoid") | null = null;

async function getNanoid() {
  if (!nanoidModule) {
    nanoidModule = await import("nanoid");
  }
  return nanoidModule;
}

/**
 * Generate a transfer short code (10 characters, URL-safe).
 * ~64^10 = 1.15 quadrillion combinations.
 */
export async function generateShortCode(): Promise<string> {
  const { nanoid } = await getNanoid();
  return nanoid(10);
}

/**
 * Generate a file request short code (10 characters).
 */
export async function generateRequestCode(): Promise<string> {
  const { nanoid } = await getNanoid();
  return nanoid(10);
}

/**
 * Generate an API key.
 * Format: nt_live_{42 random chars} (total ~50 chars)
 */
export async function generateApiKey(): Promise<{ key: string; prefix: string }> {
  const { nanoid } = await getNanoid();
  const random = nanoid(42);
  const key = `nt_live_${random}`;
  const prefix = key.slice(0, 16); // "nt_live_XXXXXXXX"
  return { key, prefix };
}
