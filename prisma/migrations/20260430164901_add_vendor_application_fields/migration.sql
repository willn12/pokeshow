-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "applicationsOpenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ShowVendor" ADD COLUMN     "applicationNote" TEXT,
ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "inventoryType" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
