import { Module } from '@nestjs/common';
import { AwsS3Module } from 'src/aws-s3/aws-s3.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UnitResultController } from './unit-result.controller';
import { UnitResultService } from './unit-result.service';

@Module({
  imports: [PrismaModule, AwsS3Module],
  controllers: [UnitResultController],
  providers: [UnitResultService],
})
export class UnitResultModule {}
