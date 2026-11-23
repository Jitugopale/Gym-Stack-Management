import * as platformUserService from '../../../services/admin/platformUserService.js';

function handle(res, next, fn) {
  Promise.resolve(fn())
    .then((data) => res.json(data))
    .catch(next);
}

export function listUsers(req, res, next) {
  handle(res, next, () => platformUserService.listPlatformUsers());
}

export function listRoles(req, res, next) {
  handle(res, next, () => platformUserService.listPlatformRoles());
}

export function createUser(req, res, next) {
  handle(res, next, () => platformUserService.createPlatformUser(req.body));
}

export function updateUser(req, res, next) {
  handle(res, next, () =>
    platformUserService.updatePlatformUser(req.params.id, req.body)
  );
}

export function deleteUser(req, res, next) {
  handle(res, next, () => platformUserService.deletePlatformUser(req.params.id));
}

export function setRequireEmailOtp(req, res, next) {
  handle(res, next, () =>
    platformUserService.setRequireEmailOtp(
      req.params.id,
      req.body.requireEmailOtp
    )
  );
}
