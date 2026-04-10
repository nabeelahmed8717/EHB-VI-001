import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { SqLevel, SqStatus } from '@ehb-pss/types';

/**
 * GET /sq/status/:entity_id?platform_id=gosellr — Response
 *
 * Returned to platform backend to show SQ badge or approval status.
 *
 * Ref: pss-api-contract.md § 2
 */
export class SqStatusResponseDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  entity_id: string;

  @ApiProperty({ example: 'gosellr' })
  platform_id: string;

  @ApiPropertyOptional({ enum: SqLevel, example: 5, nullable: true })
  sq_level: SqLevel | null;

  @ApiProperty({
    enum: ['pending', 'pending_franchise', 'pending_edr', 'approved', 'conditional', 'rejected'],
    example: 'approved',
  })
  status: SqStatus;

  // ── Approved fields ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '2026-04-01T10:30:00Z' })
  approved_at?: Date;

  @ApiPropertyOptional({ example: null, nullable: true })
  expires_at?: Date | null;

  @ApiPropertyOptional({ example: 'SQ5 — Verified Professional' })
  badge_label?: string;

  // ── Pending fields ────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'franchise' })
  pending_at?: string;

  @ApiPropertyOptional({ example: 'Under franchise review' })
  message?: string;

  // ── Rejected fields ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Incomplete product images' })
  rejection_reason?: string;

  @ApiPropertyOptional({ example: '2026-04-01T12:00:00Z' })
  rejected_at?: Date;

  @ApiPropertyOptional({ example: true })
  can_resubmit?: boolean;
}

/**
 * POST /sq/status/bulk — Request body
 *
 * Ref: pss-api-contract.md § 3
 */
export class SqBulkStatusRequestDto {
  @ApiProperty({ example: 'gosellr' })
  @IsString()
  @IsNotEmpty()
  platform_id: string;

  @ApiProperty({
    type: [String],
    example: [
      '64f1a2b3c4d5e6f7a8b9c0d1',
      '64f1a2b3c4d5e6f7a8b9c0d2',
      '64f1a2b3c4d5e6f7a8b9c0d3',
    ],
  })
  @IsArray()
  @IsMongoId({ each: true })
  entity_ids: string[];
}

/** Single result item in a bulk status response */
export class SqBulkStatusItemDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  entity_id: string;

  @ApiPropertyOptional({ enum: SqLevel, example: 5, nullable: true })
  sq_level: SqLevel | null;

  @ApiProperty({ example: 'approved' })
  status: SqStatus;
}

/**
 * POST /sq/status/bulk — Response
 */
export class SqBulkStatusResponseDto {
  @ApiProperty({ type: [SqBulkStatusItemDto] })
  results: SqBulkStatusItemDto[];
}
