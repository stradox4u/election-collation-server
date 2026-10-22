import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    console.log({ newElection });
    // Attach polling units
    const elPuObjects = relatedPus.map((el) => {
      return { pollingunitId: el.id, electionId: newElection.id };
    });

    const chunks = this.splitIntoChunks(elPuObjects, 10);

    for (const chunk of chunks) {
      await this.prisma.electionPollingUnit.createMany({
        data: chunk,
      });
    }
    // await this.prisma.electionPollingUnit.createMany({
    //   data: elPuObjects,
    // });

    // Attach parties
    const allParties = await this.prisma.politicalParty.findMany();
    const electionPoliticalParties = allParties.map((party) => {
      return { electionId: newElection.id, politicalPartyId: party.id };
    });
    console.log({ allParties });

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

  async getAllElections(elType: string): Promise<GetElectionReturn[]> {
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

  async getElectionResults(elId: string) {
    // Without an id, findFirst would match an arbitrary election
    if (!elId) {
      throw new HttpException('elId is required', HttpStatus.BAD_REQUEST);
    }

    const election = await this.prisma.election.findFirst({
      where: {
        id: elId,
      },
      select: {
        politicalParties: {
          select: {
            politicalParty: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!election) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    // Sum each party's votes from this election's unit results only
    const voteTotals = await this.prisma.politicalPartyUnitResult.groupBy({
      by: ['politicalPartyId'],
      where: {
        unitResult: {
          electionId: elId,
        },
      },
      _sum: {
        voteCount: true,
      },
    });
    const totalsByParty = new Map(
      voteTotals.map((total) => [total.politicalPartyId, total._sum.voteCount]),
    );

    const summedVotes = election.politicalParties.map((party) => {
      return {
        name: party.politicalParty.name,
        id: party.politicalParty.id,
        totalVotes: totalsByParty.get(party.politicalParty.id) ?? 0,
      };
    });

    return summedVotes;
  }

  private splitIntoChunks(
    array: { pollingunitId: string; electionId: string }[],
    parts: number,
  ) {
    const copiedArray = array.slice();
    const result = [];
    for (let i = parts; i > 0; i--) {
      result.push(copiedArray.splice(0, Math.ceil(copiedArray.length / i)));
    }
    return result;
  }
}
