-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_services" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "staff_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_hours" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "staff_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_businessId_idx" ON "staff"("businessId");

-- CreateIndex
CREATE INDEX "staff_services_staffId_idx" ON "staff_services"("staffId");

-- CreateIndex
CREATE INDEX "staff_services_serviceId_idx" ON "staff_services"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_services_staffId_serviceId_key" ON "staff_services"("staffId", "serviceId");

-- CreateIndex
CREATE INDEX "staff_hours_staffId_idx" ON "staff_hours"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_hours_staffId_dayOfWeek_key" ON "staff_hours"("staffId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "bookings_staffId_idx" ON "bookings"("staffId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_hours" ADD CONSTRAINT "staff_hours_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
