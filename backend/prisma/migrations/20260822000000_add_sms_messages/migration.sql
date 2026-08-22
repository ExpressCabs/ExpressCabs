-- CreateTable
CREATE TABLE "SmsMessage" (
    "id" SERIAL NOT NULL,
    "rideId" INTEGER,
    "recipient" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "cost" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "SmsMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsMessage_rideId_idx" ON "SmsMessage"("rideId");

-- CreateIndex
CREATE INDEX "SmsMessage_recipient_idx" ON "SmsMessage"("recipient");

-- CreateIndex
CREATE INDEX "SmsMessage_messageType_idx" ON "SmsMessage"("messageType");

-- CreateIndex
CREATE INDEX "SmsMessage_provider_idx" ON "SmsMessage"("provider");

-- CreateIndex
CREATE INDEX "SmsMessage_createdAt_idx" ON "SmsMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;
