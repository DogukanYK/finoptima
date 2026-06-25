/*
  Warnings:

  - The `kind` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "kind",
ADD COLUMN     "kind" "TransactionKind" NOT NULL DEFAULT 'EXPENSE';

-- CreateTable
CREATE TABLE "FindeksReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "score" INTEGER NOT NULL,
    "band" TEXT NOT NULL,
    "componentWeights" JSONB NOT NULL,
    "totalLimit" DECIMAL(14,2) NOT NULL,
    "totalDebt" DECIMAL(14,2) NOT NULL,
    "debtRatio" INTEGER NOT NULL,
    "worstStatus" TEXT NOT NULL,
    "accounts" JSONB NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FindeksReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FindeksReport_userId_idx" ON "FindeksReport"("userId");

-- AddForeignKey
ALTER TABLE "FindeksReport" ADD CONSTRAINT "FindeksReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
