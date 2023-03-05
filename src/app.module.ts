import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UnitResultModule } from './unit-result/unit-result.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UnitResultModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
