import {
  Body,
  Controller,
  Get,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UnitResultService } from './unit-result.service';
import { CreateUnitResultDto } from './unit-result.types';

@Controller('results')
export class UnitResultController {
  constructor(private readonly unitResultService: UnitResultService) {}

  @Post()
  @UseInterceptors(FileInterceptor('resultImage'))
  async saveResult(
    @Body() saveResultDto: CreateUnitResultDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5120,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.unitResultService.saveUnitResult({
      ...saveResultDto,
      resultImage: file,
    });
  }

  @Get()
  async getPUs(@Query('key') key: string) {
    return this.unitResultService.getPollingUnits(key);
  }
}
