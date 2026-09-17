"use client";

import * as React from "react";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "cn";
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { toEditorHtml } from "./journal-utils";

type JournalRichEditorProps = {
  content: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  active,
  label,
  onAction,
  children,
}: {
  active: boolean;
  label: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "outline"}
      aria-label={label}
      aria-pressed={active}
      className="size-8 shrink-0 p-0"
      onMouseDown={(event) => {
        event.preventDefault();
        onAction();
      }}
    >
      {children}
    </Button>
  );
}

export function JournalRichEditor({ content, onChange }: JournalRichEditorProps) {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: {
          HTMLAttributes: { class: "journal-bullet-list" },
        },
        orderedList: {
          HTMLAttributes: { class: "journal-ordered-list" },
        },
        listItem: {
          HTMLAttributes: { class: "journal-list-item" },
        },
        blockquote: {
          HTMLAttributes: { class: "journal-blockquote" },
        },
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
          active={editor.isActive("bold")}
          label="Bold"
          onAction={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          label="Italic"
          onAction={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          label="Strikethrough"
          onAction={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-7" />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          label="Bullet list"
          onAction={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          label="Numbered list"
          onAction={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          label="Quote"
          onAction={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-7" />

        <ToolbarButton active={false} label="Undo" onAction={() => editor.chain().focus().undo().run()}>
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton active={false} label="Redo" onAction={() => editor.chain().focus().redo().run()}>
          <Redo2 />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className={cn("journal-prose-wrap")} />
    </div>
  );
}
