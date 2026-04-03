/*
  Warnings:

  - You are about to drop the column `emailVerification` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerification",
ADD COLUMN     "emailVerified" TIMESTAMP(3);
