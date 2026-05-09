-- AlterTable: add new columns
ALTER TABLE "ShowVendor" ADD COLUMN "requestedQuantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ShowVendor" ADD COLUMN "approvedQuantity" INTEGER;
ALTER TABLE "ShowVendor" ADD COLUMN "inventoryTypes" TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing single inventoryType value into the new array column
UPDATE "ShowVendor" SET "inventoryTypes" = ARRAY["inventoryType"] WHERE "inventoryType" IS NOT NULL;

-- Drop old single-value column
ALTER TABLE "ShowVendor" DROP COLUMN "inventoryType";
