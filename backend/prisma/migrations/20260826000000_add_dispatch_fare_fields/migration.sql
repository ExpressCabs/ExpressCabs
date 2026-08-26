ALTER TABLE "DispatchJob"
ADD COLUMN "fareType" TEXT,
ADD COLUMN "fareAmount" DECIMAL(65,30),
ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "boa" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "DispatchBookingProposal"
ADD COLUMN "fareType" TEXT,
ADD COLUMN "fareAmount" DECIMAL(65,30),
ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "boa" BOOLEAN NOT NULL DEFAULT false;

UPDATE "DispatchJob"
SET "fareType" = 'MINIMUM', "fareAmount" = "minimumFare"
WHERE "minimumFare" IS NOT NULL;

UPDATE "DispatchBookingProposal"
SET "fareType" = 'MINIMUM', "fareAmount" = "minimumFare"
WHERE "minimumFare" IS NOT NULL;
