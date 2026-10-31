-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
