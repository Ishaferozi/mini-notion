"use client";

import { useState } from "react";
import { SidebarClient } from "./SidebarClient";
import type { Page, PageNode } from "@/lib/types";

interface MobileSidebarWrapperProps {
  pages: PageNode[];
  allPages: Page[];
  userEmail: string;
}

/**
 * On mobile: renders a hamburger button in the top-left corner.
 * Tapping it opens the sidebar as a full-screen drawer overlay.
 * The drawer closes when the user taps the backdrop or navigates to a page.
 */
export function MobileSidebarWrapper({
  pages,
  allPages,
  userEmail,
}: MobileSidebarWrapperProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger button — always visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
        className="fixed left-3 top-3 z-40 flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm text-neutral-600 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation sidebar"
      >
        {/* Wrap SidebarClient — navigation closes the drawer */}
        <div onClick={() => setOpen(false)} className="h-full">
          <SidebarClient
            pages={pages}
            allPages={allPages}
            userEmail={userEmail}
          />
        </div>
      </div>
    </>
  );
}
