-- CreateEnum
CREATE TYPE "ScenarioEventKind" AS ENUM ('INCOME', 'EXPENSE', 'DEBT_PAYMENT');

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioEvent" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "kind" "ScenarioEventKind" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "ScenarioEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scenario_userId_createdAt_idx" ON "Scenario"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScenarioEvent_scenarioId_date_idx" ON "ScenarioEvent"("scenarioId", "date");

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioEvent" ADD CONSTRAINT "ScenarioEvent_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
