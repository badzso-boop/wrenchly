-- AlterTable
ALTER TABLE "trip_logs" ADD COLUMN     "batteryPercentUsed" INTEGER,
ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "elevationGainM" INTEGER,
ADD COLUMN     "maxAltitudeM" INTEGER;
