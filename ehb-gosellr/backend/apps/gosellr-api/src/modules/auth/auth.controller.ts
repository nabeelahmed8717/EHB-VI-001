import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsJWT, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserDocument } from '../users/user.schema';

class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ enum: ['seller', 'buyer'], example: 'seller' })
  @IsEnum(['seller', 'buyer'])
  role: 'seller' | 'buyer';
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

class EhbCallbackDto {
  @ApiProperty({ description: 'EHB JWT issued by EHB Main identity platform' })
  @IsString()
  @IsNotEmpty()
  ehb_token: string;
}

class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password. Required only if a local password is already set. Omit for EHB-only users setting a password for the first time.',
    required: false,
  })
  @IsOptional()
  @IsString()
  current_password?: string;

  @ApiProperty({ example: 'NewSecure123', minLength: 6 })
  @IsString()
  @MinLength(6)
  new_password: string;
}

interface AuthenticatedRequest extends Request {
  user: UserDocument;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (seller or buyer)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered, JWT returned' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email + password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'JWT returned' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Current user returned' })
  getMe(@Request() req: AuthenticatedRequest) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.authService.getMe(userId);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change or set a local password',
    description:
      'EHB-linked users (no local password) can set one without supplying current_password. ' +
      'Users with a local password must supply their current_password to change it.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password updated' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'current_password required but missing' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Current password incorrect' })
  changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.authService.changePassword(userId, dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout — revoke all GoSellr sessions',
    description:
      'Increments token_version in DB. All existing GoSellr JWTs for this user become invalid immediately.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: '{ success: true, message: "..." }' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired token' })
  logout(@Request() req: AuthenticatedRequest) {
    const userId = (req.user._id as unknown as { toString(): string }).toString();
    return this.authService.logout(userId);
  }

  @Post('ehb-callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'EHB OAuth callback — exchange EHB token for GoSellr JWT',
    description:
      'Called by the GoSellr frontend callback page after EHB auth. ' +
      'Verifies the EHB token, finds or creates a GoSellr user, and returns a GoSellr JWT.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'GoSellr JWT and user returned',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid EHB token' })
  ehbCallback(@Body() dto: EhbCallbackDto) {
    if (!dto.ehb_token) throw new UnauthorizedException('Missing ehb_token');
    return this.authService.ehbCallback(dto.ehb_token);
  }
}
