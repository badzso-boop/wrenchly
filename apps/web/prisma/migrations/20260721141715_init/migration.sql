-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('VEHICLE', 'PROPERTY', 'PLANT', 'MACHINE', 'TOOL', 'DEVICE', 'PET', 'AQUARIUM', 'POOL', 'BOAT', 'DRONE', 'INSTRUMENT', 'BICYCLE', 'SOLAR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'SOLD');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('DATE', 'INTERVAL_DAYS', 'ODOMETER', 'CRON', 'WEATHER', 'COMPOUND');

-- CreateEnum
CREATE TYPE "ShoppingPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ShoppingStatus" AS ENUM ('PENDING', 'BOUGHT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'ENUM', 'URL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Budapest',
    "expoPushToken" TEXT,
    "calendarToken" TEXT,
    "defaultLat" DECIMAL(9,6),
    "defaultLon" DECIMAL(9,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "subtype" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "description" TEXT,
    "location" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "serialNumber" TEXT,
    "warrantyExpiresAt" TIMESTAMP(3),
    "coverPhotoUrl" TEXT,
    "parentItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "costTotal" DECIMAL(10,2),
    "costLabor" DECIMAL(10,2),
    "isDiy" BOOLEAN NOT NULL DEFAULT true,
    "timeSpentMin" INTEGER,
    "odometerValue" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "maintenanceRecordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "brand" TEXT,
    "partNumber" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2),
    "totalPrice" DECIMAL(10,2),
    "supplier" TEXT,
    "url" TEXT,
    "notes" TEXT,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "maintenanceRecordId" TEXT,
    "storageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "TriggerType" NOT NULL,
    "triggerConfig" JSONB NOT NULL,
    "lastTriggeredAt" TIMESTAMP(3),
    "nextTriggerAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifyChannels" TEXT[] DEFAULT ARRAY['push']::TEXT[],
    "snoozeUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderId" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "titleKey" TEXT NOT NULL,
    "bodyKey" TEXT NOT NULL,
    "bodyParams" JSONB,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),

    CONSTRAINT "smart_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursFrom" INTEGER,
    "quietHoursTo" INTEGER,
    "advanceDays" INTEGER NOT NULL DEFAULT 3,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "spec" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "location" TEXT,
    "minQuantity" DECIMAL(10,3),
    "costPerUnit" DECIMAL(10,2),
    "expiryDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3),
    "unit" TEXT,
    "estimatedPrice" DECIMAL(10,2),
    "storeSuggestion" TEXT,
    "url" TEXT,
    "priority" "ShoppingPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ShoppingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_profiles" (
    "itemId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "variant" TEXT,
    "vin" TEXT,
    "licensePlate" TEXT,
    "color" TEXT,
    "fuelType" TEXT,
    "engineDisplacement" INTEGER,
    "powerKw" INTEGER,
    "transmission" TEXT,
    "driveType" TEXT,
    "oilSpec" TEXT,
    "coolantType" TEXT,
    "brakeFluidType" TEXT,
    "tireSizeFront" TEXT,
    "tireSizeRear" TEXT,
    "tirePressureFront" DECIMAL(4,2),
    "tirePressureRear" DECIMAL(4,2),
    "currentOdometer" INTEGER,
    "lastOdometerUpdate" TIMESTAMP(3),

    CONSTRAINT "vehicle_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "property_profiles" (
    "itemId" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "address" TEXT,
    "yearBuilt" INTEGER,
    "floorAreaM2" INTEGER,
    "floors" INTEGER,
    "rooms" INTEGER,
    "heatingType" TEXT,
    "boilerBrand" TEXT,
    "boilerModel" TEXT,
    "roofType" TEXT,

    CONSTRAINT "property_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "plant_profiles" (
    "itemId" TEXT NOT NULL,
    "commonName" TEXT,
    "botanicalName" TEXT,
    "variety" TEXT,
    "locationType" TEXT,
    "locationLabel" TEXT,
    "plantedDate" TIMESTAMP(3),
    "sunRequirement" TEXT,
    "wateringFreqSummer" INTEGER,
    "wateringFreqWinter" INTEGER,
    "soilType" TEXT,
    "fertilizerType" TEXT,
    "fertilizerFreqWeeks" INTEGER,
    "potSizeLiters" INTEGER,
    "hardyZone" INTEGER,
    "healthStatus" TEXT DEFAULT 'healthy',
    "lastWateredAt" TIMESTAMP(3),
    "lastFertilizedAt" TIMESTAMP(3),

    CONSTRAINT "plant_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "printer3d_profiles" (
    "itemId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "buildVolumeX" INTEGER,
    "buildVolumeY" INTEGER,
    "buildVolumeZ" INTEGER,
    "nozzleDiameter" DECIMAL(3,2),
    "defaultNozzleMat" TEXT,
    "firmwareVersion" TEXT,
    "totalPrintHours" DECIMAL(8,2) DEFAULT 0,
    "totalPrints" INTEGER DEFAULT 0,
    "filamentConsumedG" INTEGER DEFAULT 0,

    CONSTRAINT "printer3d_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "pet_profiles" (
    "itemId" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "species" TEXT,
    "breed" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "weightKg" DECIMAL(5,2),
    "microchipNumber" TEXT,
    "vetName" TEXT,
    "vetPhone" TEXT,

    CONSTRAINT "pet_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "bicycle_profiles" (
    "itemId" TEXT NOT NULL,
    "type" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "frameSize" TEXT,
    "groupset" TEXT,
    "brakeType" TEXT,
    "chainBrand" TEXT,
    "chainKm" INTEGER DEFAULT 0,
    "totalKm" INTEGER DEFAULT 0,

    CONSTRAINT "bicycle_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "aquarium_profiles" (
    "itemId" TEXT NOT NULL,
    "aquariumType" TEXT NOT NULL,
    "volumeLiters" INTEGER,
    "dimensions" TEXT,
    "setupDate" TIMESTAMP(3),
    "substrate" TEXT,
    "lighting" TEXT,
    "filtration" TEXT,
    "co2System" BOOLEAN NOT NULL DEFAULT false,
    "heaterBrand" TEXT,
    "targetTempC" DECIMAL(4,1),

    CONSTRAINT "aquarium_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "pool_profiles" (
    "itemId" TEXT NOT NULL,
    "poolType" TEXT NOT NULL,
    "volumeLiters" INTEGER,
    "filtrationKind" TEXT,
    "pumpBrand" TEXT,
    "heaterType" TEXT,
    "targetTempC" DECIMAL(4,1),
    "saltSystem" BOOLEAN NOT NULL DEFAULT false,
    "uvSystem" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pool_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "boat_profiles" (
    "itemId" TEXT NOT NULL,
    "boatType" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "hullMaterial" TEXT,
    "lengthM" DECIMAL(5,2),
    "engineBrand" TEXT,
    "engineModel" TEXT,
    "engineHours" DECIMAL(8,1),
    "fuelType" TEXT,
    "fuelTankLiters" INTEGER,
    "mooringLocation" TEXT,
    "registrationExpires" TIMESTAMP(3),
    "insuranceExpires" TIMESTAMP(3),

    CONSTRAINT "boat_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "drone_profiles" (
    "itemId" TEXT NOT NULL,
    "droneType" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "totalFlightHours" DECIMAL(8,2),
    "totalFlights" INTEGER DEFAULT 0,
    "firmwareVersion" TEXT,
    "registrationNumber" TEXT,
    "registrationExpires" TIMESTAMP(3),

    CONSTRAINT "drone_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "instrument_profiles" (
    "itemId" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "serialNumber" TEXT,
    "material" TEXT,
    "stringGauge" TEXT,
    "stringBrand" TEXT,
    "tuning" TEXT,

    CONSTRAINT "instrument_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "solar_profiles" (
    "itemId" TEXT NOT NULL,
    "solarType" TEXT NOT NULL,
    "installer" TEXT,
    "installationDate" TIMESTAMP(3),
    "panelCount" INTEGER,
    "panelWattPeak" INTEGER,
    "totalKwp" DECIMAL(6,2),
    "inverterBrand" TEXT,
    "inverterModel" TEXT,
    "batteryStorageKwh" DECIMAL(6,2),
    "annualYieldEstimateKwh" INTEGER,
    "monitoringUrl" TEXT,

    CONSTRAINT "solar_profiles_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "custom_domains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_domain_fields" (
    "id" TEXT NOT NULL,
    "customDomainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "unit" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "custom_domain_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_item_data" (
    "itemId" TEXT NOT NULL,
    "customDomainId" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "custom_item_data_pkey" PRIMARY KEY ("itemId")
);

-- CreateTable
CREATE TABLE "onboarding_states" (
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "selectedHobbies" TEXT[],
    "currentStep" TEXT,
    "stepData" JSONB,

    CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "share_exports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "content" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_calendarToken_key" ON "users"("calendarToken");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "items_userId_idx" ON "items"("userId");

-- CreateIndex
CREATE INDEX "items_userId_type_idx" ON "items"("userId", "type");

-- CreateIndex
CREATE INDEX "items_userId_status_idx" ON "items"("userId", "status");

-- CreateIndex
CREATE INDEX "maintenance_records_itemId_idx" ON "maintenance_records"("itemId");

-- CreateIndex
CREATE INDEX "maintenance_records_itemId_performedAt_idx" ON "maintenance_records"("itemId", "performedAt");

-- CreateIndex
CREATE INDEX "maintenance_records_userId_performedAt_idx" ON "maintenance_records"("userId", "performedAt");

-- CreateIndex
CREATE INDEX "parts_maintenanceRecordId_idx" ON "parts"("maintenanceRecordId");

-- CreateIndex
CREATE INDEX "photos_itemId_idx" ON "photos"("itemId");

-- CreateIndex
CREATE INDEX "photos_maintenanceRecordId_idx" ON "photos"("maintenanceRecordId");

-- CreateIndex
CREATE INDEX "reminders_userId_nextTriggerAt_idx" ON "reminders"("userId", "nextTriggerAt");

-- CreateIndex
CREATE INDEX "reminders_itemId_idx" ON "reminders"("itemId");

-- CreateIndex
CREATE INDEX "reminders_isActive_nextTriggerAt_idx" ON "reminders"("isActive", "nextTriggerAt");

-- CreateIndex
CREATE INDEX "smart_notifications_userId_readAt_triggeredAt_idx" ON "smart_notifications"("userId", "readAt", "triggeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "inventory_items_userId_idx" ON "inventory_items"("userId");

-- CreateIndex
CREATE INDEX "inventory_items_userId_minQuantity_idx" ON "inventory_items"("userId", "minQuantity");

-- CreateIndex
CREATE INDEX "shopping_list_items_userId_status_idx" ON "shopping_list_items"("userId", "status");

-- CreateIndex
CREATE INDEX "custom_domains_userId_idx" ON "custom_domains"("userId");

-- CreateIndex
CREATE INDEX "custom_domains_isPublic_idx" ON "custom_domains"("isPublic");

-- CreateIndex
CREATE INDEX "custom_domain_fields_customDomainId_idx" ON "custom_domain_fields"("customDomainId");

-- CreateIndex
CREATE INDEX "share_exports_userId_idx" ON "share_exports"("userId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "maintenance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_notifications" ADD CONSTRAINT "smart_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_notifications" ADD CONSTRAINT "smart_notifications_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_profiles" ADD CONSTRAINT "vehicle_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_profiles" ADD CONSTRAINT "property_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_profiles" ADD CONSTRAINT "plant_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "printer3d_profiles" ADD CONSTRAINT "printer3d_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_profiles" ADD CONSTRAINT "pet_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bicycle_profiles" ADD CONSTRAINT "bicycle_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aquarium_profiles" ADD CONSTRAINT "aquarium_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_profiles" ADD CONSTRAINT "pool_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_profiles" ADD CONSTRAINT "boat_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drone_profiles" ADD CONSTRAINT "drone_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instrument_profiles" ADD CONSTRAINT "instrument_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solar_profiles" ADD CONSTRAINT "solar_profiles_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_domain_fields" ADD CONSTRAINT "custom_domain_fields_customDomainId_fkey" FOREIGN KEY ("customDomainId") REFERENCES "custom_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_item_data" ADD CONSTRAINT "custom_item_data_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_item_data" ADD CONSTRAINT "custom_item_data_customDomainId_fkey" FOREIGN KEY ("customDomainId") REFERENCES "custom_domains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_exports" ADD CONSTRAINT "share_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_exports" ADD CONSTRAINT "share_exports_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
