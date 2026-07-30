-- CreateEnum
CREATE TYPE "TripExpenseType" AS ENUM ('TOLL', 'VIGNETTE', 'PARKING', 'OTHER');

-- AlterTable
ALTER TABLE "vehicle_profiles" ADD COLUMN     "fuelTankLiters" INTEGER;

-- CreateTable
CREATE TABLE "trip_logs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "startOdometer" INTEGER NOT NULL,
    "distanceKm" INTEGER NOT NULL,
    "endOdometer" INTEGER NOT NULL,
    "startFuelLiters" DECIMAL(6,2),
    "totalFuelQty" DECIMAL(7,3) NOT NULL DEFAULT 0,
    "totalFuelCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalExpenseCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_fuel_stops" (
    "id" TEXT NOT NULL,
    "tripLogId" TEXT NOT NULL,
    "quantity" DECIMAL(7,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'liter',
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "totalPaid" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'HUF',
    "fuelType" TEXT,
    "station" TEXT,

    CONSTRAINT "trip_fuel_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_expenses" (
    "id" TEXT NOT NULL,
    "tripLogId" TEXT NOT NULL,
    "type" "TripExpenseType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'HUF',
    "description" TEXT,

    CONSTRAINT "trip_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_logs_itemId_idx" ON "trip_logs"("itemId");

-- CreateIndex
CREATE INDEX "trip_logs_itemId_startedAt_idx" ON "trip_logs"("itemId", "startedAt");

-- CreateIndex
CREATE INDEX "trip_logs_userId_startedAt_idx" ON "trip_logs"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "trip_fuel_stops_tripLogId_idx" ON "trip_fuel_stops"("tripLogId");

-- CreateIndex
CREATE INDEX "trip_expenses_tripLogId_idx" ON "trip_expenses"("tripLogId");

-- AddForeignKey
ALTER TABLE "trip_logs" ADD CONSTRAINT "trip_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_fuel_stops" ADD CONSTRAINT "trip_fuel_stops_tripLogId_fkey" FOREIGN KEY ("tripLogId") REFERENCES "trip_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_expenses" ADD CONSTRAINT "trip_expenses_tripLogId_fkey" FOREIGN KEY ("tripLogId") REFERENCES "trip_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
