-- AlterEnum
ALTER TYPE "LeaveStatus" ADD VALUE 'pending_hr';

-- AlterTable
ALTER TABLE "leaves" ADD COLUMN     "current_approval_step" TEXT NOT NULL DEFAULT 'manager',
ADD COLUMN     "hr_comment" TEXT,
ADD COLUMN     "hr_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "hr_reviewer_id" TEXT,
ADD COLUMN     "manager_comment" TEXT,
ADD COLUMN     "manager_reviewed_at" TIMESTAMP(3),
ADD COLUMN     "manager_reviewer_id" TEXT;

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "leave_type_id" TEXT NOT NULL,
    "requires_hr" BOOLEAN NOT NULL DEFAULT false,
    "min_days_for_hr" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflows_leave_type_id_key" ON "approval_workflows"("leave_type_id");

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_manager_reviewer_id_fkey" FOREIGN KEY ("manager_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_hr_reviewer_id_fkey" FOREIGN KEY ("hr_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_leave_type_id_fkey" FOREIGN KEY ("leave_type_id") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
