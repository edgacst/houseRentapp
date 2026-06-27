-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "attachmentData" TEXT,
ADD COLUMN     "attachmentName" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "imageData" TEXT,
ADD COLUMN     "imageName" TEXT;
