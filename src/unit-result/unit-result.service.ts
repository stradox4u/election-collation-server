import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUnitResultDto } from './unit-result.types';

@Injectable()
export class UnitResultService {
  constructor(private prisma: PrismaService) {}

  async saveUnitResult(data: CreateUnitResultDto) {
    return this.prisma.unitResult.create({
      data: { ...data },
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
