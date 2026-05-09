-- CreateTable
CREATE TABLE "TableTier" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TableTier_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Show" ADD COLUMN "floorPlan" JSONB;

-- AlterTable
ALTER TABLE "ShowVendor" ADD COLUMN "tableTierId" TEXT;

-- AddForeignKey
ALTER TABLE "TableTier" ADD CONSTRAINT "TableTier_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowVendor" ADD CONSTRAINT "ShowVendor_tableTierId_fkey" FOREIGN KEY ("tableTierId") REFERENCES "TableTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
