import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmazonS3Service } from 'src/aws-s3/aws-s3.service';
import { ElectionService } from 'src/election/election.service';
import { EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUnitResultDto } from './unit-result.types';

@Injectable()
export class UnitResultService {
  constructor(
    private prisma: PrismaService,
    private s3Service: AmazonS3Service,
    private configService: ConfigService,
    private eventGateway: EventsGateway,
    private electionService: ElectionService,
  ) {}

  async saveUnitResult(data: CreateUnitResultDto) {
    // Parse before uploading or writing anything, so bad input has no side effects
    const partyResultsMapped = data.partyResults.map((partyResult) => {
      const result = JSON.parse(partyResult);
      return {
        politicalPartyId: result.partyId,
        voteCount: result.votes,
      };
    });

    const fileUploaded = await this.s3Service.uploadFile(
      data.resultImage.buffer,
      data.resultImage.mimetype,
      this.configService.get<string>('RESULT_IMAGES_FOLDER'),
    );

    const resultImagePath =
      this.configService.get<string>('RESULT_IMAGES_PATH_PREFIX') +
      fileUploaded;

    // Prisma runs a nested write in one transaction, so the result and its
    // party votes are saved together or not at all
    await this.prisma.unitResult.create({
      data: {
        resultImage: resultImagePath,
        pollingUnit: {
          connect: {
            id: data.pollingunitId,
          },
        },
        election: {
          connect: {
            id: data.electionId,
          },
        },
        politicalParties: {
          createMany: {
            data: partyResultsMapped,
          },
        },
      },
    });
    // Calculate totals and broadcast to client using websockets
    await this.broadcastNewTotals(data.electionId);
    return;
  }

  private async broadcastNewTotals(elId: string) {
    const newTotals = await this.electionService.getElectionResults(elId);
    this.eventGateway.server.sockets.emit('voteCountsUpdated', newTotals);
  }
}
