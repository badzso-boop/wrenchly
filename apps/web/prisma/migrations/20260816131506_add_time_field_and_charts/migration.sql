-- CreateEnum
CREATE TYPE "ChartType" AS ENUM ('LINE', 'BAR_MONTHLY', 'PIE', 'BAR_CATEGORY');

-- CreateEnum
CREATE TYPE "ChartAggregation" AS ENUM ('LATEST', 'SUM', 'AVG');

-- AlterEnum
ALTER TYPE "FieldType" ADD VALUE 'TIME';

-- CreateTable
CREATE TABLE "custom_domain_charts" (
    "id" TEXT NOT NULL,
    "customDomainId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chartType" "ChartType" NOT NULL DEFAULT 'LINE',
    "aggregation" "ChartAggregation" NOT NULL DEFAULT 'LATEST',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_domain_charts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_domain_charts_customDomainId_idx" ON "custom_domain_charts"("customDomainId");

-- AddForeignKey
ALTER TABLE "custom_domain_charts" ADD CONSTRAINT "custom_domain_charts_customDomainId_fkey" FOREIGN KEY ("customDomainId") REFERENCES "custom_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_domain_charts" ADD CONSTRAINT "custom_domain_charts_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "custom_domain_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
