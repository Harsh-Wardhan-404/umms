/*
  Warnings:

  - Added the required column `available_quantity` to the `finished_goods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hsn_code` to the `finished_goods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `finished_goods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `due_date` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_client_id_fkey";

-- AlterTable
ALTER TABLE "public"."finished_goods" ADD COLUMN     "available_quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "hsn_code" TEXT NOT NULL,
ADD COLUMN     "quality_status" TEXT NOT NULL DEFAULT 'Approved',
ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "due_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "payment_status" TEXT NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "contact_person" TEXT,
    "credit_limit" DOUBLE PRECISION DEFAULT 0,
    "payment_terms" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "public"."clients"("email");

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
