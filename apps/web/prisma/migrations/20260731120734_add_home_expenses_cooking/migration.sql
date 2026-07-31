-- CreateEnum
CREATE TYPE "HouseholdTransactionType" AS ENUM ('EXPENSE', 'INCOME');

-- AlterEnum
ALTER TYPE "ItemType" ADD VALUE 'HOME';

-- AlterTable
ALTER TABLE "shopping_list_items" ADD COLUMN     "cookingLogEntryId" TEXT;

-- CreateTable
CREATE TABLE "home_profiles" (
    "itemId" TEXT NOT NULL,
    "householdSize" INTEGER,
    "notes" TEXT,

    CONSTRAINT "home_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "household_transactions" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "HouseholdTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'HUF',
    "category" TEXT,
    "paidBy" TEXT NOT NULL,
    "store" TEXT,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_log_entries" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ingredients" TEXT,
    "servings" INTEGER,
    "daysCovered" INTEGER,
    "cost" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'HUF',
    "linkedTransactionId" TEXT,
    "cookedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooking_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_meals" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "household_transactions_itemId_occurredAt_idx" ON "household_transactions"("itemId", "occurredAt");

-- CreateIndex
CREATE INDEX "household_transactions_itemId_type_idx" ON "household_transactions"("itemId", "type");

-- CreateIndex
CREATE INDEX "cooking_log_entries_itemId_cookedAt_idx" ON "cooking_log_entries"("itemId", "cookedAt");

-- CreateIndex
CREATE INDEX "cooking_log_entries_itemId_name_idx" ON "cooking_log_entries"("itemId", "name");

-- CreateIndex
CREATE INDEX "favorite_meals_itemId_idx" ON "favorite_meals"("itemId");

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_cookingLogEntryId_fkey" FOREIGN KEY ("cookingLogEntryId") REFERENCES "cooking_log_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_profiles" ADD CONSTRAINT "home_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_transactions" ADD CONSTRAINT "household_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_log_entries" ADD CONSTRAINT "cooking_log_entries_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_log_entries" ADD CONSTRAINT "cooking_log_entries_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "household_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_meals" ADD CONSTRAINT "favorite_meals_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
