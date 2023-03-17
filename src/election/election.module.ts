import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';

@Module({
  imports: [PrismaModule],
  providers: [ElectionService],
  controllers: [ElectionController],
})
export class ElectionModule {}
