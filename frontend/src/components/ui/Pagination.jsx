import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function buildPageItems(current, pages) {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pages - 1, current + 1);

  if (start > 2) items.push('ellipsis');
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < pages - 1) items.push('ellipsis');
  items.push(pages);

  return items;
}

const chipClass =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center border px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

/**
 * FitPlus-style list footer: "Showing X–Y of Z" + rows-per-page + page controls.
 * Pass `limit` from local state so the select does not snap back while refetching.
 */
export function Pagination({
  pagination,
  onPage,
  onLimitChange,
  limit: limitProp,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) {
  if (!pagination) return null;

  const current = Number(pagination.current) || 1;
  const limit = Number(limitProp ?? pagination.limit) || 10;
  const total = Number(pagination.total) || 0;
  const pages = Math.max(
    1,
    Number(pagination.pages) || Math.ceil(total / limit) || 1
  );
  const canChangeLimit = typeof onLimitChange === 'function';
  const canChangePage = typeof onPage === 'function';

  if (total <= 0) return null;
  if (!canChangeLimit && total < 10 && pages <= 1) return null;

  const from = Math.min((current - 1) * limit + 1, total);
  const to = Math.min(current * limit, total);
  const items = buildPageItems(current, pages);
  const showPager = canChangePage && pages > 1;

  return (
    <nav
      className="flex w-full flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted-foreground)]">
        <span>
          Showing{' '}
          <span className="font-semibold text-[var(--foreground)]">
            {from}–{to}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-[var(--foreground)]">{total}</span>
        </span>

        {canChangeLimit ? (
          <label className="inline-flex items-center gap-2">
            <span className="whitespace-nowrap">Rows per page</span>
            <select
              className="h-8 cursor-pointer border border-[var(--border)] bg-white px-2 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--brand-ink)] focus:ring-2 focus:ring-[var(--primary)]/40"
              value={String(limit)}
              onChange={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onLimitChange(Number(event.target.value));
              }}
              onClick={(event) => event.stopPropagation()}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {showPager ? (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={current <= 1}
            onClick={() => onPage(Math.max(1, current - 1))}
            aria-label="Previous page"
            className={`${chipClass} gap-1 border-[var(--border)] bg-white px-2.5 text-[var(--foreground)] hover:bg-[var(--muted)]`}
          >
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {items.map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-8 min-w-8 items-center justify-center text-sm text-[var(--muted-foreground)]"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  aria-current={item === current ? 'page' : undefined}
                  aria-label={`Page ${item}`}
                  onClick={() => onPage(item)}
                  className={
                    item === current
                      ? `${chipClass} border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--primary)]`
                      : `${chipClass} border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted)]`
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            disabled={current >= pages}
            onClick={() => onPage(Math.min(pages, current + 1))}
            aria-label="Next page"
            className={`${chipClass} gap-1 border-[var(--border)] bg-white px-2.5 text-[var(--foreground)] hover:bg-[var(--muted)]`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}
    </nav>
  );
}

export { PAGE_SIZE_OPTIONS };
