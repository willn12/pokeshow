-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "announcementBanner" TEXT,
ADD COLUMN     "faq" JSONB,
ADD COLUMN     "logistics" TEXT,
ADD COLUMN     "schedule" JSONB,
ADD COLUMN     "showCountdown" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'red';
