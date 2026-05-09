-- AlterTable: replace raw embed column with structured slugs
ALTER TABLE "Show" DROP COLUMN IF EXISTS "ontreasureEmbed";
ALTER TABLE "Show" ADD COLUMN "ontreasureEventSlug" TEXT;
ALTER TABLE "Show" ADD COLUMN "ontreasureUsername" TEXT;
