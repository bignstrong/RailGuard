-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "attribution" JSONB,
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "device" TEXT;

-- CreateTable
CREATE TABLE "DailyStat" (
    "day" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "product" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("day","event","channel","product")
);

