import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { PrismaService } from '../prisma/prisma.service';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { PollingUnit } from './pollingUnit.types';

@Injectable()
export class ElectionSeeder implements Seeder {
  constructor(private prisma: PrismaService) {}

  async seed(): Promise<void> {
    const data = await readFile(
      path.join(__dirname, '../../cleanedPUs.json'),
      'utf-8',
    );
    const parsed = await JSON.parse(data);

    const allPUs = [];
    Object.keys(parsed).forEach((state) => {
      Object.keys(parsed[state]).forEach((lga) => {
        Object.keys(parsed[state][lga]).forEach((ward) => {
          allPUs.push(
            parsed[state][lga][ward].pollingUnits.map((pu: PollingUnit) => {
              const [state, lga, ward, number] = pu.delimitation.split('/');
              return {
                state,
                lga,
                ward,
                puNumber: number,
                puName: pu.name,
              };
            }),
          );
        });
      });
    });

    console.log(allPUs.length + ' Wards in Total!');

    console.log('Started Seeding DB');

    for (const ward of allPUs) {
      await this.prisma.pollingUnit.createMany({
        data: ward,
      });
    }
  }

  async drop(): Promise<void> {
    return;
  }
}
