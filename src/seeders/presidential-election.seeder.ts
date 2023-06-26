import { Injectable } from '@nestjs/common';
import { Seeder } from 'nestjs-seeder';
import { PrismaService } from '../prisma/prisma.service';
import { PusQueryObject } from '../election/election.types';

@Injectable()
export class PresidentialElectionSeeder implements Seeder {
  constructor(private prisma: PrismaService) {}
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
  async seed(): Promise<void> {
    // Check if election already exists, and early return if so.
    const existingElection = await this.prisma.election.findFirst({
      where: {
        electionType: 'Presidential',
      },
    });

    if (existingElection) {
      return;
    }
    const electionAreas = [];
    for (let i = 1; i <= 37; i++) {
      electionAreas.push(i.toString());
    }

    const relatedPus: { id: string }[] = [];
    for (const area of electionAreas) {
      const query: PusQueryObject = {};
      query.state = area;

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
        electionType: 'Presidential',
        electionDate: new Date('2023-02-25'),
      },
    });

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
    console.log({ updatedElection });
  }

  async drop(): Promise<void> {
    return;
  }
}
