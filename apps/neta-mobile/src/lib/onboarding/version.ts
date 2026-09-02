export const ONBOARDING_VERSION = 1;

export function hasCompletedOnboarding(storedVersion: string | null): boolean {
  const parsed = Number(storedVersion);
  return Number.isSafeInteger(parsed) && parsed >= ONBOARDING_VERSION;
}
