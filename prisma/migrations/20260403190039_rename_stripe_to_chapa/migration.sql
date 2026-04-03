/*
  Warnings:

  - You are about to drop the column `stripePaymentId` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[chapaTransactionRef]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payments_stripePaymentId_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "stripePaymentId",
ADD COLUMN     "chapaTransactionRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_chapaTransactionRef_key" ON "payments"("chapaTransactionRef");
