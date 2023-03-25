import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateElectionDto,
  GetElectionReturn,
  PusQueryObject,
} from './election.types';

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

    // Create election
    const newElection = await this.prisma.election.create({
      data: {
        electionType,
        electionDate: new Date(electionDate),
      },
    });

    // Attach polling units
    const elPuObjects = relatedPus.map((el) => {
      return { pollingunitId: el.id, electionId: newElection.id };
    });

    await this.prisma.electionPollingUnit.createMany({
      data: elPuObjects,
    });

    // Attach parties
    const allParties = await this.prisma.politicalParty.findMany();
    const electionPoliticalParties = allParties.map((party) => {
      return { electionId: newElection.id, politicalPartyId: party.id };
    });

    await this.prisma.electionPoliticalParty.createMany({
      data: electionPoliticalParties,
    });

    const updatedElection = await this.prisma.election.findFirst({
      where: {
        id: newElection.id,
      },
      select: {
        electionType: true,
        electionDate: true,
        politicalParties: {
          select: {
            politicalParty: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
    });
    return updatedElection;
  }

  async getAllElections(elType): Promise<GetElectionReturn[]> {
    const query: { electionType?: string } = {};
    if (elType) {
      query.electionType = elType;
    }
    return await this.prisma.election.findMany({
      where: query,
      select: {
        electionDate: true,
        electionType: true,
        id: true,
        politicalParties: {
          select: {
            politicalParty: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
    });
  }
}
