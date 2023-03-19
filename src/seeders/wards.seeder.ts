import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { PrismaService } from '../prisma/prisma.service';
import { readFile } from 'fs/promises';
import * as path from 'path';

@Injectable()
export class WardSeeder implements Seeder {
  constructor(private prisma: PrismaService) {}

  async seed(): Promise<void> {
    const stateData = await readFile(
      path.join(__dirname, '../../statesAndLgas.json'),
      'utf-8',
    );

    const allStateData = await JSON.parse(stateData);

    for (const state of Object.keys(allStateData)) {
      // Write state to db
      const createdState = await this.prisma.state.create({
        data: {
          state_id: +allStateData[state].state_id,
          name: state,
        },
      });

      // Write Lgas to db
      const stateLgas = allStateData[state].lgas.map((lga) => {
        return {
          lga_id: +lga.abbreviation,
          name: lga.name,
          stateId: +createdState.id,
        };
      });
      await this.prisma.lga.createMany({
        data: stateLgas,
      });
    }
    const data = await readFile(
      path.join(__dirname, '../../allWards.json'),
      'utf-8',
    );
    const { allWards } = await JSON.parse(data);

    // Write wards to db
    for (const ward of allWards) {
      const relevantLga = await this.prisma.lga.findFirst({
        where: {
          lga_id: +ward.lgaId,
          stateId: +ward.stateId,
        },
      });

      await this.prisma.ward.create({
        data: {
          ward_id: +ward.abbreviation,
          name: ward.name,
          lga: {
            connect: {
              id: relevantLga.id,
            },
          },
        },
      });
    }
  }

  async drop(): Promise<void> {
    return;
  }
}
