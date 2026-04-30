-- AlterTable
ALTER TABLE "ForumPost" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "tag" TEXT NOT NULL DEFAULT 'general';

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
