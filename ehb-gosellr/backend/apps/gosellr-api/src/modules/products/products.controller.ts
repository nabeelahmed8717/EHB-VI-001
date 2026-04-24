import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsNumber, IsArray,
  IsOptional, IsBoolean, Min, ArrayMaxSize, IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserDocument } from '../users/user.schema';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class CreateProductDto {
  @ApiProperty({ example: 'Samsung Galaxy S24' })
  @IsString() @IsNotEmpty() title: string;

  @ApiProperty({ example: 'Brand new sealed box. 256GB storage.' })
  @IsString() @IsNotEmpty() description: string;

  @ApiProperty({ example: 85000 })
  @IsNumber() @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ enum: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Other'] })
  @IsString() @IsNotEmpty() category: string;

  @ApiPropertyOptional({ type: [String], example: ['https://example.com/img1.jpg'] })
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @IsOptional()
  images: string[] = [];

  @ApiPropertyOptional({ example: 10 })
  @IsNumber() @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock = 0;
}

class UpdateProductDto {
  @ApiPropertyOptional() @IsString() @IsOptional() title?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() @Type(() => Number) price?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() category?: string;
  @ApiPropertyOptional({ type: [String] }) @IsArray() @ArrayMaxSize(5) @IsString({ each: true }) @IsOptional() images?: string[];
  @ApiPropertyOptional() @IsNumber() @Min(0) @IsOptional() @Type(() => Number) stock?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() is_active?: boolean;
}

interface AuthReq extends Request {
  user: UserDocument;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ── Public: approved product listings ────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Browse approved products (public)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  getProducts(
    @Query('category') category?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.productsService.getApprovedProducts({ category, page, limit });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller\'s own products (all statuses)' })
  getMyProducts(
    @Request() req: AuthReq,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const sellerId = (req.user._id as unknown as { toString(): string }).toString();
    return this.productsService.getMyProducts(sellerId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product detail (public)' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Product not found' })
  getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  // ── Protected: seller actions ─────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (seller only)' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not a seller' })
  createProduct(@Request() req: AuthReq, @Body() dto: CreateProductDto) {
    if (req.user.role !== 'seller') {
      throw new ForbiddenException('Only sellers can create products');
    }
    const sellerId = (req.user._id as unknown as { toString(): string }).toString();
    return this.productsService.createProduct(sellerId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (owner only)' })
  updateProduct(
    @Request() req: AuthReq,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    if (req.user.role !== 'seller') {
      throw new ForbiddenException('Only sellers can update products');
    }
    const sellerId = (req.user._id as unknown as { toString(): string }).toString();
    return this.productsService.updateProduct(id, sellerId, dto);
  }

  @Post(':id/submit-sq')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit product for SQ approval (seller + owner only)' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status for submission' })
  submitForSQ(@Request() req: AuthReq, @Param('id') id: string) {
    if (req.user.role !== 'seller') {
      throw new ForbiddenException('Only sellers can submit products for SQ');
    }
    const sellerId = (req.user._id as unknown as { toString(): string }).toString();
    return this.productsService.submitForSQ(id, sellerId);
  }

  @Get(':id/sq-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get SQ status from PSS (owner only)' })
  getSQStatus(@Request() req: AuthReq, @Param('id') id: string) {
    const sellerId = (req.user._id as unknown as { toString(): string }).toString();
    return this.productsService.getSQStatus(id, sellerId);
  }
}
