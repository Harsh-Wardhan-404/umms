-- DropForeignKey
ALTER TABLE "public"."worker_efficiency" DROP CONSTRAINT "worker_efficiency_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."worker_efficiency" ADD COLUMN     "feedback_tags" JSONB,
ADD COLUMN     "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "on_time_batches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_batches_completed" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "standard_output_qty_per_shift" SET DEFAULT 0,
ALTER COLUMN "punctuality_score" SET DEFAULT 0,
ALTER COLUMN "efficiency_rating" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."worker_feedback" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "feedback_tag" TEXT NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."worker_efficiency" ADD CONSTRAINT "worker_efficiency_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_feedback" ADD CONSTRAINT "worker_feedback_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worker_feedback" ADD CONSTRAINT "worker_feedback_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
