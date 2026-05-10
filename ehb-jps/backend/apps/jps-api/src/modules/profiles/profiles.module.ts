import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './profile.schema';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesPublicController } from './profiles-public.controller';
import { ServiceKeyGuard } from './service-key.guard';
import { PssClientModule } from '../pss-client/pss-client.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    PssClientModule,
    UsersModule,
  ],
  providers: [ProfilesService, ServiceKeyGuard],
  controllers: [ProfilesPublicController, ProfilesController],
  exports: [ProfilesService],
})
export class ProfilesModule {}
