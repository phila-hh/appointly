-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancellationDeadline" TIMESTAMP(3),
ADD COLUMN     "cancellationFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isCancellable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_customerId_idx" ON "favorites"("customerId");

-- CreateIndex
CREATE INDEX "favorites_businessId_idx" ON "favorites"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_customerId_businessId_key" ON "favorites"("customerId", "businessId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
