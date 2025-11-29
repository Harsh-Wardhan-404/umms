/*
  Warnings:

  - Added the required column `shift` to the `batches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('Planned', 'InProgress', 'QualityCheck', 'Completed', 'Cancelled');

-- AlterTable
ALTER TABLE "public"."batches" ADD COLUMN     "quality_checks" JSONB[],
ADD COLUMN     "shift" TEXT NOT NULL,
ADD COLUMN     "status" "public"."BatchStatus" NOT NULL DEFAULT 'InProgress',
ADD COLUMN     "workers" TEXT[];
