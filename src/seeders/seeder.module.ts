import { Module } from '@nestjs/common';
import { DayjsModule } from 'src/dayjs/dayjs.module';
import { PollingUnitSeeder } from './pollingunit.seeder';

@Module({
  imports: [DayjsModule],
  controllers: [],
  providers: [PollingUnitSeeder],
})
export class SeederModule {}
