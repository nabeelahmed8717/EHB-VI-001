import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiSecurity,
} from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PlatformKeyGuard } from './platform-key.guard';
import { UserDocument } from '../users/user.schema';
import { UsersService } from '../users/users.service';

class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+923001234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

class LinkPlatformDto {
  @ApiProperty({ example: 'gosellr', description: 'Platform ID to link' })
  @IsString()
  @IsNotEmpty()
  platform_id: string;
}

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // ─── POST /auth/register ───────────────────────────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new EHB user',
    description:
      'Creates a user in pss_db.users and issues an EHB JWT. ' +
      'If redirect_platform is provided, returns a redirect_url for the platform callback.',
  })
  @ApiQuery({
    name: 'redirect_platform',
    required: false,
    description: 'Platform ID to redirect after registration (e.g. gosellr)',
  })
  @ApiResponse({ status: 201, description: 'Registered. Returns ehb_token and user or redirect_url.' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(
    @Body() dto: RegisterDto,
    @Query('redirect_platform') redirectPlatform?: string,
  ) {
    return this.authService.register(dto, redirectPlatform);
  }

  // ─── POST /auth/login ──────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email + password',
    description:
      'Validates credentials and issues an EHB JWT. ' +
      'If redirect_platform is provided, returns a redirect_url for the platform callback.',
  })
  @ApiQuery({
    name: 'redirect_platform',
    required: false,
    description: 'Platform ID to redirect after login (e.g. gosellr)',
  })
  @ApiResponse({ status: 200, description: 'Logged in. Returns ehb_token and user or redirect_url.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(
    @Body() dto: LoginDto,
    @Query('redirect_platform') redirectPlatform?: string,
  ) {
    return this.authService.login(dto, redirectPlatform);
  }

  // ─── POST /auth/logout ────────────────────────────────────────────────────

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout — revoke all active tokens',
    description:
      'Increments the user\'s token_version in DB. ' +
      'All previously-issued ehb_tokens for this user are immediately invalid. ' +
      'Client must also clear locally stored tokens.',
  })
  @ApiResponse({ status: 200, description: '{ success: true, message: "Logged out successfully..." }' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  logout(@Request() req: AuthenticatedRequest) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.authService.logout(userId);
  }

  // ─── GET /auth/verify-token ────────────────────────────────────────────────

  @Get('verify-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify an EHB JWT and return user identity',
    description:
      'Used by sub-platform backends to verify EHB tokens. ' +
      'Send the EHB token as Bearer in Authorization header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token valid. Returns { valid: true, user: { ehb_user_id, email, full_name } }',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  verifyToken(@Request() req: AuthenticatedRequest) {
    return this.authService.verifyToken(req.user);
  }

  // ─── POST /auth/link-platform ──────────────────────────────────────────────

  @Post('link-platform')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Link a platform to the authenticated EHB user',
    description:
      "Adds the platform_id to user.registered_platforms if not already present. " +
      "Called by sub-platform backends after completing user onboarding.",
  })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  @ApiResponse({ status: 400, description: 'Unknown platform' })
  linkPlatform(
    @Body() dto: LinkPlatformDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.authService.linkPlatform(userId, dto.platform_id);
  }

  // ─── GET /auth/user/:ehb_user_id ──────────────────────────────────────────

  @Get('user/:ehb_user_id')
  @UseGuards(PlatformKeyGuard)
  @ApiSecurity('platform-key')
  @ApiOperation({
    summary: 'Get EHB user data by ID (platform-to-platform)',
    description:
      'Returns user data for sub-platform backends. ' +
      'Requires x-platform-key header matching a registered platform API key.',
  })
  @ApiResponse({ status: 200, description: 'User data returned' })
  @ApiResponse({ status: 401, description: 'Invalid or missing platform key' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('ehb_user_id') ehbUserId: string) {
    const user = await this.usersService.findById(ehbUserId);
    if (!user) {
      throw new Error('User not found');
    }
    return this.usersService.toPublic(user);
  }
}
