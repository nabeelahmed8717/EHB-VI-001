import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SqDecidedBy, SqLevel } from '@ehb-pss/types';

/**
 * Webhook payload — PSS → Platform backend
 *
 * PSS sends this to a platform's registered webhook URL when an SQ decision
 * is made. Platforms must implement POST /webhooks/pss to receive this.
 *
 * Platforms do NOT poll for decisions — PSS pushes results.
 *
 * Header included: x-pss-signature (HMAC-SHA256 of payload body)
 * Platforms MUST verify this signature before processing.
 *
 * Ref: pss-api-contract.md § 6
 */
export class PssWebhookDecisionDto {
  @ApiProperty({ example: 'sq.decision' })
  event: 'sq.decision';

  @ApiProperty({ example: 'req_abc123' })
  sq_request_id: string;

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  entity_id: string;

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  user_id: string;

  @ApiProperty({ example: 'gosellr' })
  platform_id: string;

  @ApiProperty({
    enum: ['approved', 'conditional', 'rejected'],
    example: 'approved',
  })
  decision: 'approved' | 'conditional' | 'rejected';

  @ApiPropertyOptional({
    enum: SqLevel,
    example: 5,
    nullable: true,
    description: 'Assigned SQ level — null when decision is rejected',
  })
  sq_level: SqLevel | null;

  @ApiProperty({
    enum: ['auto', 'franchise', 'edr'],
    description: 'Who made the decision',
    example: 'auto',
  })
  decided_by: SqDecidedBy;

  @ApiProperty({ example: '2026-04-01T10:35:00Z' })
  decided_at: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Rejection reason — always set when decision is rejected',
  })
  rejection_reason: string | null;
}
