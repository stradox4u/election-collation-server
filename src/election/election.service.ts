import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateElectionDto, PusQueryObject } from './election.types';

@Injectable()
export class ElectionService {
  constructor(private readonly prisma: PrismaService) {}

  async createElection(data: CreateElectionDto) {
    const { electionType, electionDate, electionArea } = data;

    const relatedPus: { id: string }[] = [];

    for (const area of electionArea) {
      const [state, lga, ward] = area.split('-');
      const query: PusQueryObject = {};
      if (state) query.state = state;
      if (lga) query.lga = lga;
      if (ward) query.ward = ward;

      const pollingUnits = await this.prisma.pollingUnit.findMany({
        where: { ...query },
        select: {
          id: true,
        },
      });

      relatedPus.push(...pollingUnits);
    }

    const newElection = await this.prisma.election.create({
      data: {
        electionType,
        electionDate: new Date(electionDate),
      },
    });

    const elPuObjects = relatedPus.map((el) => {
      return { pollingunitId: el.id, electionId: newElection.id };
    });

    await this.prisma.electionPollingUnit.createMany({
      data: elPuObjects,
    });

    const updatedElection = await this.prisma.election.findFirst({
      where: {
        id: newElection.id,
      },
      select: {
        electionType: true,
        electionDate: true,
        pollingUnits: {
          select: {
            pollingUnit: {
              select: {
                state: true,
                lga: true,
                ward: true,
                puNumber: true,
                puName: true,
              },
            },
          },
        },
      },
    });
    return updatedElection;
  }
}
