import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SellerService } from './seller.service';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';

class BankInfoDto {
  @ApiProperty({ example: 'HBL' })
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  account_title: string;

  @ApiProperty({ example: '01234567890' })
  @IsString()
  @IsNotEmpty()
  account_number: string;

  @ApiProperty({ example: 'PK00HABB0000000000000000' })
  @IsString()
  @IsNotEmpty()
  iban: string;
}

class CreateSellerProfileDto {
  @ApiProperty({ example: 'Rafi Electronics' })
  @IsString()
  @IsNotEmpty()
  business_name: string;

  @ApiProperty({ example: 'Retail' })
  @IsString()
  @IsNotEmpty()
  business_type: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  business_category: string;

  @ApiProperty({ example: 'Quality electronics at great prices', required: false })
  @IsOptional()
  @IsString()
  store_description?: string;
}

class UpdateSellerProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  business_category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  store_description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  store_logo_url?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  document_urls?: string[];

  @ApiProperty({ type: BankInfoDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankInfoDto)
  bank_info?: BankInfoDto;
}

interface AuthRequest extends Request {
  user: UserDocument;
}

@ApiTags('Seller')
@Controller('seller')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SellerController {
  constructor(
    private readonly sellerService: SellerService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create seller profile' })
  @ApiResponse({ status: 201, description: 'Seller profile created. PSS verification must be submitted manually via POST /seller/pss-submit.' })
  @ApiResponse({ status: 403, description: 'Account role is not seller' })
  @ApiResponse({ status: 409, description: 'Seller profile already exists' })
  async register(@Request() req: AuthRequest, @Body() dto: CreateSellerProfileDto) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    // Upgrade user role to seller if not already
    if (req.user.role !== 'seller') {
      await this.usersService.updateRole(userId, 'seller');
    }
    const seller = await this.sellerService.create({ user_id: userId, ...dto });
    return this.sellerService.toPublic(seller);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current seller profile' })
  @ApiResponse({ status: 200, description: 'Seller profile returned' })
  @ApiResponse({ status: 404, description: 'Seller profile not found' })
  async getProfile(@Request() req: AuthRequest) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    const seller = await this.sellerService.findByUserId(userId);
    if (!seller) {
      return null;
    }
    return this.sellerService.toPublic(seller);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update seller profile (business info, docs, bank)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Request() req: AuthRequest, @Body() dto: UpdateSellerProfileDto) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    const seller = await this.sellerService.update(userId, dto);
    return this.sellerService.toPublic(seller);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get seller PSS/SQ stats and status' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  async getStats(@Request() req: AuthRequest) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.sellerService.getStats(userId);
  }

  @Post('pss-submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually submit store for PSS/SQ verification' })
  @ApiResponse({ status: 200, description: 'Verification request submitted; sq_status set to pending' })
  @ApiResponse({ status: 400, description: 'Cannot resubmit — already pending, in review, or approved' })
  @ApiResponse({ status: 404, description: 'Seller profile not found' })
  async submitToPss(@Request() req: AuthRequest) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.sellerService.manualSubmitToPss(userId);
  }
}
