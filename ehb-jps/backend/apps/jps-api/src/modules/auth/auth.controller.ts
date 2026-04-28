import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
import { UserDocument } from '../users/user.schema';

export class EhbCallbackDto {
  @IsString() @IsNotEmpty()
  ehb_token: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'EHB SSO callback — exchange EHB token for JPS JWT' })
  async ehbCallback(@Body() dto: EhbCallbackDto) {
    return this.authService.ehbCallback(dto.ehb_token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@Req() req: Request) {
    const user = req.user as UserDocument;
    return this.authService.getMe((user._id as unknown as { toString(): string }).toString());
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all JPS sessions for this user' })
  async logout(@Req() req: Request) {
    const user = req.user as UserDocument;
    return this.authService.logout((user._id as unknown as { toString(): string }).toString());
  }
}
