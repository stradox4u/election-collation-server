import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { PrismaService } from '../prisma/prisma.service';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { DayJsService } from '../dayjs/dayjs.service';

@Injectable()
export class ElectionSeeder implements Seeder {
  constructor(
    private prisma: PrismaService,
    private readonly dayjs: DayJsService,
  ) {}

  async seed(): Promise<void> {
    const dayjsInstance = this.dayjs.getDayJsInstance();
    const electionDate = dayjsInstance('2023-03-18').format();

    const data = await readFile(
      path.join(__dirname, '../../cleanedPUs.json'),
      'utf-8',
    );
    const parsed = await JSON.parse(data);

    const allPUs = [];
    Object.keys(parsed).forEach((state) => {
      Object.keys(parsed[state]).forEach((lga) => {
        Object.keys(parsed[state][lga]).forEach((ward) => {
          allPUs.push(parsed[state][lga][ward].pollingUnits);
        });
      });
    });

    console.log(allPUs.length);

    // const createdPUs = await this.prisma.pollingUnit.createMany({
    //   data: mappedPUs,
    // });

    // console.log(createdPUs);

    let testElection = await this.prisma.election.findFirst({
      where: {
        electionType: 'test-run-election',
      },
    });

    if (!testElection) {
      await this.prisma.election.create({
        data: {
          electionType: 'test-run-election',
          electionDate,
        },
      });

      testElection = await this.prisma.election.findFirst({
        where: {
          electionType: 'test-run-election',
        },
      });
    }

    const elId = testElection.id;
    // const mappedPUs = [];
    console.log('Started Seeding DB');

    for (const ward of allPUs) {
      for (const pu of ward) {
        const [state, lga, ward, number] = pu.delimitation.split('/');
        await this.prisma.pollingUnit.create({
          data: {
            state: state,
            lga: lga,
            ward: ward,
            puNumber: number,
            puName: pu.name,
            elections: {
              create: [
                {
                  assignedAt: new Date(),
                  election: {
                    connect: {
                      id: elId,
                    },
                  },
                },
              ],
            },
          },
        });
      }
    }
  }

  async drop(): Promise<void> {
    return;
  }
}
