import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, Pagination } from '@/components/ui/Pagination';

function Spinner({ className = 'size-4' }) {
  return (
    <Loader2
      className={`animate-spin ${className}`}
      strokeWidth={2.25}
      aria-hidden
    />
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {/* Manrope — Syne clips descenders (g/y/p) in page titles */}
        <h2 className="text-2xl font-extrabold leading-normal tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm leading-5 text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`border border-[var(--border)] bg-[var(--bg)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({ label, value }) {
  return (
    <Card>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold leading-normal text-[var(--brand-ink)]">
        {value}
      </p>
    </Card>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  disabled,
  loadingText,
  ...props
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[var(--brand-ink)] text-[var(--primary)] hover:bg-[var(--brand-panel)]'
      : variant === 'danger'
        ? 'border border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10'
        : 'border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--bg)]';

  const { type = 'button', ...rest } = props;
  const isDisabled = Boolean(disabled || loading);

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

function FieldLabel({ label, required }) {
  if (!label) return null;
  return (
    <span className="mb-1.5 block font-semibold text-[var(--foreground)]">
      {label}
      {required ? (
        <span className="text-[var(--destructive)]" aria-hidden="true">
          {' '}
          *
        </span>
      ) : null}
    </span>
  );
}

const inputControlClass =
  'h-11 w-full border border-[var(--input)] bg-white px-3 outline-none focus:border-[var(--brand-ink)] focus:ring-2 focus:ring-[var(--primary)]/40';

/** Digits only (optional decimals). No browser spinner UI. */
export function onlyAmountInput(value) {
  const cleaned = String(value ?? '')
    .replace(/[^\d.]/g, '')
    .replace(/^(\d*\.?\d*).*$/, '$1');
  const [whole, fraction] = cleaned.split('.');
  if (fraction == null) return whole;
  return `${whole}.${fraction.slice(0, 2)}`;
}

export function onlyIntegerInput(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function Input({
  label,
  required,
  type,
  onChange,
  onKeyDown,
  autoComplete,
  integer = false,
  className = '',
  ...props
}) {
  const isNumeric = type === 'number';
  const { min, max, step, ...rest } = props;

  return (
    <label className="block text-sm">
      <FieldLabel label={label} required={required} />
      <input
        {...rest}
        type={isNumeric ? 'text' : type}
        inputMode={isNumeric ? (integer ? 'numeric' : 'decimal') : undefined}
        autoComplete={isNumeric ? 'off' : autoComplete}
        required={required}
        aria-required={required || undefined}
        min={isNumeric ? undefined : min}
        max={isNumeric ? undefined : max}
        step={isNumeric ? undefined : step}
        className={`${inputControlClass}${isNumeric ? ' tabular-nums' : ''} ${className}`.trim()}
        onChange={(event) => {
          if (!onChange) return;
          if (isNumeric) {
            const next = integer
              ? onlyIntegerInput(event.target.value)
              : onlyAmountInput(event.target.value);
            onChange({
              ...event,
              target: { ...event.target, value: next },
            });
            return;
          }
          onChange(event);
        }}
        onKeyDown={(event) => {
          if (isNumeric && ['e', 'E', '+', '-'].includes(event.key)) {
            event.preventDefault();
          }
          onKeyDown?.(event);
        }}
      />
    </label>
  );
}

export function Select({ label, required, children, ...props }) {
  return (
    <label className="block text-sm">
      <FieldLabel label={label} required={required} />
      <select
        required={required}
        aria-required={required || undefined}
        className="h-11 w-full border border-[var(--input)] bg-white px-3 outline-none focus:border-[var(--brand-ink)] focus:ring-2 focus:ring-[var(--primary)]/40"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

/**
 * FitPlus-style table with client pagination by default.
 * Pass `pagination` + `onPage` (+ optional `onLimitChange`) for server-driven lists.
 */
export function Table({
  columns,
  rows,
  empty = 'No records yet.',
  paginate = true,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  defaultPageSize = 10,
  pagination: serverPagination,
  onPage: onPageProp,
  onLimitChange: onLimitChangeProp,
  limit: limitProp,
}) {
  const list = Array.isArray(rows) ? rows : [];
  const serverMode = Boolean(serverPagination);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);

  const activeLimit = Number(limitProp ?? (serverMode ? serverPagination?.limit : limit)) || defaultPageSize;
  const activePage = serverMode
    ? Number(serverPagination?.current) || 1
    : page;

  useEffect(() => {
    if (serverMode) return;
    const pages = Math.max(1, Math.ceil(list.length / activeLimit) || 1);
    if (page > pages) setPage(pages);
  }, [serverMode, list.length, activeLimit, page]);

  useEffect(() => {
    if (serverMode) return;
    setPage(1);
  }, [serverMode, list.length]);

  const pageRows = useMemo(() => {
    if (!paginate || serverMode) return list;
    const start = (activePage - 1) * activeLimit;
    return list.slice(start, start + activeLimit);
  }, [paginate, serverMode, list, activePage, activeLimit]);

  const pagination = useMemo(() => {
    if (!paginate) return null;
    if (serverMode) return serverPagination;
    const total = list.length;
    return {
      current: activePage,
      limit: activeLimit,
      total,
      pages: Math.max(1, Math.ceil(total / activeLimit) || 1),
    };
  }, [paginate, serverMode, serverPagination, list.length, activePage, activeLimit]);

  const handlePage = (next) => {
    if (typeof onPageProp === 'function') onPageProp(next);
    else setPage(next);
  };

  const handleLimitChange = (next) => {
    if (typeof onLimitChangeProp === 'function') onLimitChangeProp(next);
    else {
      setLimit(next);
      setPage(1);
    }
  };

  if (!list.length) {
    return <p className="text-sm text-[var(--muted-foreground)]">{empty}</p>;
  }

  return (
    <div className="border border-[var(--border)] bg-[var(--surface-elevated)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--bg)] text-[var(--muted-foreground)]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 font-bold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, index) => (
              <tr
                key={row.id || `${activePage}-${index}`}
                className="border-t border-[var(--border)]"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-[var(--foreground)]">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginate ? (
        <Pagination
          pagination={pagination}
          onPage={handlePage}
          onLimitChange={
            serverMode && typeof onLimitChangeProp !== 'function'
              ? undefined
              : handleLimitChange
          }
          limit={activeLimit}
          pageSizeOptions={pageSizeOptions}
        />
      ) : null}
    </div>
  );
}

