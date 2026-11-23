import * as memberService from '../../../services/gym/memberService.js';
import * as planService from '../../../services/gym/planService.js';
import * as paymentService from '../../../services/gym/paymentService.js';
import * as gymService from '../../../services/admin/gymService.js';
import * as staffService from '../../../services/gym/staffService.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export function publicGym(req, res, next) {
  handle(res, next, async () => {
    const gym = await gymService.getGymBySlug(req.params.slug);
    if (!gym) {
      const err = new Error('Gym not found');
      err.status = 404;
      throw err;
    }
    return {
      id: gym.id,
      name: gym.name,
      slug: gym.slug,
      status: gym.status,
    };
  });
}

export function dashboard(req, res, next) {
  handle(res, next, () => paymentService.gymDashboard(req.gymId));
}

export function listMembers(req, res, next) {
  handle(res, next, () => memberService.listMembers(req.gymId, req.query));
}

export function createMember(req, res, next) {
  handle(res, next, () => memberService.createMember(req.gymId, req.body));
}

export function renewMember(req, res, next) {
  handle(res, next, () =>
    memberService.renewMember(req.gymId, req.params.id, req.body)
  );
}

export function updateMember(req, res, next) {
  handle(res, next, () =>
    memberService.updateMember(req.gymId, req.params.id, req.body)
  );
}

export function deleteMember(req, res, next) {
  handle(res, next, () => memberService.deleteMember(req.gymId, req.params.id));
}

export function listPlans(req, res, next) {
  handle(res, next, () => planService.listPlans(req.gymId));
}

export function createPlan(req, res, next) {
  handle(res, next, () => planService.createPlan(req.gymId, req.body));
}

export function updatePlan(req, res, next) {
  handle(res, next, () =>
    planService.updatePlan(req.gymId, req.params.id, req.body)
  );
}

export function deletePlan(req, res, next) {
  handle(res, next, () => planService.deletePlan(req.gymId, req.params.id));
}

export function listPayments(req, res, next) {
  handle(res, next, () => paymentService.listPayments(req.gymId));
}

export function createPayment(req, res, next) {
  handle(res, next, () => paymentService.createPayment(req.gymId, req.body));
}

export function listStaff(req, res, next) {
  handle(res, next, () => staffService.listStaff(req.gymId));
}

export function createStaff(req, res, next) {
  handle(res, next, () => staffService.createStaff(req.gymId, req.body));
}

export function deleteStaff(req, res, next) {
  handle(res, next, () => staffService.deleteStaff(req.gymId, req.params.id));
}

export function setStaffRequireEmailOtp(req, res, next) {
  handle(res, next, () =>
    staffService.setStaffRequireEmailOtp(
      req.gymId,
      req.params.id,
      req.body.requireEmailOtp
    )
  );
}
