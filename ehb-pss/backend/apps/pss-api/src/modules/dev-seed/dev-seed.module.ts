import { Module } from '@nestjs/common';
import { PlatformsModule } from '../platforms/platforms.module';
import { DevSeedService } from './dev-seed.service';

@Module({
  imports: [PlatformsModule],
  providers: [DevSeedService],
})
export class DevSeedModule {}
