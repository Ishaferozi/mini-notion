import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

/**
 * Tiptap extension configuration for Mini Notion.
 *
 * StarterKit includes: Document, Paragraph, Text, Bold, Italic, Strike,
 * Code, Blockquote, HorizontalRule, Heading (all levels), BulletList,
 * OrderedList, ListItem, CodeBlock, HardBreak, History (undo/redo).
 *
 * We configure Heading to only expose H1 and H2 as required, and add
 * TaskList/TaskItem for checkbox blocks.
 */
export function buildExtensions() {
  return [
    StarterKit.configure({
      // Allow only H1 and H2 — matches our BlockType enum
      heading: {
        levels: [1, 2],
      },
      // Keep bullet and ordered lists
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      // Disable features we don't need in this editor
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      code: false,
    }),

    // Checkbox / task list blocks
    TaskList.configure({
      HTMLAttributes: {
        class: "task-list",
      },
    }),
    TaskItem.configure({
      nested: false, // keep it simple — no nested task lists
    }),

    // Placeholder text shown when the document is empty
    Placeholder.configure({
      placeholder: "Start writing, or press '/' for commands…",
      emptyEditorClass: "is-editor-empty",
    }),
  ];
}
