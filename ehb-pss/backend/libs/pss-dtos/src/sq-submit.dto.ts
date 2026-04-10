import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * POST /sq/submit — Request body
 *
 * Sent by platform backend (via pss-client) when a user clicks
 * "Send for Approval" on an entity.
 *
 * Ref: pss-api-contract.md § 1
 */
export class SqSubmitRequestDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the entity being submitted',
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
  })
  @IsMongoId()
  entity_id: string;

  @ApiProperty({
    description: 'Type of entity — matches platform entity_types registry',
    example: 'product',
  })
  @IsString()
  @IsNotEmpty()
  entity_type: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the user who owns the entity',
    example: '64f1a2b3c4d5e6f7a8b9c0d2',
  })
  @IsMongoId()
  user_id: string;

  @ApiProperty({
    description: 'Platform ID of the submitting platform',
    example: 'gosellr',
  })
  @IsString()
  @IsNotEmpty()
  platform_id: string;

  @ApiProperty({
    description: 'Entity data fields to evaluate against platform criteria',
    example: {
      title: 'Samsung Galaxy S24',
      description: 'Brand new sealed box',
      price: 85000,
      images: ['img1.jpg', 'img2.jpg'],
      category: 'electronics',
      seller_license: 'LIC-12345',
    },
  })
  @IsObject()
  entity_data: Record<string, unknown>;
}

/**
 * POST /sq/submit — Success response
 */
export class SqSubmitResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'req_abc123' })
  sq_request_id: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty({ example: 'SQ request submitted successfully' })
  message: string;
}

/**
 * POST /sq/submit — Already has active SQ response
 */
export class SqAlreadyActiveResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'ALREADY_HAS_SQ' })
  code: string;

  @ApiPropertyOptional({ example: 5 })
  current_sq_level?: number;

  @ApiProperty({ example: 'Entity already has an active SQ level' })
  message: string;
}
