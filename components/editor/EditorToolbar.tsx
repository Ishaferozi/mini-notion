"use client";

import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  label: string;
  shortcut?: string;
  isActive: () => boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const buttons: ToolbarButton[] = [
    {
      label: "Heading 1",
      shortcut: "⌘⌥1",
      isActive: () => editor.isActive("heading", { level: 1 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: <span className="text-xs font-bold leading-none">H1</span>,
    },
    {
      label: "Heading 2",
      shortcut: "⌘⌥2",
      isActive: () => editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: <span className="text-xs font-bold leading-none">H2</span>,
    },
    {
      label: "Paragraph",
      isActive: () => editor.isActive("paragraph"),
      onClick: () => editor.chain().focus().setParagraph().run(),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      ),
    },
    {
      label: "Bullet list",
      shortcut: "⌘⇧8",
      isActive: () => editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      label: "Numbered list",
      shortcut: "⌘⇧7",
      isActive: () => editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 113.256 1.19 3.293 3.293 0 01-.321.3c-.025.02-.058.052-.082.075l-1.062 1.5H5.24m0-4.5H3.99m1.25 4.5H3.99" />
        </svg>
      ),
    },
    {
      label: "Task list",
      isActive: () => editor.isActive("taskList"),
      onClick: () => editor.chain().focus().toggleTaskList().run(),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  // Separator
  const sep = (
    <div className="mx-1 h-4 w-px bg-neutral-200" aria-hidden="true" />
  );

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-white px-1.5 py-1 shadow-sm"
    >
      {/* Block type buttons */}
      {buttons.slice(0, 2).map((btn) => (
        <ToolbarBtn key={btn.label} {...btn} />
      ))}
      {sep}
      {buttons.slice(2, 3).map((btn) => (
        <ToolbarBtn key={btn.label} {...btn} />
      ))}
      {sep}
      {buttons.slice(3).map((btn) => (
        <ToolbarBtn key={btn.label} {...btn} />
      ))}
      {sep}
      {/* Bold / Italic */}
      <ToolbarBtn
        label="Bold"
        shortcut="⌘B"
        isActive={() => editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={<span className="text-xs font-bold leading-none">B</span>}
      />
      <ToolbarBtn
        label="Italic"
        shortcut="⌘I"
        isActive={() => editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={<span className="text-xs italic leading-none">I</span>}
      />
    </div>
  );
}

function ToolbarBtn({
  label,
  shortcut,
  isActive,
  onClick,
  icon,
}: ToolbarButton) {
  const active = isActive();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      title={shortcut ? `${label} — ${shortcut}` : label}
      className={[
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        active
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
      ].join(" ")}
    >
      {icon}
    </button>
  );
}
