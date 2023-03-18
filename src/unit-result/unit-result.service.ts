import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmazonS3Service } from 'src/aws-s3/aws-s3.service';
import { EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUnitResultDto } from './unit-result.types';

@Injectable()
export class UnitResultService {
  constructor(
    private prisma: PrismaService,
    private s3Service: AmazonS3Service,
    private configService: ConfigService,
    private eventGateway: EventsGateway,
  ) {}

  async saveUnitResult(data: CreateUnitResultDto) {
    const fileUploaded = await this.s3Service.uploadFile(
      data.resultImage.buffer,
      data.resultImage.mimetype,
      this.configService.get<string>('RESULT_IMAGES_FOLDER'),
    );

    const resultImagePath =
      this.configService.get<string>('RESULT_IMAGES_PATH_PREFIX') +
      fileUploaded;

    return this.prisma.unitResult.create({
      data: {
        A: +data.A,
        AA: +data.AA,
        AAC: +data.AAC,
        ADC: +data.ADC,
        ADP: +data.ADP,
        APC: +data.APC,
        APGA: +data.APGA,
        APM: +data.APM,
        APP: +data.APP,
        BP: +data.BP,
        LP: +data.LP,
        NNPP: +data.NNPP,
        NRM: +data.NRM,
        PDP: +data.PDP,
        PRP: +data.PRP,
        SDP: +data.SDP,
        YPP: +data.YPP,
        ZLP: +data.ZLP,
        resultImage: resultImagePath,
        pollingUnit: {
          connect: {
            id: data.pollingunitId,
          },
        },
        election: {
          connect: {
            id: data.electionId,
          },
        },
      },
    });
  }

  async getPollingUnits(key: string) {
    const [state, lga, ward] = key.split('-');

    const pus = await this.prisma.pollingUnit.findMany({
      where: {
        state,
        lga,
        ward,
      },
    });

    return pus;
  }
}
