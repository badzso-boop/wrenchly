-- AlterTable
ALTER TABLE "custom_domains" ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "custom_domains" ADD COLUMN     "tabOrder" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
