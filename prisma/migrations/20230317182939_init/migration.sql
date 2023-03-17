-- CreateTable
CREATE TABLE "PollingUnit" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "ward" TEXT NOT NULL,
    "puNumber" TEXT NOT NULL,
    "puName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollingUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "electionType" TEXT NOT NULL,
    "electionDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionPollingUnit" (
    "id" SERIAL NOT NULL,
    "electionId" TEXT NOT NULL,
    "pollingunitId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionPollingUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitResult" (
    "id" TEXT NOT NULL,
    "A" INTEGER,
    "AA" INTEGER,
    "AAC" INTEGER,
    "ADC" INTEGER,
    "ADP" INTEGER,
    "APC" INTEGER,
    "APGA" INTEGER,
    "APM" INTEGER,
    "APP" INTEGER,
    "BP" INTEGER,
    "LP" INTEGER,
    "NNPP" INTEGER,
    "NRM" INTEGER,
    "PDP" INTEGER,
    "PRP" INTEGER,
    "SDP" INTEGER,
    "YPP" INTEGER,
    "ZLP" INTEGER,
    "resultImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pollingunitId" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,

    CONSTRAINT "UnitResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollingUnit_state_lga_ward_puNumber_idx" ON "PollingUnit"("state", "lga", "ward", "puNumber");

-- CreateIndex
CREATE INDEX "Election_electionType_electionDate_idx" ON "Election"("electionType", "electionDate");

-- CreateIndex
CREATE INDEX "ElectionPollingUnit_electionId_pollingunitId_idx" ON "ElectionPollingUnit"("electionId", "pollingunitId");

-- AddForeignKey
ALTER TABLE "ElectionPollingUnit" ADD CONSTRAINT "ElectionPollingUnit_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionPollingUnit" ADD CONSTRAINT "ElectionPollingUnit_pollingunitId_fkey" FOREIGN KEY ("pollingunitId") REFERENCES "PollingUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitResult" ADD CONSTRAINT "UnitResult_pollingunitId_fkey" FOREIGN KEY ("pollingunitId") REFERENCES "PollingUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitResult" ADD CONSTRAINT "UnitResult_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
