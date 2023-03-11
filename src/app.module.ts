import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UnitResultModule } from './unit-result/unit-result.module';
import { DayjsModule } from './dayjs/dayjs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UnitResultModule,
    DayjsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
