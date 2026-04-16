-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "sentimentLabel" TEXT,
ADD COLUMN     "sentimentScore" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "reviews_sentimentLabel_idx" ON "reviews"("sentimentLabel");
