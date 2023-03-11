import { Module } from '@nestjs/common';
import { DayjsModule } from 'src/dayjs/dayjs.module';
import { ElectionSeeder } from './election.seeder';

@Module({
  imports: [DayjsModule],
  controllers: [],
  providers: [ElectionSeeder],
})
export class SeederModule {}
