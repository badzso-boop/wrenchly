-- DropForeignKey
ALTER TABLE "trip_fuel_stops" DROP CONSTRAINT "trip_fuel_stops_tripLogId_fkey";

-- DropTable
DROP TABLE "trip_fuel_stops";
