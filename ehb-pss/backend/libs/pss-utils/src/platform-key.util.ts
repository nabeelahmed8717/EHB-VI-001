/**
 * Platform Key Utilities
 *
 * Helpers for generating and hashing platform API keys.
 * Pure functions — no side effects, no DB access.
 *
 * Status: SCAFFOLD — implementations added when platforms module is built
 */

/**
 * Generates a new platform API key in the format:
 * pk_{platform_id}_{random_hex}
 *
 * @param platformId - e.g. 'gosellr'
 * @returns Plaintext key — must be hashed before storing, returned once to admin
 */
export function generatePlatformKey(platformId: string): string {
  // TODO: Implement using crypto.randomBytes
  void platformId;
  return '';
}

/**
 * Generates a webhook signing secret for a platform.
 * PSS signs webhook calls with this secret; platforms verify with it.
 */
export function generateWebhookSecret(): string {
  // TODO: Implement using crypto.randomBytes
  return '';
}
