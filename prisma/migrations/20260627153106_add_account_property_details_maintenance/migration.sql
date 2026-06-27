-- CreateEnum
CREATE TYPE "MaintenanceChargeStatus" AS ENUM ('PAID', 'UNPAID', 'LATE');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "builtYear" INTEGER,
ADD COLUMN     "documentDataList" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "documentNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasElevator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managementType" TEXT,
ADD COLUMN     "managerName" TEXT,
ADD COLUMN     "managerPhone" TEXT,
ADD COLUMN     "memo" TEXT,
ADD COLUMN     "parkingAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalFloors" INTEGER;

-- CreateTable
CREATE TABLE "MaintenanceCharge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT,
    "title" TEXT NOT NULL,
    "billingMonth" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "MaintenanceChargeStatus" NOT NULL DEFAULT 'UNPAID',
    "paidDate" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceCharge_userId_idx" ON "MaintenanceCharge"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceCharge_propertyId_idx" ON "MaintenanceCharge"("propertyId");

-- CreateIndex
CREATE INDEX "MaintenanceCharge_roomId_idx" ON "MaintenanceCharge"("roomId");

-- AddForeignKey
ALTER TABLE "MaintenanceCharge" ADD CONSTRAINT "MaintenanceCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCharge" ADD CONSTRAINT "MaintenanceCharge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceCharge" ADD CONSTRAINT "MaintenanceCharge_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
