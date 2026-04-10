import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

/**
 * POST /users/verify — Request body
 *
 * Sent by platform backend to verify a user's identity
 * or fetch their verified credentials from PSS.
 *
 * Ref: pss-api-contract.md § 4
 */
export class UserVerifyRequestDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the user to verify',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  @IsMongoId()
  user_id: string;

  @ApiProperty({
    description: 'Platform ID making the verification request',
    example: 'gosellr',
  })
  @IsString()
  @IsNotEmpty()
  requesting_platform: string;

  @ApiProperty({
    description: 'Which fields to return from the user trust record',
    type: [String],
    example: ['identity_verified', 'sq_level_history'],
  })
  @IsArray()
  @IsString({ each: true })
  required_fields: string[];
}

/** One entry in a user's SQ level history across platforms */
export class SqLevelHistoryItemDto {
  @ApiProperty({ example: 'jps' })
  platform: string;

  @ApiProperty({ example: 'job_profile' })
  entity_type: string;

  @ApiProperty({ example: 7 })
  sq_level: number;
}

/**
 * POST /users/verify — Response
 */
export class UserVerifyResponseDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  user_id: string;

  @ApiProperty({ description: 'Whether the user\'s identity has been verified', example: true })
  identity_verified: boolean;

  @ApiProperty({
    description: 'Risk score 0–100. Lower is safer.',
    example: 12,
  })
  risk_score: number;

  @ApiPropertyOptional({
    type: [SqLevelHistoryItemDto],
    description: 'SQ levels this user has earned across platforms',
  })
  sq_level_history?: SqLevelHistoryItemDto[];

  @ApiProperty({
    description: 'Active flags on this user (fraud, complaint, etc.)',
    type: [String],
    example: [],
  })
  flags: string[];
}
