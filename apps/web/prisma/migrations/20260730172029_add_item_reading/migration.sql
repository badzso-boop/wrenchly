-- CreateTable
CREATE TABLE "item_readings" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_readings_itemId_recordedAt_idx" ON "item_readings"("itemId", "recordedAt");

-- AddForeignKey
ALTER TABLE "item_readings" ADD CONSTRAINT "item_readings_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
