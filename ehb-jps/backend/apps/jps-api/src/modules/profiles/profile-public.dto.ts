import { ApiProperty } from '@nestjs/swagger';
import { ProfileDocument } from './profile.schema';

/**
 * Buyer-safe view of a JPS Profile. Returned by the public endpoint
 * GET /profiles/:id/public for service-to-service consumers (e.g. GoSellr).
 *
 * Excludes: user_id, CNIC images, full address text, address proof,
 *           pss_request_id, rejection_reason, deleted_at, timestamps.
 *
 * Includes: a derived `sq_badge_label` so consumers don't have to map levels.
 */
export class JpsProfilePublicDto {
  @ApiProperty({ example: '672a5f8b1c1f4d2c3a8b9d01' })
  id: string;

  @ApiProperty({ example: 'gosellr', enum: ['gosellr', 'jps', 'hps', 'ols', 'wms', 'obs'] })
  platform: string;

  @ApiProperty({ example: 'seller' })
  role: string;

  @ApiProperty({ example: 'Rafi Ahmed' })
  display_name: string;

  @ApiProperty({ example: 'Selling electronics in Lahore since 2015', required: false })
  bio: string;

  @ApiProperty({ example: 'Detailed background and experience…', required: false })
  description: string;

  @ApiProperty({ example: 'approved', enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'resubmit_required'] })
  status: string;

  @ApiProperty({ example: 5, nullable: true, description: 'PSS SQ level, null when not yet approved' })
  sq_level: number | null;

  @ApiProperty({ example: 'SQ5 — Professional Verified', nullable: true })
  sq_badge_label: string | null;

  @ApiProperty({ example: true, description: 'true when status === approved AND sq_level !== null' })
  is_verified: boolean;
}

/**
 * Maps a numeric PSS SQ level to a human-readable badge label.
 * Mirrors the GoSellr products.service mapping so badges look consistent
 * across all consumers of JPS profile data.
 */
const SQ_BADGE_MAP: Record<number, string> = {
  1: 'SQ1 — Basic Verified',
  2: 'SQ2 — Compliance Verified',
  3: 'SQ3 — Financially Verified',
  5: 'SQ5 — Professional Verified',
  7: 'SQ7 — Expert Verified',
  10: 'SQ10 — Elite Certified',
};

export function getSqBadgeLabel(level: number | null): string | null {
  if (level === null || level === undefined) return null;
  return SQ_BADGE_MAP[level] ?? `SQ${level} — Verified`;
}

export function toJpsProfilePublic(profile: ProfileDocument): JpsProfilePublicDto {
  const id = (profile._id as unknown as { toString(): string }).toString();
  return {
    id,
    platform: profile.platform,
    role: profile.role,
    display_name: profile.display_name,
    bio: profile.bio ?? '',
    description: profile.description ?? '',
    status: profile.status,
    sq_level: profile.sq_level ?? null,
    sq_badge_label: getSqBadgeLabel(profile.sq_level ?? null),
    is_verified: profile.status === 'approved' && profile.sq_level !== null,
  };
}
