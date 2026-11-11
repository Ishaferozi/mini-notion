import { TopNavClient } from "./TopNavClient";
import type { BreadcrumbItem, Page } from "@/lib/types";

interface TopNavServerProps {
  breadcrumbs: BreadcrumbItem[];
  allPages: Page[];
  userEmail: string;
}

/**
 * Thin server wrapper that passes serialisable props to the client TopNav.
 * Keeping this separate lets the page server component stay async while
 * the interactive nav (search, user menu) lives in a client component.
 */
export function TopNavServer({ breadcrumbs, allPages, userEmail }: TopNavServerProps) {
  return (
    <TopNavClient
      breadcrumbs={breadcrumbs}
      allPages={allPages}
      userEmail={userEmail}
    />
  );
}
