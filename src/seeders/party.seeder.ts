import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartySeeder implements Seeder {
  constructor(private prisma: PrismaService) {}

  async seed(): Promise<void> {
    await this.prisma.politicalParty.createMany({
      data: [
        { name: 'A' },
        { name: 'AA' },
        { name: 'AAC' },
        { name: 'ADC' },
        { name: 'ADP' },
        { name: 'APC' },
        { name: 'APGA' },
        { name: 'APM' },
        { name: 'APP' },
        { name: 'BP' },
        { name: 'LP' },
        { name: 'NNPP' },
        { name: 'NRM' },
        { name: 'PDP' },
        { name: 'PRP' },
        { name: 'SDP' },
        { name: 'YPP' },
        { name: 'ZLP' },
      ],
    });
  }

  async drop(): Promise<void> {
    return;
  }
}
