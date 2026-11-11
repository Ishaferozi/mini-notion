"use client";

import { useState, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { BreadcrumbItem, Page } from "@/lib/types";

interface TopNavClientProps {
  breadcrumbs: BreadcrumbItem[];
  allPages: Page[];
  userEmail: string;
}

export function TopNavClient({ breadcrumbs, allPages, userEmail }: TopNavClientProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const results = query.trim()
    ? allPages
        .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) && !p.archived_at)
        .slice(0, 8)
    : [];

  function handleSelect(id: string) {
    setQuery("");
    setSearchOpen(false);
    router.push(`/pages/${id}`);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-4 md:px-6 gap-4 z-10">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500 min-w-0 flex-1">
        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <span key={item.id} className="flex items-center gap-1 min-w-0">
              {idx > 0 && (
                <svg className="h-3.5 w-3.5 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              {isLast ? (
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]" aria-current="page">
                  {item.title}
                </span>
              ) : (
                <Link href={`/pages/${item.id}`} className="truncate max-w-[140px] hover:text-neutral-800 transition-colors">
                  {item.title}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* ── Global search (desktop) ── */}
      <div className="relative hidden md:block w-64 shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 hover:border-neutral-300 transition-colors">
          <svg className="h-4 w-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded={searchOpen && results.length > 0}
            aria-controls={listboxId}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setSearchOpen(false); } }}
            placeholder="Search in workspace..."
            className="flex-1 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 outline-none"
          />
        </div>

        {searchOpen && results.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 max-h-56 overflow-y-auto"
          >
            {results.map((page) => (
              <li key={page.id} role="option" aria-selected={false}>
                <button
                  onMouseDown={() => handleSelect(page.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="truncate">{page.title || "Untitled"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searchOpen && query.trim() && results.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-neutral-200 bg-white shadow-lg px-3 py-3 text-sm text-neutral-500">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-white text-xs font-bold uppercase shadow-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            {userEmail.charAt(0)}
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                aria-hidden="true"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-neutral-200 bg-white shadow-xl py-1">
                <div className="px-4 py-2.5 border-b border-neutral-100">
                  <p className="text-sm font-semibold text-neutral-800 truncate">
                    {userEmail.split("@")[0]}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); handleSignOut(); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
