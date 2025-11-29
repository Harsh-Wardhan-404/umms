/*
  Warnings:

  - The values [Worker,Dispatch,Sales] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `formulation_version_id` to the `finished_goods` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('Admin', 'InventoryManager', 'ProductionManager', 'Supervisor', 'Staff');
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" 
  USING (
    CASE 
      WHEN "role"::text = 'Worker' THEN 'Staff'::"public"."UserRole_new"
      WHEN "role"::text = 'Dispatch' THEN 'Staff'::"public"."UserRole_new"
      WHEN "role"::text = 'Sales' THEN 'Staff'::"public"."UserRole_new"
      ELSE "role"::text::"public"."UserRole_new"
    END
  );
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."batch_materials" DROP CONSTRAINT "batch_materials_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."batches" DROP CONSTRAINT "batches_formulation_version_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."batches" DROP CONSTRAINT "batches_product_name_fkey";

-- DropForeignKey
ALTER TABLE "public"."dispatches" DROP CONSTRAINT "dispatches_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_client_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_dispatch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."finished_goods" DROP CONSTRAINT "finished_goods_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."finished_goods" DROP CONSTRAINT "finished_goods_product_name_fkey";

-- DropForeignKey
ALTER TABLE "public"."formulation_ingredients" DROP CONSTRAINT "formulation_ingredients_formulation_version_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."formulation_versions" DROP CONSTRAINT "formulation_versions_formulation_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoice_items" DROP CONSTRAINT "invoice_items_invoice_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_client_id_fkey";

-- AlterTable
-- Step 1: Add the column as nullable first
ALTER TABLE "public"."finished_goods" ADD COLUMN "formulation_version_id" TEXT;

-- Step 2: Populate the new column from existing batches
UPDATE "public"."finished_goods" fg
SET "formulation_version_id" = b."formulation_version_id"
FROM "public"."batches" b
WHERE fg."batch_id" = b.id;

-- Step 3: Now make it NOT NULL
ALTER TABLE "public"."finished_goods" ALTER COLUMN "formulation_version_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."formulation_versions" ADD CONSTRAINT "formulation_versions_formulation_id_fkey" FOREIGN KEY ("formulation_id") REFERENCES "public"."formulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formulation_ingredients" ADD CONSTRAINT "formulation_ingredients_formulation_version_id_fkey" FOREIGN KEY ("formulation_version_id") REFERENCES "public"."formulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batches" ADD CONSTRAINT "batches_formulation_version_id_fkey" FOREIGN KEY ("formulation_version_id") REFERENCES "public"."formulation_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batch_materials" ADD CONSTRAINT "batch_materials_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finished_goods" ADD CONSTRAINT "finished_goods_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finished_goods" ADD CONSTRAINT "finished_goods_formulation_version_id_fkey" FOREIGN KEY ("formulation_version_id") REFERENCES "public"."formulation_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatches" ADD CONSTRAINT "dispatches_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
