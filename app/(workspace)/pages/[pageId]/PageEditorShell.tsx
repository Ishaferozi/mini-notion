"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { PageHeader } from "@/components/editor/PageHeader";
import { debounce } from "@/lib/utils";
import type { Page, Block } from "@/lib/types";

interface PageEditorShellProps {
  page: Page;
  initialBlocks: Block[];
}

export function PageEditorShell({ page, initialBlocks }: PageEditorShellProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title || "");
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = title ? `${title} – Mini Notion` : "Mini Notion";
  }, [title]);

  useEffect(() => {
    setTitle(page.title || "");
  }, [page.id, page.title]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedTitleSave = useCallback(
    debounce(async (newTitle: string) => {
      await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() || "Untitled" }),
      });
      router.refresh();
    }, 600),
    [page.id, router]
  );

  function handleTitleChange(val: string) {
    setTitle(val);
    debouncedTitleSave(val);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      document.querySelector<HTMLElement>(".tiptap-editor")?.focus();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <PageHeader
        pageId={page.id}
        initialCover={page.cover ?? null}
        initialIcon={page.icon ?? null}
        title={title}
        onTitleChange={handleTitleChange}
        onTitleKeyDown={handleTitleKeyDown}
        titleRef={titleRef}
      />
      <div className="mx-auto w-full max-w-3xl px-4 md:px-8 pb-16">
        <Editor pageId={page.id} initialBlocks={initialBlocks} />
      </div>
    </div>
  );
}
