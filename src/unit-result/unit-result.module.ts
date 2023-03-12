import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UnitResultController } from './unit-result.controller';
import { UnitResultService } from './unit-result.service';

@Module({
  imports: [PrismaModule],
  controllers: [UnitResultController],
  providers: [UnitResultService],
})
export class UnitResultModule {}
