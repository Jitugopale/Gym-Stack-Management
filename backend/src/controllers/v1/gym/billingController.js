import * as invoiceService from '../../../services/admin/gymInvoiceService.js';
import prisma from '../../../config/database.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export function billingStatus(req, res, next) {
  handle(res, next, async () => {
    const gym = await prisma.gym.findUnique({
      where: { id: req.gymId },
      include: { subscriptionPlan: true },
    });
    const invoices = await invoiceService.listInvoices({ gymId: req.gymId });
    return {
      status: gym.status,
      periodEndsAt: gym.periodEndsAt,
      graceEndsAt: gym.graceEndsAt,
      softLockEndsAt: gym.softLockEndsAt,
      plan: gym.subscriptionPlan,
      invoices,
    };
  });
}
