-- CreateEnum
CREATE TYPE "DebtKind" AS ENUM ('CREDIT_CARD', 'LOAN');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinanceProfileType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "balance" DECIMAL(14,2),
ADD COLUMN     "cardExpiry" TEXT,
ADD COLUMN     "cardLast4" TEXT,
ADD COLUMN     "iban" TEXT;

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "DebtKind" NOT NULL DEFAULT 'CREDIT_CARD',
    "balance" DECIMAL(14,2) NOT NULL,
    "apr" DECIMAL(6,2) NOT NULL,
    "dueDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAutomation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "optimalDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountType" "FinanceProfileType" NOT NULL DEFAULT 'INDIVIDUAL',
    "strategy" TEXT NOT NULL DEFAULT 'balanced',
    "allocDebt" INTEGER NOT NULL DEFAULT 50,
    "allocSavings" INTEGER NOT NULL DEFAULT 25,
    "allocCash" INTEGER NOT NULL DEFAULT 25,
    "automationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxOrIdNumber" TEXT,
    "birthDate" TIMESTAMP(3),
    "nationality" TEXT,
    "province" TEXT,
    "district" TEXT,
    "neighborhood" TEXT,
    "fullAddress" TEXT,
    "postalCode" TEXT,
    "profession" TEXT,
    "incomeRange" TEXT,
    "aiIdentityText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Debt_userId_idx" ON "Debt"("userId");

-- CreateIndex
CREATE INDEX "DebtPayment_userId_idx" ON "DebtPayment"("userId");

-- CreateIndex
CREATE INDEX "DebtPayment_debtId_idx" ON "DebtPayment"("debtId");

-- CreateIndex
CREATE INDEX "PaymentAutomation_userId_idx" ON "PaymentAutomation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceProfile_userId_key" ON "FinanceProfile"("userId");

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAutomation" ADD CONSTRAINT "PaymentAutomation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAutomation" ADD CONSTRAINT "PaymentAutomation_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceProfile" ADD CONSTRAINT "FinanceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
