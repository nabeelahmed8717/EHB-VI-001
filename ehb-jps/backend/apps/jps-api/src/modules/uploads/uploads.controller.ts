import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// multer is bundled inside @nestjs/platform-express — @types/multer not required
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multer = require('multer') as {
  diskStorage: (opts: {
    destination: string;
    filename: (req: unknown, file: { originalname: string }, cb: (err: null, name: string) => void) => void;
  }) => unknown;
};

// Minimal file shape we need from multer
interface MulFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  filename: string;
  path: string;
  size: number;
}

type MulterCb = (err: Error | null, acceptFile: boolean) => void;

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload an image (CNIC, address proof, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.diskStorage({
        destination: './uploads',
        filename: (_req: unknown, file: { originalname: string }, cb: (err: null, name: string) => void) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req: unknown, file: MulFile, cb: MulterCb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: MAX_SIZE_BYTES },
    }),
  )
  uploadImage(@UploadedFile() file: MulFile) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return { url: `/static/${file.filename}` };
  }
}
