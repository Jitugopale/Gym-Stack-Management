/** Add calendar days (UTC) */
export function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + Number(days) || 0);
  return d;
}

/** Start of UTC day */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function toDateOnlyString(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

/** Parse YYYY-MM-DD (or Date) to UTC midnight */
export function parseDateOnly(value) {
  if (value instanceof Date) return startOfDay(value);
  if (value == null || value === '') return startOfDay(new Date());
  const raw = String(value).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const err = new Error('Date must be YYYY-MM-DD');
    err.status = 400;
    throw err;
  }
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || toDateOnlyString(d) !== raw) {
    const err = new Error('Invalid calendar date');
    err.status = 400;
    throw err;
  }
  return d;
}
