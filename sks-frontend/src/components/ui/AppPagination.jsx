import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppButton } from '@/components/ui/AppButton.jsx';
import { cn } from '@/lib/utils.js';

function buildPageItems(page, totalPages) {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set();
  pages.add(1);
  pages.add(totalPages);

  for (let current = page - 1; current <= page + 1; current += 1) {
    if (current > 1 && current < totalPages) {
      pages.add(current);
    }
  }

  const ordered = Array.from(pages).sort((a, b) => a - b);
  const items = [];

  ordered.forEach((value, index) => {
    const previous = ordered[index - 1];
    if (previous && value - previous > 1) {
      items.push('ellipsis');
    }
    items.push(value);
  });

  return items;
}

export function AppPagination({ onPageChange, page, totalPages }) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPageItems(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <AppButton
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        leadingIcon={<ChevronLeft className="h-4 w-4" />}
      >
        Prev
      </AppButton>

      {items.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-sm font-black text-slate-400"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={cn(
              'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-black transition-all',
              item === page
                ? 'bg-brand-900 text-white shadow-[var(--shadow-brand)]'
                : 'glass text-slate-600 hover:-translate-y-0.5 hover:text-brand-600',
            )}
          >
            {item}
          </button>
        ),
      )}

      <AppButton
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        trailingIcon={<ChevronRight className="h-4 w-4" />}
      >
        Next
      </AppButton>
    </div>
  );
}
