-- CreateTable
CREATE TABLE "SupportMacro" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMacro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportMacro_sortOrder_idx" ON "SupportMacro"("sortOrder");
