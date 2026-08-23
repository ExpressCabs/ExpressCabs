const smsService = require('../sms/smsService');
const { buildAssignmentSms } = require('../whatsapp/whatsappMessageBuilder');
const { extractAustralianPhone } = require('../whatsapp/ownerParsers');

const getCustomerPhone = (job) => job.customerPhone || extractAustralianPhone(job.originalDescription || '');

const getAssignmentFingerprint = (job) => [
  job.selectedDriverUnit || '',
  job.selectedDriverVehicle || '',
  job.driverEtaMinutes || '',
].join('|');

const sendCustomerAssignmentSmsIfNeeded = async (prisma, job) => {
  const phone = getCustomerPhone(job);
  if (!phone) {
    await prisma.dispatchAudit.create({
      data: {
        dispatchJobId: job.id,
        eventType: 'CUSTOMER_SMS_SKIPPED',
        actor: 'SYSTEM',
        details: { reason: 'CUSTOMER_PHONE_UNAVAILABLE' },
      },
    });
    return { sent: false, reason: 'CUSTOMER_PHONE_UNAVAILABLE' };
  }

  const fingerprint = getAssignmentFingerprint(job);
  if (job.customerSmsSentAt && job.customerSmsFingerprint === fingerprint) {
    return { sent: false, reason: 'DUPLICATE_ASSIGNMENT_SMS' };
  }

  const result = await smsService.send({
    to: phone,
    type: 'CUSTOMER_ASSIGNMENT_CONFIRMATION',
    message: buildAssignmentSms({
      vehicle: job.selectedDriverVehicle,
      unit: job.selectedDriverUnit,
      etaMinutes: job.driverEtaMinutes,
    }),
    metadata: { dispatchJobId: job.id },
  });

  if (result.success) {
    await prisma.dispatchJob.update({
      where: { id: job.id },
      data: {
        customerPhone: phone,
        customerSmsSentAt: new Date(),
        customerSmsFingerprint: fingerprint,
      },
    });
  }

  await prisma.dispatchAudit.create({
    data: {
      dispatchJobId: job.id,
      eventType: result.success ? 'CUSTOMER_SMS_SENT' : 'CUSTOMER_SMS_FAILED',
      actor: 'SYSTEM',
      details: result.success ? { phone } : { phone, error: result.error },
    },
  });

  return { sent: result.success, result };
};

module.exports = {
  getCustomerPhone,
  sendCustomerAssignmentSmsIfNeeded,
};
