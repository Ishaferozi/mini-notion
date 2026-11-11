"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { buildExtensions } from "./extensions";
import { EditorToolbar } from "./EditorToolbar";
import { SaveStatusIndicator } from "./SaveStatus";
import { debounce } from "@/lib/utils";
import type { Block, SaveStatus, TiptapContent } from "@/lib/types";

interface EditorProps {
  pageId: string;
  initialBlocks: Block[];
}

/**
 * The Tiptap editor component.
 *
 * Save strategy:
 *   - On every content change, a 800ms debounce fires a PUT to /api/blocks/[pageId]
 *   - If a save is in-flight when new changes arrive, the debounce resets the
 *     timer — the in-flight request completes independently (last-write-wins
 *     at the DB level, which is acceptable for a single-user workspace)
 *   - Save status: idle → saving → saved | error
 *   - "Saved" fades back to idle after 2 seconds
 */
export function Editor({ pageId, initialBlocks }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract initial content from the first "document" block if one exists
  const initialContent: TiptapContent | undefined = (() => {
    const docBlock = initialBlocks.find((b) => (b.type as string) === "document");
    if (docBlock && docBlock.content && typeof docBlock.content === "object") {
      return docBlock.content as TiptapContent;
    }
    return undefined;
  })();

  // ── Save function ────────────────────────────────────────────────────────────
  const saveContent = useCallback(
    async (content: TiptapContent) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/blocks/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("Save failed:", body);
          setSaveStatus("error");
          return;
        }

        setSaveStatus("saved");
        // Reset to idle after 2s so the indicator doesn't linger
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("Save error:", err);
        setSaveStatus("error");
      }
    },
    [pageId]
  );

  // ── Debounced save ───────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((content: TiptapContent) => {
      saveContent(content);
    }, 800),
    [saveContent]
  );

  // ── Tiptap editor instance ───────────────────────────────────────────────────
  const editor = useEditor({
    extensions: buildExtensions(),
    content: initialContent ?? {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none",
        "aria-label": "Page content editor",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate({ editor }) {
      const json = editor.getJSON() as TiptapContent;
      debouncedSave(json);
    },
    // Warn user if they try to leave with unsaved changes
    onBeforeCreate() {
      setSaveStatus("idle");
    },
  });

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // When pageId changes (navigating between pages), update editor content
  useEffect(() => {
    if (!editor) return;
    const docBlock = initialBlocks.find((b) => (b.type as string) === "document");
    const content = docBlock?.content as TiptapContent | undefined;
    if (content && content.type === "doc") {
      editor.commands.setContent(content, { emitUpdate: false });
    } else {
      editor.commands.setContent(
        { type: "doc", content: [{ type: "paragraph" }] },
        { emitUpdate: false }
      );
    }
    setSaveStatus("idle");
  // Only re-run when pageId changes — not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar + save status row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EditorToolbar editor={editor} />
        <SaveStatusIndicator status={saveStatus} />
      </div>

      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className="min-h-[60vh] cursor-text"
        onClick={() => editor?.commands.focus()}
      />
    </div>
  );
}
