export interface CreateElectionDto {
  electionType: string;
  electionDate: Date;
  electionArea: string[];
}

export interface PusQueryObject {
  state?: string;
  lga?: string;
  ward?: string;
}
