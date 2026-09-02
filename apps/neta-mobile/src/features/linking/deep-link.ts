export function createPasswordResetFallback(origin: string): string | null {
  try {
    const url = new URL('/forgot-password', origin);
    return url.protocol === 'https:' || isDevelopmentLoopback(url) ? url.toString() : null;
  } catch {
    return null;
  }
}

function isDevelopmentLoopback(url: URL): boolean {
  return url.protocol === 'http:' && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname);
}
