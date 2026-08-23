-- AlterTable
ALTER TABLE "DispatchJob" ADD COLUMN "customerName" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "customerSmsSentAt" TIMESTAMP(3),
ADD COLUMN "customerSmsFingerprint" TEXT;

-- CreateTable
CREATE TABLE "DispatchBookingProposal" (
    "id" SERIAL NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "originalMessage" TEXT NOT NULL,
    "parsed" JSONB NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "pickup" TEXT,
    "pickupSuburb" TEXT,
    "dropoff" TEXT,
    "dropoffSuburb" TEXT,
    "pickupAt" TIMESTAMP(3),
    "passengerCount" INTEGER,
    "minimumFare" DECIMAL(65,30),
    "notes" JSONB,
    "calendarEventId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchBookingProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" SERIAL NOT NULL,
    "dispatchJobId" INTEGER,
    "bookingProposalId" INTEGER,
    "direction" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "replyToProviderMessageId" TEXT,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "messageType" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchBookingProposal_ownerPhone_idx" ON "DispatchBookingProposal"("ownerPhone");

-- CreateIndex
CREATE INDEX "DispatchBookingProposal_status_idx" ON "DispatchBookingProposal"("status");

-- CreateIndex
CREATE INDEX "DispatchBookingProposal_expiresAt_idx" ON "DispatchBookingProposal"("expiresAt");

-- CreateIndex
CREATE INDEX "DispatchBookingProposal_calendarEventId_idx" ON "DispatchBookingProposal"("calendarEventId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_providerMessageId_key" ON "WhatsAppMessage"("providerMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_dispatchJobId_idx" ON "WhatsAppMessage"("dispatchJobId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_bookingProposalId_idx" ON "WhatsAppMessage"("bookingProposalId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_replyToProviderMessageId_idx" ON "WhatsAppMessage"("replyToProviderMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_fromNumber_idx" ON "WhatsAppMessage"("fromNumber");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_messageType_idx" ON "WhatsAppMessage"("messageType");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_createdAt_idx" ON "WhatsAppMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_dispatchJobId_fkey" FOREIGN KEY ("dispatchJobId") REFERENCES "DispatchJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_bookingProposalId_fkey" FOREIGN KEY ("bookingProposalId") REFERENCES "DispatchBookingProposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
