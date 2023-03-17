import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ElectionService } from './election.service';
import { CreateElectionDto } from './election.types';

@Controller('election')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('none'))
  async createElection(@Body() createElectionDto: CreateElectionDto) {
    return await this.electionService.createElection(createElectionDto);
  }
}
