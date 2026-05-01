import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsIn } from 'class-validator';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserDocument } from '../users/user.schema';
import { Request } from 'express';

const VALID_PLATFORMS = ['gosellr', 'jps', 'hps', 'ols', 'wms', 'obs'] as const;
const VALID_ROLES = [
  'seller', 'buyer', 'rider', 'chef', 'driver',
  'cleaner', 'electrician', 'plumber', 'trainer',
  'worker', 'employer', 'freelancer', 'recruiter',
  'doctor', 'nurse', 'lawyer', 'teacher', 'other',
] as const;

export class CreateProfileDto {
  @IsString() @IsNotEmpty()
  @IsIn(VALID_PLATFORMS)
  platform: string;

  @IsString() @IsNotEmpty()
  @IsIn(VALID_ROLES)
  role: string;

  @IsString() @IsNotEmpty()
  display_name: string;

  @IsString() @IsOptional()
  bio?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsOptional()
  cnic_front?: string;

  @IsString() @IsOptional()
  cnic_back?: string;

  @IsString() @IsOptional()
  address?: string;

  @IsString() @IsOptional()
  address_proof?: string;
}

export class UpdateProfileDto {
  @IsString() @IsOptional()
  display_name?: string;

  @IsString() @IsOptional()
  bio?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsString() @IsOptional()
  cnic_front?: string;

  @IsString() @IsOptional()
  cnic_back?: string;

  @IsString() @IsOptional()
  address?: string;

  @IsString() @IsOptional()
  address_proof?: string;
}

function userId(req: Request): string {
  const user = req.user as UserDocument;
  return (user._id as unknown as { toString(): string }).toString();
}

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'List my profiles' })
  findAll(
    @Req() req: Request,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.profilesService.findAll(
      userId(req),
      Number(page),
      Number(limit),
      search,
      role,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single profile' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.profilesService.findOne(id, userId(req));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new profile (status=draft)' })
  create(@Body() dto: CreateProfileDto, @Req() req: Request) {
    return this.profilesService.create(userId(req), dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update draft/resubmit_required profile' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto, @Req() req: Request) {
    return this.profilesService.update(id, userId(req), dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit profile for PSS SQ review' })
  submit(@Param('id') id: string, @Req() req: Request) {
    return this.profilesService.submit(id, userId(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a non-approved profile' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    await this.profilesService.delete(id, userId(req));
  }
}
