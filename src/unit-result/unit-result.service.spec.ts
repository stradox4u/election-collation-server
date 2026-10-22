import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AmazonS3Service } from '../aws-s3/aws-s3.service';
import { ElectionService } from '../election/election.service';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { UnitResultService } from './unit-result.service';

describe('UnitResultService', () => {
  let service: UnitResultService;
  const prisma = { unitResult: { create: jest.fn() } };
  const s3Service = { uploadFile: jest.fn() };
  const electionService = { getElectionResults: jest.fn() };
  const eventGateway = { server: { sockets: { emit: jest.fn() } } };

  const resultImage = {
    buffer: Buffer.from('image'),
    mimetype: 'image/png',
  } as Express.Multer.File;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitResultService,
        { provide: PrismaService, useValue: prisma },
        { provide: AmazonS3Service, useValue: s3Service },
        { provide: ConfigService, useValue: { get: jest.fn(() => 'prefix/') } },
        { provide: EventsGateway, useValue: eventGateway },
        { provide: ElectionService, useValue: electionService },
      ],
    }).compile();

    service = module.get<UnitResultService>(UnitResultService);
  });

  describe('saveUnitResult', () => {
    it('saves the result and its party votes in one nested write, then broadcasts totals', async () => {
      s3Service.uploadFile.mockResolvedValue('image.png');
      electionService.getElectionResults.mockResolvedValue([]);

      await service.saveUnitResult({
        electionId: 'election-1',
        pollingunitId: 'pu-1',
        partyResults: [
          JSON.stringify({ partyId: 1, votes: 7 }),
          JSON.stringify({ partyId: 2, votes: 3 }),
        ],
        resultImage,
      });

      expect(prisma.unitResult.create).toHaveBeenCalledTimes(1);
      expect(prisma.unitResult.create.mock.calls[0][0].data).toMatchObject({
        resultImage: 'prefix/image.png',
        politicalParties: {
          createMany: {
            data: [
              { politicalPartyId: 1, voteCount: 7 },
              { politicalPartyId: 2, voteCount: 3 },
            ],
          },
        },
      });
      expect(eventGateway.server.sockets.emit).toHaveBeenCalledWith(
        'voteCountsUpdated',
        [],
      );
    });

    it('uploads and saves nothing when the party results are malformed', async () => {
      await expect(
        service.saveUnitResult({
          electionId: 'election-1',
          pollingunitId: 'pu-1',
          partyResults: ['not json'],
          resultImage,
        }),
      ).rejects.toThrow(SyntaxError);

      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(prisma.unitResult.create).not.toHaveBeenCalled();
    });
  });
});
