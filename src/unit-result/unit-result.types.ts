export interface CreateUnitResultDto {
  A?: number;
  AA?: number;
  AAC?: number;
  ADC?: number;
  ADP?: number;
  APC?: number;
  APGA?: number;
  APM?: number;
  APP?: number;
  BP?: number;
  LP?: number;
  NNPP?: number;
  NRM?: number;
  PDP?: number;
  PRP?: number;
  SDP?: number;
  YPP?: number;
  ZLP?: number;
  resultImage?: Express.Multer.File;
  pollingunitId: string;
  electionId: string;
}
