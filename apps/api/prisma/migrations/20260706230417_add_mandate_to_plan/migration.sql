-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "autoSaveEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mandateAdviceStatus" TEXT,
ADD COLUMN     "mandateId" TEXT,
ADD COLUMN     "mandateStatus" TEXT,
ADD COLUMN     "merchantReference" TEXT;
