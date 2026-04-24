import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
} from 'class-validator';

/**
 * POST /platforms/register — Request body
 *
 * Called once during platform onboarding (admin only).
 * Requires x-ehb-admin-key header.
 *
 * Ref: pss-api-contract.md § 7
 */
export class PlatformRegisterRequestDto {
  @ApiProperty({
    description: 'Unique identifier for this platform (kebab-case)',
    example: 'gosellr',
  })
  @IsString()
  @IsNotEmpty()
  platform_id: string;

  @ApiProperty({
    description: 'Human-readable platform name',
    example: 'GoSellr',
  })
  @IsString()
  @IsNotEmpty()
  platform_name: string;

  @ApiProperty({
    description: 'URL where PSS will POST SQ decision webhooks',
    example: 'https://gosellr-api.railway.app/webhooks/pss',
  })
  @IsUrl({ require_tld: false })
  webhook_url: string;

  @ApiProperty({
    description: 'Entity types this platform can submit for SQ approval',
    type: [String],
    example: ['product', 'seller_profile'],
  })
  @IsArray()
  @IsString({ each: true })
  entity_types: string[];

  @ApiProperty({
    description: 'Admin contact email for this platform',
    example: 'admin@gosellr.com',
  })
  @IsEmail()
  contact_email: string;
}

/**
 * POST /platforms/register — Success response
 *
 * NOTE: platform_api_key is returned ONCE only — PSS never stores it in plain text.
 * The receiving admin must save it securely immediately.
 */
export class PlatformRegisterResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    description: 'Platform API key — store this securely. Shown only once.',
    example: 'pk_gosellr_a1b2c3d4e5f6...',
  })
  platform_api_key: string;

  @ApiProperty({ example: 'Platform registered. Store this API key safely.' })
  message: string;
}
