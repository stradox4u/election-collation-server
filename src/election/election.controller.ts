import { Body, Controller, Post } from '@nestjs/common';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './election.types';

@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Post()
  async createElection(@Body() createElectionDto: CreateElectionDto) {
    return await this.electionService.createElection(createElectionDto);
  }
}
