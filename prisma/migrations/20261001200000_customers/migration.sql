-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_email_key" ON "Customer"("phone", "email");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Покупатели из уже существующих заказов: одна пара «телефон + email» (email без учёта регистра) — один покупатель.
INSERT INTO "Customer" ("id", "phone", "email", "createdAt")
SELECT 'c' || md5(phone || '|' || email), phone, email, first_at
FROM (
  SELECT "contact"->>'phone' AS phone, lower(trim("contact"->>'email')) AS email, min("createdAt") AS first_at
  FROM "Order"
  WHERE coalesce("contact"->>'phone', '') <> '' AND coalesce("contact"->>'email', '') <> ''
  GROUP BY 1, 2
) s;

UPDATE "Order" o
SET "customerId" = c."id"
FROM "Customer" c
WHERE c."phone" = o."contact"->>'phone' AND c."email" = lower(trim(o."contact"->>'email'));
