import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UnitResultService } from './unit-result.service';
import { CreateUnitResultDto } from './unit-result.types';

@Controller('results')
export class UnitResultController {
  constructor(private readonly unitResultService: UnitResultService) {}

  @Post()
  async saveResult(@Body() saveResultDto: CreateUnitResultDto) {
    return this.unitResultService.saveUnitResult(saveResultDto);
  }

  @Get()
  async getPUs(@Query('key') key: string) {
    return this.unitResultService.getPollingUnits(key);
  }
}
