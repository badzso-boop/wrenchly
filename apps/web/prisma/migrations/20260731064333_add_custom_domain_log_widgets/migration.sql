-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FieldType" ADD VALUE 'LONG_TEXT';
ALTER TYPE "FieldType" ADD VALUE 'DECIMAL';
ALTER TYPE "FieldType" ADD VALUE 'RADIO';
ALTER TYPE "FieldType" ADD VALUE 'CHECKBOXES';

-- AlterTable
ALTER TABLE "custom_domain_fields" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "loggable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "widthCols" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "custom_domains" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sourceDomainId" TEXT;

-- CreateTable
CREATE TABLE "custom_domain_field_configs" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "minValue" DECIMAL(18,6),
    "maxValue" DECIMAL(18,6),
    "decimalPlaces" INTEGER,
    "maxLength" INTEGER,
    "helpText" TEXT,

    CONSTRAINT "custom_domain_field_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_item_data_entries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "customDomainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_item_data_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_domain_field_values" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueString" TEXT,
    "valueNumber" DECIMAL(18,6),
    "valueBoolean" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" JSONB,

    CONSTRAINT "custom_domain_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_domain_field_configs_fieldId_key" ON "custom_domain_field_configs"("fieldId");

-- CreateIndex
CREATE INDEX "custom_item_data_entries_itemId_recordedAt_idx" ON "custom_item_data_entries"("itemId", "recordedAt");

-- CreateIndex
CREATE INDEX "custom_domain_field_values_fieldId_idx" ON "custom_domain_field_values"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domain_field_values_entryId_fieldId_key" ON "custom_domain_field_values"("entryId", "fieldId");

-- CreateIndex
CREATE INDEX "custom_domains_isPublished_idx" ON "custom_domains"("isPublished");

-- AddForeignKey
ALTER TABLE "custom_domain_field_configs" ADD CONSTRAINT "custom_domain_field_configs_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "custom_domain_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_item_data_entries" ADD CONSTRAINT "custom_item_data_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_item_data_entries" ADD CONSTRAINT "custom_item_data_entries_customDomainId_fkey" FOREIGN KEY ("customDomainId") REFERENCES "custom_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_domain_field_values" ADD CONSTRAINT "custom_domain_field_values_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "custom_item_data_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_domain_field_values" ADD CONSTRAINT "custom_domain_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "custom_domain_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
