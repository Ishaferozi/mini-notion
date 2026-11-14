import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { BlockMenuExtension } from "./BlockMenu";

/**
 * Tiptap extension configuration.
 * Includes Paragraph, H1/H2, BulletList, OrderedList, TaskList,
 * History (undo/redo), and "/" slash-command BlockMenu.
 */
export function buildExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2] },
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      code: false,
    }),
    TaskList.configure({ HTMLAttributes: { class: "task-list" } }),
    TaskItem.configure({ nested: false }),
    Placeholder.configure({
      placeholder: "Start writing, or press '/' for commands…",
      emptyEditorClass: "is-editor-empty",
    }),
    // Slash "/" command menu
    BlockMenuExtension,
  ];
}
