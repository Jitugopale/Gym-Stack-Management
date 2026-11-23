import * as gymService from '../../../services/admin/gymService.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export function dashboard(req, res, next) {
  handle(res, next, () => gymService.adminDashboard());
}

export function listGyms(req, res, next) {
  handle(res, next, () => gymService.listGyms());
}

export function createGym(req, res, next) {
  handle(res, next, () => gymService.createGym(req.body));
}

export function updateGym(req, res, next) {
  handle(res, next, () => gymService.updateGym(req.params.id, req.body));
}

export function deleteGym(req, res, next) {
  handle(res, next, () => gymService.deleteGym(req.params.id));
}

export function getGymFeatures(req, res, next) {
  handle(res, next, () => gymService.getGymFeatures(req.params.id));
}

export function setGymFeatures(req, res, next) {
  handle(res, next, () =>
    gymService.setGymFeatures(req.params.id, req.body.features || [])
  );
}
