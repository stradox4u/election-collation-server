export interface PartyUnitResult {
  partyId: number;
  votes: number;
}

export interface CreateUnitResultDto {
  partyResults: PartyUnitResult[];
  resultImage?: Express.Multer.File;
  pollingunitId: string;
  electionId: string;
}
