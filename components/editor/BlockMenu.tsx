"use client";

/**
 * BlockMenu — slash "/" command menu for Tiptap.
 *
 * Uses @tiptap/suggestion via addProseMirrorPlugins.
 * When user types "/" at start of a block, a floating menu appears.
 */

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionOptions } from "@tiptap/suggestion";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

// ── Block command definitions ─────────────────────────────────────────────────

interface BlockCommand {
  title: string;
  description: string;
  icon: string;
  action: (editor: ReturnType<typeof import("@tiptap/core").Editor.prototype.chain>, range: { from: number; to: number }) => void;
}

const BLOCK_COMMANDS: BlockCommand[] = [
  {
    title: "Paragraph",
    description: "Normal text",
    icon: "¶",
    action: (chain, range) => chain.focus().deleteRange(range).setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: "H1",
    action: (chain, range) => chain.focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    action: (chain, range) => chain.focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: "•",
    action: (chain, range) => chain.focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list",
    icon: "1.",
    action: (chain, range) => chain.focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task List",
    description: "Checkbox list",
    icon: "☑",
    action: (chain, range) => chain.focus().deleteRange(range).toggleTaskList().run(),
  },
];

// ── Menu component ────────────────────────────────────────────────────────────

interface MenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface MenuProps {
  items: BlockCommand[];
  onSelect: (item: BlockCommand) => void;
}

const CommandMenu = forwardRef<MenuRef, MenuProps>(({ items, onSelect }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = items[selectedIndex];
        if (item) onSelect(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white shadow-xl p-1 min-w-[220px]"
      role="listbox"
      aria-label="Block commands"
    >
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        Blocks
      </p>
      {items.map((item, i) => (
        <button
          key={item.title}
          role="option"
          aria-selected={i === selectedIndex}
          onClick={() => onSelect(item)}
          className={[
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
            i === selectedIndex
              ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
              : "text-neutral-700 hover:bg-neutral-50",
          ].join(" ")}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-bold text-neutral-600">
            {item.icon}
          </span>
          <div>
            <p className="font-medium leading-tight">{item.title}</p>
            <p className="text-xs text-neutral-400 leading-tight">{item.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
});

CommandMenu.displayName = "CommandMenu";

// ── Tiptap Extension ──────────────────────────────────────────────────────────

export const BlockMenuExtension = Extension.create({
  name: "blockMenu",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      Suggestion({
        editor,
        char: "/",
        startOfLine: false,

        items: ({ query }: { query: string }) =>
          BLOCK_COMMANDS.filter((cmd) =>
            cmd.title.toLowerCase().includes(query.toLowerCase())
          ),

        command: ({
          editor: cmdEditor,
          range,
          props,
        }: {
          editor: typeof editor;
          range: { from: number; to: number };
          props: BlockCommand;
        }) => {
          props.action(cmdEditor.chain(), range);
        },

        render: () => {
          let container: HTMLDivElement | null = null;
          let reactRoot: Root | null = null;
          // Using a ref-like object for the imperative handle
          const menuRef = { current: null as MenuRef | null };

          return {
            onStart: (props: {
              items: BlockCommand[];
              command: (item: BlockCommand) => void;
              clientRect?: (() => DOMRect | null) | null;
            }) => {
              container = document.createElement("div");
              container.style.position = "fixed";
              container.style.zIndex = "9999";
              document.body.appendChild(container);

              const rect = props.clientRect?.();
              if (rect && container) {
                container.style.top = `${rect.bottom + 4}px`;
                container.style.left = `${rect.left}px`;
              }

              reactRoot = createRoot(container);
              reactRoot.render(
                <CommandMenu
                  ref={(r) => { menuRef.current = r; }}
                  items={props.items}
                  onSelect={(item) => props.command(item)}
                />
              );
            },

            onUpdate: (props: {
              items: BlockCommand[];
              command: (item: BlockCommand) => void;
              clientRect?: (() => DOMRect | null) | null;
            }) => {
              const rect = props.clientRect?.();
              if (rect && container) {
                container.style.top = `${rect.bottom + 4}px`;
                container.style.left = `${rect.left}px`;
              }
              reactRoot?.render(
                <CommandMenu
                  ref={(r) => { menuRef.current = r; }}
                  items={props.items}
                  onSelect={(item) => props.command(item)}
                />
              );
            },

            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === "Escape") return true;
              return menuRef.current?.onKeyDown(props.event) ?? false;
            },

            onExit: () => {
              reactRoot?.unmount();
              container?.remove();
              container = null;
              reactRoot = null;
              menuRef.current = null;
            },
          };
        },
      } as unknown as Parameters<typeof Suggestion>[0]),
    ];
  },
});
