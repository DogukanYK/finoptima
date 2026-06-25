-- DropIndex
DROP INDEX "FindeksReport_userId_idx";

-- DropIndex
DROP INDEX "PaymentAutomation_userId_idx";

-- CreateIndex
CREATE INDEX "FindeksReport_userId_reportDate_idx" ON "FindeksReport"("userId", "reportDate");

-- CreateIndex
CREATE INDEX "PaymentAutomation_userId_status_idx" ON "PaymentAutomation"("userId", "status");
