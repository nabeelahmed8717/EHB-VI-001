import { Module } from '@nestjs/common';
import { PlatformsModule } from '../platforms/platforms.module';
import { CriteriaModule } from '../criteria/criteria.module';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { DevSeedService } from './dev-seed.service';

@Module({
  imports: [PlatformsModule, CriteriaModule, RuleEngineModule],
  providers: [DevSeedService],
})
export class DevSeedModule {}
