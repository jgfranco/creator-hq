-- citext is not managed by Prisma; create it before the column change
CREATE EXTENSION IF NOT EXISTS citext;

-- AlterTable
ALTER TABLE "Brand" ALTER COLUMN "name" SET DATA TYPE CITEXT;
