-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('Admin', 'Supervisor', 'Worker', 'Dispatch', 'Sales');

-- CreateEnum
CREATE TYPE "public"."StockType" AS ENUM ('Raw', 'Packaging', 'Consumable');

-- CreateEnum
CREATE TYPE "public"."DispatchStatus" AS ENUM ('Ready', 'InTransit', 'Delivered');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_management" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."StockType" NOT NULL,
    "unit" TEXT NOT NULL,
    "current_stock_qty" DOUBLE PRECISION NOT NULL,
    "min_threshold_qty" DOUBLE PRECISION NOT NULL,
    "purchase_history" JSONB[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."formulations" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."formulation_versions" (
    "id" TEXT NOT NULL,
    "formulation_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "creator_id" TEXT NOT NULL,
    "creation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "formulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."formulation_ingredients" (
    "id" TEXT NOT NULL,
    "formulation_version_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "percentage_or_composition" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "formulation_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."batches" (
    "id" TEXT NOT NULL,
    "batch_code" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "formulation_version_id" TEXT NOT NULL,
    "batch_size" DOUBLE PRECISION NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "raw_materials_used" JSONB[],
    "qr_code_data" TEXT NOT NULL,
    "photos" JSONB[],
    "production_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."batch_materials" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity_used" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "batch_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."finished_goods" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity_produced" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finished_goods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "items" JSONB[],
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax_details" JSONB NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "invoice_pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "finished_good_id" TEXT NOT NULL,
    "batch_code" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "hsn_code" TEXT NOT NULL,
    "price_per_unit" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dispatches" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "courier_name" TEXT NOT NULL,
    "awb_number" TEXT NOT NULL,
    "dispatch_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."DispatchStatus" NOT NULL,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id" TEXT NOT NULL,
    "dispatch_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "rating_quality" INTEGER NOT NULL,
    "rating_packaging" INTEGER NOT NULL,
    "rating_delivery" INTEGER NOT NULL,
    "client_remarks" TEXT,
    "issue_tags" TEXT[],
    "feedback_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."worker_efficiency" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "standard_output_qty_per_shift" DOUBLE PRECISION NOT NULL,
    "punctuality_score" DOUBLE PRECISION NOT NULL,
    "efficiency_rating" DOUBLE PRECISION NOT NULL,
    "batch_history" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_efficiency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profit_loss" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "fixed_expenses" JSONB NOT NULL,
    "variable_expenses" JSONB NOT NULL,
    "total_sales_value" DOUBLE PRECISION NOT NULL,
    "gross_profit" DOUBLE PRECISION NOT NULL,
    "net_profit" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profit_loss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stock_management_name_key" ON "public"."stock_management"("name");

-- CreateIndex
CREATE UNIQUE INDEX "formulations_product_name_key" ON "public"."formulations"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "formulation_versions_formulation_id_version_number_key" ON "public"."formulation_versions"("formulation_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "batches_batch_code_key" ON "public"."batches"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_batch_id_key" ON "public"."finished_goods"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "public"."invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "dispatches_invoice_id_key" ON "public"."dispatches"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_dispatch_id_key" ON "public"."feedback"("dispatch_id");

-- CreateIndex
CREATE UNIQUE INDEX "worker_efficiency_user_id_key" ON "public"."worker_efficiency"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profit_loss_month_key" ON "public"."profit_loss"("month");

-- AddForeignKey
ALTER TABLE "public"."formulation_versions" ADD CONSTRAINT "formulation_versions_formulation_id_fkey" FOREIGN KEY ("formulation_id") REFERENCES "public"."formulations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formulation_versions" ADD CONSTRAINT "formulation_versions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formulation_ingredients" ADD CONSTRAINT "formulation_ingredients_formulation_version_id_fkey" FOREIGN KEY ("formulation_version_id") REFERENCES "public"."formulation_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."formulation_ingredients" ADD CONSTRAINT "formulation_ingredients_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."stock_management"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batches" ADD CONSTRAINT "batches_formulation_version_id_fkey" FOREIGN KEY ("formulation_version_id") REFERENCES "public"."formulation_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batches" ADD CONSTRAINT "batches_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batches" ADD CONSTRAINT "batches_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "public"."formulations"("product_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batch_materials" ADD CONSTRAINT "batch_materials_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."batch_materials" ADD CONSTRAINT "batch_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."stock_management"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finished_goods" ADD CONSTRAINT "finished_goods_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."finished_goods" ADD CONSTRAINT "finished_goods_product_name_fkey" FOREIGN KEY ("product_name") REFERENCES "public"."formulations"("product_name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_finished_good_id_fkey" FOREIGN KEY ("finished_good_id") REFERENCES "public"."finished_goods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatches" ADD CONSTRAINT "dispatches_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatches" ADD CONSTRAINT "dispatches_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_efficiency" ADD CONSTRAINT "worker_efficiency_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
