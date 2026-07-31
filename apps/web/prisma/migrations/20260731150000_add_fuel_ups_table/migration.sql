-- CreateTable
CREATE TABLE "fuel_ups" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(7,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'liter',
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "totalPaid" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'HUF',
    "fuelType" TEXT,
    "station" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TripFuelUps" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TripFuelUps_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "fuel_ups_itemId_occurredAt_idx" ON "fuel_ups"("itemId", "occurredAt");

-- CreateIndex
CREATE INDEX "_TripFuelUps_B_index" ON "_TripFuelUps"("B");

-- AddForeignKey
ALTER TABLE "fuel_ups" ADD CONSTRAINT "fuel_ups_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TripFuelUps" ADD CONSTRAINT "_TripFuelUps_A_fkey" FOREIGN KEY ("A") REFERENCES "fuel_ups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TripFuelUps" ADD CONSTRAINT "_TripFuelUps_B_fkey" FOREIGN KEY ("B") REFERENCES "trip_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
