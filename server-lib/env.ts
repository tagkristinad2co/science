// Helper to read environment variables with Netlify.env.get fallback to process.env

export function getEnv(key: string): string | undefined {
  try {
    const netlifyEnv = (globalThis as any).Netlify?.env?.get?.(key);
    if (typeof netlifyEnv === 'string') {
      return netlifyEnv.trim();
    }
  } catch {
    // ignore
  }

  const val = process.env[key];
  return typeof val === 'string' ? val.trim() : undefined;
}
