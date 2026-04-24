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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  const random = crypto.randomBytes(24).toString('hex');
  return `pk_${platformId}_${random}`;
}

/**
 * Generates a webhook signing secret for a platform.
 * PSS signs webhook calls with HMAC-SHA256 using this secret.
 * Platforms verify incoming PSS requests against it.
 */
export function generateWebhookSecret(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto') as typeof import('crypto');
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}
