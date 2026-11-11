import type { Page, PageNode } from "./types";

/**
 * Build a tree of PageNodes from a flat list of pages.
 * Only active (non-archived) pages are included.
 * Nodes are sorted by position ascending at each level.
 */
export function buildPageTree(pages: Page[]): PageNode[] {
  const active = pages.filter((p) => !p.archived_at);
  const map = new Map<string, PageNode>();

  // First pass: create all nodes
  for (const page of active) {
    map.set(page.id, { ...page, children: [] });
  }

  const roots: PageNode[] = [];

  // Second pass: attach children to parents
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by position at every level
  function sortChildren(nodes: PageNode[]): PageNode[] {
    return nodes
      .sort((a, b) => a.position - b.position)
      .map((n) => ({ ...n, children: sortChildren(n.children) }));
  }

  return sortChildren(roots);
}

/**
 * Returns the ancestor chain for a page, ordered from root → direct parent.
 * Used to build breadcrumbs.
 */
export function getAncestors(
  pageId: string,
  pages: Page[]
): Page[] {
  const map = new Map(pages.map((p) => [p.id, p]));
  const ancestors: Page[] = [];

  let current = map.get(pageId);
  while (current?.parent_id) {
    const parent = map.get(current.parent_id);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

/**
 * Checks whether `targetId` is an ancestor-or-self of `pageId`.
 * Used to prevent circular parent assignments.
 */
export function isAncestorOrSelf(
  pageId: string,
  targetId: string,
  pages: Page[]
): boolean {
  if (pageId === targetId) return true;
  const map = new Map(pages.map((p) => [p.id, p]));

  // Walk descendants of targetId to see if pageId appears
  function walk(id: string): boolean {
    for (const p of map.values()) {
      if (p.parent_id === id) {
        if (p.id === pageId) return true;
        if (walk(p.id)) return true;
      }
    }
    return false;
  }

  return walk(targetId);
}

/**
 * Simple debounce. Returns a function that delays invoking `fn` until
 * `delay` ms have elapsed since the last call.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * Returns the next position value for a new sibling.
 * Gaps of 1000 between positions allow cheap insertion without rewriting
 * all siblings.
 */
export function nextPosition(siblings: { position: number }[]): number {
  if (siblings.length === 0) return 1000;
  return Math.max(...siblings.map((s) => s.position)) + 1000;
}

/**
 * Clamp a string to a maximum byte length (not char length) for title fields.
 */
export function clampTitle(title: string, max = 500): string {
  return title.slice(0, max);
}
