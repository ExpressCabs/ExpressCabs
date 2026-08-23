-- CreateTable
CREATE TABLE "DispatchJob" (
    "id" SERIAL NOT NULL,
    "calendarEventId" TEXT,
    "calendarRecurringEventId" TEXT,
    "calendarOriginalStart" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalDescription" TEXT,
    "pickup" TEXT,
    "pickupSuburb" TEXT,
    "dropoff" TEXT,
    "dropoffSuburb" TEXT,
    "pickupAt" TIMESTAMP(3),
    "passengerCount" INTEGER,
    "passengerAssumption" TEXT,
    "luggage" TEXT,
    "vehicleRequirement" TEXT NOT NULL DEFAULT 'ANY_SUITABLE',
    "minimumFare" DECIMAL(65,30),
    "specialNotes" JSONB,
    "publicDispatchText" TEXT,
    "privateDriverText" TEXT,
    "selectedDriverName" TEXT,
    "selectedDriverPhone" TEXT,
    "selectedDriverUnit" TEXT,
    "selectedDriverVehicle" TEXT,
    "driverEtaMinutes" INTEGER,
    "dispatchedMainAt" TIMESTAMP(3),
    "dispatchedExcessAt" TIMESTAMP(3),
    "dispatchedLocalAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "calendarSyncedAt" TIMESTAMP(3),
    "calendarUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchAudit" (
    "id" SERIAL NOT NULL,
    "dispatchJobId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "actor" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DispatchJob_calendarEventId_key" ON "DispatchJob"("calendarEventId");

-- CreateIndex
CREATE INDEX "DispatchJob_pickupAt_idx" ON "DispatchJob"("pickupAt");

-- CreateIndex
CREATE INDEX "DispatchJob_status_idx" ON "DispatchJob"("status");

-- CreateIndex
CREATE INDEX "DispatchJob_source_idx" ON "DispatchJob"("source");

-- CreateIndex
CREATE INDEX "DispatchJob_calendarRecurringEventId_idx" ON "DispatchJob"("calendarRecurringEventId");

-- CreateIndex
CREATE INDEX "DispatchAudit_dispatchJobId_idx" ON "DispatchAudit"("dispatchJobId");

-- CreateIndex
CREATE INDEX "DispatchAudit_eventType_idx" ON "DispatchAudit"("eventType");

-- CreateIndex
CREATE INDEX "DispatchAudit_createdAt_idx" ON "DispatchAudit"("createdAt");

-- AddForeignKey
ALTER TABLE "DispatchAudit" ADD CONSTRAINT "DispatchAudit_dispatchJobId_fkey" FOREIGN KEY ("dispatchJobId") REFERENCES "DispatchJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
