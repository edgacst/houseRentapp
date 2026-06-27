-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "imageDataList" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imageNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
