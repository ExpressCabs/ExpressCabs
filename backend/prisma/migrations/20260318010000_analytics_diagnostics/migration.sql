-- AlterTable
ALTER TABLE "VisitSession"
ADD COLUMN "sourceClassificationReason" TEXT,
ADD COLUMN "melbourneClassificationReason" JSONB,
ADD COLUMN "riskReasonDetailsJson" JSONB;
