ALTER TABLE "Ride"
ADD COLUMN "siteKey" TEXT NOT NULL DEFAULT 'prime_cabs_melbourne';

ALTER TABLE "VisitSession"
ADD COLUMN "siteKey" TEXT NOT NULL DEFAULT 'prime_cabs_melbourne';

ALTER TABLE "VisitEvent"
ADD COLUMN "siteKeySnapshot" TEXT NOT NULL DEFAULT 'prime_cabs_melbourne';

ALTER TABLE "TrafficBlockSignal"
ADD COLUMN "siteKey" TEXT NOT NULL DEFAULT 'prime_cabs_melbourne';

CREATE INDEX "Ride_siteKey_idx" ON "Ride"("siteKey");
CREATE INDEX "VisitSession_siteKey_idx" ON "VisitSession"("siteKey");
CREATE INDEX "VisitEvent_siteKeySnapshot_eventTime_idx" ON "VisitEvent"("siteKeySnapshot", "eventTime");
CREATE INDEX "TrafficBlockSignal_siteKey_idx" ON "TrafficBlockSignal"("siteKey");

DROP INDEX "TrafficBlockSignal_ipHash_reason_key";
CREATE UNIQUE INDEX "TrafficBlockSignal_ipHash_reason_siteKey_key" ON "TrafficBlockSignal"("ipHash", "reason", "siteKey");
