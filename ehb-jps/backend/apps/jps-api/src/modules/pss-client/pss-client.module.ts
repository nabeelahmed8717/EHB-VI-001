import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PssClientService } from './pss-client.service';

@Module({
  imports: [HttpModule],
  providers: [PssClientService],
  exports: [PssClientService],
})
export class PssClientModule {}
