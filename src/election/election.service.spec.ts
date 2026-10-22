import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ElectionService } from './election.service';

describe('ElectionService', () => {
  let service: ElectionService;
  const prisma = {
    election: { findFirst: jest.fn() },
    politicalPartyUnitResult: { groupBy: jest.fn() },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ElectionService>(ElectionService);
  });

  describe('getElectionResults', () => {
    it("sums the election's votes and gives parties without results 0", async () => {
      prisma.election.findFirst.mockResolvedValue({
        politicalParties: [
          { politicalParty: { id: 1, name: 'A' } },
          { politicalParty: { id: 2, name: 'AA' } },
        ],
      });
      prisma.politicalPartyUnitResult.groupBy.mockResolvedValue([
        { politicalPartyId: 1, _sum: { voteCount: 150 } },
      ]);

      await expect(service.getElectionResults('election-1')).resolves.toEqual([
        { id: 1, name: 'A', totalVotes: 150 },
        { id: 2, name: 'AA', totalVotes: 0 },
      ]);
      expect(prisma.politicalPartyUnitResult.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { unitResult: { electionId: 'election-1' } },
        }),
      );
    });

    it('rejects an unknown election with 404', async () => {
      prisma.election.findFirst.mockResolvedValue(null);

      await expect(service.getElectionResults('missing')).rejects.toMatchObject(
        { status: HttpStatus.NOT_FOUND },
      );
    });

    it('rejects a missing election id with 400', async () => {
      await expect(service.getElectionResults(undefined)).rejects.toMatchObject(
        { status: HttpStatus.BAD_REQUEST },
      );
      expect(prisma.election.findFirst).not.toHaveBeenCalled();
    });
  });
});
