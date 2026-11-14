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

export function Editor({ pageId, initialBlocks }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track in-flight saves to prevent overlapping requests
  const isSavingRef = useRef(false);
  // Queue: if a save comes in while one is in-flight, hold the latest content
  const pendingContentRef = useRef<TiptapContent | null>(null);

  const initialContent: TiptapContent | undefined = (() => {
    const docBlock = initialBlocks.find((b) => (b.type as string) === "document");
    if (docBlock && docBlock.content && typeof docBlock.content === "object") {
      return docBlock.content as TiptapContent;
    }
    return undefined;
  })();

  const saveContent = useCallback(
    async (content: TiptapContent) => {
      // If already saving, queue the latest content and return
      if (isSavingRef.current) {
        pendingContentRef.current = content;
        return;
      }

      isSavingRef.current = true;
      setSaveStatus("saving");

      try {
        const res = await fetch(`/api/blocks/${pageId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!res.ok) {
          setSaveStatus("error");
          return;
        }

        setSaveStatus("saved");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      } finally {
        isSavingRef.current = false;

        // If content was queued while saving, flush it now
        const queued = pendingContentRef.current;
        if (queued) {
          pendingContentRef.current = null;
          saveContent(queued);
        }
      }
    },
    [pageId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((content: TiptapContent) => {
      saveContent(content);
    }, 800),
    [saveContent]
  );

  const editor = useEditor({
    extensions: buildExtensions(),
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
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
    onBeforeCreate() {
      setSaveStatus("idle");
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

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
    // Reset in-flight state on page change
    isSavingRef.current = false;
    pendingContentRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <EditorToolbar editor={editor} />
        <SaveStatusIndicator status={saveStatus} />
      </div>
      <EditorContent
        editor={editor}
        className="min-h-[60vh] cursor-text"
        onClick={() => editor?.commands.focus()}
      />
    </div>
  );
}
