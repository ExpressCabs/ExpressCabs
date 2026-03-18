-- CreateTable
CREATE TABLE "Visitor" (
    "id" SERIAL NOT NULL,
    "visitorToken" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstSourceType" TEXT,
    "firstLandingPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitSession" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "visitorId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "landingUrl" TEXT,
    "landingPath" TEXT,
    "referrer" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'direct',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "gclid" TEXT,
    "gbraid" TEXT,
    "wbraid" TEXT,
    "geoCity" TEXT,
    "geoRegion" TEXT,
    "geoCountry" TEXT,
    "isLikelyMelbourne" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "deviceType" TEXT,
    "screenWidth" INTEGER,
    "timezone" TEXT,
    "sessionDurationSec" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskBand" TEXT NOT NULL DEFAULT 'good',
    "riskReasonsJson" JSONB,
    "attributedRideId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitEvent" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "visitorId" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT,
    "pageTitle" TEXT,
    "stepName" TEXT,
    "pickupSuburb" TEXT,
    "dropoffSuburb" TEXT,
    "isAirportPickup" BOOLEAN,
    "isAirportDropoff" BOOLEAN,
    "estimatedFare" DOUBLE PRECISION,
    "vehicleType" TEXT,
    "passengerCount" INTEGER,
    "bookingType" TEXT,
    "bookingDateTime" TIMESTAMP(3),
    "clickTarget" TEXT,
    "clickLocation" TEXT,
    "metadataJson" JSONB,
    "sourceTypeSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficBlockSignal" (
    "id" SERIAL NOT NULL,
    "ipHash" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "paidSessionCount" INTEGER NOT NULL DEFAULT 0,
    "suspiciousSessionCount" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrafficBlockSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitSecuritySnapshot" (
    "id" SERIAL NOT NULL,
    "rawIp" TEXT,
    "ipHash" TEXT,
    "headersJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitSecuritySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_visitorToken_key" ON "Visitor"("visitorToken");

-- CreateIndex
CREATE UNIQUE INDEX "VisitSession_sessionToken_key" ON "VisitSession"("sessionToken");

-- CreateIndex
CREATE INDEX "VisitSession_visitorId_idx" ON "VisitSession"("visitorId");

-- CreateIndex
CREATE INDEX "VisitSession_startedAt_idx" ON "VisitSession"("startedAt");

-- CreateIndex
CREATE INDEX "VisitSession_sourceType_idx" ON "VisitSession"("sourceType");

-- CreateIndex
CREATE INDEX "VisitSession_gclid_idx" ON "VisitSession"("gclid");

-- CreateIndex
CREATE INDEX "VisitSession_ipHash_idx" ON "VisitSession"("ipHash");

-- CreateIndex
CREATE INDEX "VisitSession_riskBand_idx" ON "VisitSession"("riskBand");

-- CreateIndex
CREATE INDEX "VisitSession_landingPath_idx" ON "VisitSession"("landingPath");

-- CreateIndex
CREATE INDEX "VisitEvent_sessionId_eventTime_idx" ON "VisitEvent"("sessionId", "eventTime");

-- CreateIndex
CREATE INDEX "VisitEvent_eventName_eventTime_idx" ON "VisitEvent"("eventName", "eventTime");

-- CreateIndex
CREATE INDEX "VisitEvent_pickupSuburb_idx" ON "VisitEvent"("pickupSuburb");

-- CreateIndex
CREATE INDEX "VisitEvent_dropoffSuburb_idx" ON "VisitEvent"("dropoffSuburb");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficBlockSignal_ipHash_reason_key" ON "TrafficBlockSignal"("ipHash", "reason");

-- CreateIndex
CREATE INDEX "TrafficBlockSignal_status_idx" ON "TrafficBlockSignal"("status");

-- CreateIndex
CREATE INDEX "VisitSecuritySnapshot_expiresAt_idx" ON "VisitSecuritySnapshot"("expiresAt");

-- CreateIndex
CREATE INDEX "VisitSecuritySnapshot_ipHash_idx" ON "VisitSecuritySnapshot"("ipHash");

-- AddForeignKey
ALTER TABLE "VisitSession" ADD CONSTRAINT "VisitSession_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitSession" ADD CONSTRAINT "VisitSession_attributedRideId_fkey" FOREIGN KEY ("attributedRideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvent" ADD CONSTRAINT "VisitEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VisitSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitEvent" ADD CONSTRAINT "VisitEvent_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
