-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "totpSecret" DROP NOT NULL;
ALTER TABLE "AdminUser" ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
