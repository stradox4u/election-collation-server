/*
  Warnings:

  - Made the column `resultImage` on table `UnitResult` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UnitResult" ALTER COLUMN "resultImage" SET NOT NULL;

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "state_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lga" (
    "id" SERIAL NOT NULL,
    "lga_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,

    CONSTRAINT "Lga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" SERIAL NOT NULL,
    "ward_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "lgaId" INTEGER NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_state_id_key" ON "State"("state_id");

-- CreateIndex
CREATE INDEX "State_state_id_idx" ON "State"("state_id");

-- CreateIndex
CREATE INDEX "Lga_lga_id_idx" ON "Lga"("lga_id");

-- CreateIndex
CREATE INDEX "Ward_ward_id_idx" ON "Ward"("ward_id");

-- AddForeignKey
ALTER TABLE "Lga" ADD CONSTRAINT "Lga_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("state_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES "Lga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
