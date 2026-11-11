"use client";

import { useState, useCallback, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import type { Page } from "@/lib/types";

interface SearchBoxProps {
  pages: Page[];
}

export function SearchBox({ pages }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const results = query.trim()
    ? pages
        .filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) && !p.archived_at
        )
        .slice(0, 10) // cap at 10 results
    : [];

  const handleSelect = useCallback(
    (id: string) => {
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
      router.push(`/pages/${id}`);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex].id);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div className="relative px-2 pb-2">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-sidebar-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
          aria-label="Search pages"
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() =>
            setTimeout(() => {
              setOpen(false);
              setActiveIndex(-1);
            }, 150)
          }
          onKeyDown={handleKeyDown}
          placeholder="Search pages…"
          className={[
            "w-full rounded-md bg-[var(--color-sidebar-hover)] py-1.5 pl-7 pr-2",
            "text-xs text-[var(--color-sidebar-text)] placeholder:text-[var(--color-sidebar-text-muted)]",
            "border border-transparent focus:border-neutral-300 focus:bg-white",
            "focus:outline-none transition-colors",
          ].join(" ")}
        />
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-sidebar-text-muted)] hover:text-[var(--color-sidebar-text)] transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className={[
            "absolute left-2 right-2 top-full z-50 mt-1",
            "rounded-lg border border-neutral-200 bg-white shadow-lg",
            "max-h-56 overflow-y-auto py-1",
          ].join(" ")}
        >
          {results.map((page, idx) => (
            <li
              key={page.id}
              id={`search-result-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <button
                onMouseDown={() => handleSelect(page.id)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={[
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left",
                  "text-sm text-neutral-800 transition-colors",
                  idx === activeIndex
                    ? "bg-neutral-100"
                    : "hover:bg-neutral-50",
                  "focus-visible:outline-none",
                ].join(" ")}
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <span className="truncate">{page.title || "Untitled"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {showDropdown && results.length === 0 && (
        <div
          role="status"
          className="absolute left-2 right-2 top-full z-50 mt-1 rounded-lg border border-neutral-200 bg-white shadow-lg px-3 py-3 text-xs text-neutral-500"
        >
          No pages match &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
