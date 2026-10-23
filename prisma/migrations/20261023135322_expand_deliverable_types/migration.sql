-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeliverableType" ADD VALUE 'SHORT';
ALTER TYPE "DeliverableType" ADD VALUE 'INTEGRATION';
ALTER TYPE "DeliverableType" ADD VALUE 'LIVESTREAM';
ALTER TYPE "DeliverableType" ADD VALUE 'AD_READ';
ALTER TYPE "DeliverableType" ADD VALUE 'ARTICLE';
ALTER TYPE "DeliverableType" ADD VALUE 'OTHER';
