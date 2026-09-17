"use client";

import * as React from "react";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "cn";
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

import { toEditorHtml } from "./journal-utils";

type JournalRichEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Toggle size="sm" variant="outline" pressed={pressed} aria-label={label} onPressedChange={onClick}>
      {children}
    </Toggle>
  );
}

export function JournalRichEditor({ content, onChange }: JournalRichEditorProps) {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Mulai menulis di sini…",
      }),
    ],
    content: toEditorHtml(content),
    editorProps: {
      attributes: {
        class:
          "journal-prose min-h-[68vh] outline-none focus:outline-none [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:text-muted-foreground/35 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const refresh = () => rerender();
    editor.on("selectionUpdate", refresh);
    editor.on("transaction", refresh);
    return () => {
      editor.off("selectionUpdate", refresh);
      editor.off("transaction", refresh);
    };
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[68vh] animate-pulse rounded-md bg-muted/20" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/25 p-1.5">
        <ToolbarButton
          pressed={editor.isActive("bold")}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("italic")}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("strike")}
          label="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-7" />

        <ToolbarButton
          pressed={editor.isActive("bulletList")}
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("orderedList")}
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          pressed={editor.isActive("blockquote")}
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-7" />

        <ToolbarButton pressed={false} label="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton pressed={false} label="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className={cn("journal-prose-wrap")} />
    </div>
  );
}
