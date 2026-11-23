import * as invoiceService from '../../../services/admin/gymInvoiceService.js';
import billingLifecycleService from '../../../services/billingLifecycleService.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export function listPlans(req, res, next) {
  handle(res, next, () =>
    invoiceService.listSubscriptionPlans({ all: req.query.all === '1' })
  );
}

export function createPlan(req, res, next) {
  handle(res, next, () => invoiceService.createSubscriptionPlan(req.body));
}

export function updatePlan(req, res, next) {
  handle(res, next, () =>
    invoiceService.updateSubscriptionPlan(req.params.id, req.body)
  );
}

export function deletePlan(req, res, next) {
  handle(res, next, () => invoiceService.deleteSubscriptionPlan(req.params.id));
}

export function listInvoices(req, res, next) {
  handle(res, next, () =>
    invoiceService.listInvoices({
      gymId: req.query.gymId,
      status: req.query.status,
    })
  );
}

export function createInvoice(req, res, next) {
  handle(res, next, () =>
    invoiceService.createRenewalInvoice(req.body.gymId, {
      sendEmail: req.body.sendEmail !== false,
    })
  );
}

export function markPaid(req, res, next) {
  handle(res, next, () => invoiceService.markInvoicePaid(req.params.id));
}

export function advanceBilling(req, res, next) {
  handle(res, next, () => billingLifecycleService.advanceAllGyms());
}
