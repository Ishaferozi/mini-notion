import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/types";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id} className="flex items-center gap-1">
              {index > 0 && (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-neutral-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              )}
              {isLast ? (
                <span
                  className="font-medium text-neutral-700 truncate max-w-[180px]"
                  aria-current="page"
                >
                  {item.title}
                </span>
              ) : (
                <Link
                  href={`/pages/${item.id}`}
                  className="truncate max-w-[180px] hover:text-neutral-800 transition-colors"
                >
                  {item.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
