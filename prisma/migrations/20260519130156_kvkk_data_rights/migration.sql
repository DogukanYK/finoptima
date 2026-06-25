-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consentedAt" TIMESTAMP(3),
ADD COLUMN     "sessionsValidFrom" TIMESTAMP(3);
