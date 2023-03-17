import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UnitResultModule } from './unit-result/unit-result.module';
import { DayjsModule } from './dayjs/dayjs.module';
import { PrismaModule } from './prisma/prisma.module';
import { ElectionModule } from './election/election.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UnitResultModule,
    DayjsModule,
    PrismaModule,
    ElectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
