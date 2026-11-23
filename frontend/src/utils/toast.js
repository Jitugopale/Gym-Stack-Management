import { toast } from 'react-toastify';

export function showToast(message, type = 'info') {
  const text = String(message || '').trim() || 'Something went wrong';
  const options = { position: 'top-right' };

  switch (type) {
    case 'success':
      toast.success(text, options);
      break;
    case 'error':
      toast.error(text, options);
      break;
    case 'warning':
      toast.warning(text, options);
      break;
    default:
      toast.info(text, options);
  }
}

/** Map axios / API failures to a toast-friendly message. */
export function toastApiError(err, fallback = 'Request failed') {
  const status = err?.response?.status;
  const raw = err?.response?.data?.message || err?.message || fallback;
  let message = raw;

  if (status === 403 || /^forbidden$/i.test(String(raw))) {
    message = 'You do not have permission for this action';
  } else if (status === 401) {
    message = 'Session expired — please sign in again';
  }

  showToast(message, 'error');
  return message;
}
