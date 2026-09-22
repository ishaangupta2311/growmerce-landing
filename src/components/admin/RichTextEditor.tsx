"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { useState, type ReactNode } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Bold,
  Code,
  CodeXml,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Trash2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import { clsx } from "@/lib/clsx";
import MediaPicker from "./MediaPicker";
import { Modal } from "./overlay";
import { Button, Field, Input } from "./ui";

/**
 * The post body editor. Tiptap produces clean, semantic HTML; the server
 * runs it through the allowlist in src/lib/blog/sanitize.ts on save, and the
 * set of tools here is exactly what that allowlist keeps.
 *
 * The content area carries the same `blog-prose` class as the public article,
 * so what you see while writing is what readers get.
 */
export default function RichTextEditor({
  initialHtml,
  onChange,
  invalid,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  invalid?: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const [linkDialog, setLinkDialog] = useState<{ href: string; newTab: boolean } | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const editor = useEditor({
    /* Server rendering an editor is meaningless; rendering it only on the
       client avoids a hydration mismatch. */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["mailto", "tel"],
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your post…" }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "blog-prose blog-prose-editor min-h-[440px] px-4 py-5 outline-none sm:px-8",
        "aria-label": "Post content",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  function openLinkDialog() {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    setLinkDialog({ href: (attrs.href as string) ?? "", newTab: attrs.target === "_blank" });
  }

  function applyLink() {
    if (!editor || !linkDialog) return;
    const href = linkDialog.href.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!href) {
      chain.unsetLink().run();
    } else {
      const attrs = { href, target: linkDialog.newTab ? "_blank" : null };
      if (editor.state.selection.empty && !editor.isActive("link")) {
        chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs }] }).run();
      } else {
        chain.setLink(attrs).run();
      }
    }
    setLinkDialog(null);
  }

  function toggleSource() {
    if (!editor) return;
    if (source === null) {
      setSource(editor.getHTML());
    } else {
      editor.commands.setContent(source, { emitUpdate: true });
      setSource(null);
    }
  }

  return (
    <div
      className={clsx(
        /* clip, not hidden: hidden would make this a scroll container and
           quietly turn off the toolbar's position: sticky. */
        "overflow-clip rounded-xl border bg-white shadow-xs",
        invalid ? "border-red-400" : "border-zinc-200",
      )}
    >
      {editor ? (
        <Toolbar
          editor={editor}
          sourceMode={source !== null}
          onLink={openLinkDialog}
          onImage={() => setPicking(true)}
          onToggleSource={toggleSource}
        />
      ) : (
        <div className="h-[45px] border-b border-zinc-100 bg-zinc-50/80" />
      )}

      {source !== null ? (
        <textarea
          value={source}
          onChange={(event) => setSource(event.target.value)}
          spellCheck={false}
          aria-label="Post HTML source"
          className="block min-h-[440px] w-full resize-y bg-zinc-950 p-4 font-mono text-[13px] leading-relaxed text-zinc-100 outline-none"
        />
      ) : editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-[440px] animate-pulse bg-zinc-50/40" />
      )}

      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        title="Insert image"
        onSelect={(item) => {
          editor
            ?.chain()
            .focus()
            .setImage({ src: item.url, alt: item.altText ?? "", width: item.width, height: item.height })
            .run();
        }}
      />

      <Modal
        open={linkDialog !== null}
        onClose={() => setLinkDialog(null)}
        title="Link"
        size="sm"
        footer={
          <>
            {editor?.isActive("link") && (
              <Button
                variant="dangerGhost"
                className="mr-auto"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  setLinkDialog(null);
                }}
              >
                <Unlink className="size-4" />
                Remove link
              </Button>
            )}
            <Button onClick={() => setLinkDialog(null)}>Cancel</Button>
            <Button variant="primary" onClick={applyLink}>
              Apply
            </Button>
          </>
        }
      >
        {linkDialog && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applyLink();
            }}
            className="space-y-3"
          >
            <Field label="URL" htmlFor="link-href" hint="A full address, a /path on this site, or mailto:">
              <Input
                id="link-href"
                autoFocus
                value={linkDialog.href}
                onChange={(event) => setLinkDialog({ ...linkDialog, href: event.target.value })}
                placeholder="https://"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={linkDialog.newTab}
                onChange={(event) => setLinkDialog({ ...linkDialog, newTab: event.target.checked })}
                className="size-4 rounded border-zinc-300 accent-brand"
              />
              Open in a new tab
            </label>
          </form>
        )}
      </Modal>
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsx(
        "grid size-8 place-items-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-35",
        active ? "bg-brand/10 text-brand" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-zinc-200" />;

function Toolbar({
  editor,
  sourceMode,
  onLink,
  onImage,
  onToggleSource,
}: {
  editor: Editor;
  sourceMode: boolean;
  onLink: () => void;
  onImage: () => void;
  onToggleSource: () => void;
}) {
  /* Tiptap v3 does not re-render on every transaction; this subscribes the
     toolbar to just the state it displays. */
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : e.isActive("heading", { level: 4 })
            ? "h4"
            : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      table: e.isActive("table"),
      align: (["left", "center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();

  /* Sticks under the admin header (64px) plus the editor's one-row action
     bar (61px) on wide screens; below xl that bar wraps to an unknown height,
     so the toolbar scrolls with the content instead of hiding under it. */
  const off = sourceMode;

  return (
    <div className="z-10 border-b border-zinc-100 bg-zinc-50/95 backdrop-blur xl:sticky xl:top-[125px]">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <select
          aria-label="Text style"
          value={state.block}
          disabled={off}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "p") run((c) => c.setParagraph());
            else run((c) => c.toggleHeading({ level: Number(value.slice(1)) as 2 | 3 | 4 }));
          }}
          className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-[13px] font-semibold text-zinc-700 outline-none focus:border-brand"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
        <Divider />
        <ToolButton label="Bold" active={state.bold} disabled={off} onClick={() => run((c) => c.toggleBold())}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Italic" active={state.italic} disabled={off} onClick={() => run((c) => c.toggleItalic())}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Underline" active={state.underline} disabled={off} onClick={() => run((c) => c.toggleUnderline())}>
          <Underline className="size-4" />
        </ToolButton>
        <ToolButton label="Strikethrough" active={state.strike} disabled={off} onClick={() => run((c) => c.toggleStrike())}>
          <Strikethrough className="size-4" />
        </ToolButton>
        <ToolButton label="Inline code" active={state.code} disabled={off} onClick={() => run((c) => c.toggleCode())}>
          <Code className="size-4" />
        </ToolButton>
        <ToolButton label="Link" active={state.link} disabled={off} onClick={onLink}>
          <Link2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" active={state.bullet} disabled={off} onClick={() => run((c) => c.toggleBulletList())}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Numbered list" active={state.ordered} disabled={off} onClick={() => run((c) => c.toggleOrderedList())}>
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton label="Quote" active={state.quote} disabled={off} onClick={() => run((c) => c.toggleBlockquote())}>
          <Quote className="size-4" />
        </ToolButton>
        <ToolButton label="Code block" active={state.codeBlock} disabled={off} onClick={() => run((c) => c.toggleCodeBlock())}>
          <CodeXml className="size-4" />
        </ToolButton>
        <ToolButton label="Divider" disabled={off} onClick={() => run((c) => c.setHorizontalRule())}>
          <Minus className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Align left" active={state.align === "left"} disabled={off} onClick={() => run((c) => c.setTextAlign("left"))}>
          <AlignLeft className="size-4" />
        </ToolButton>
        <ToolButton label="Align centre" active={state.align === "center"} disabled={off} onClick={() => run((c) => c.setTextAlign("center"))}>
          <AlignCenter className="size-4" />
        </ToolButton>
        <ToolButton label="Align right" active={state.align === "right"} disabled={off} onClick={() => run((c) => c.setTextAlign("right"))}>
          <AlignRight className="size-4" />
        </ToolButton>
        <ToolButton label="Justify" active={state.align === "justify"} disabled={off} onClick={() => run((c) => c.setTextAlign("justify"))}>
          <AlignJustify className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Insert image" disabled={off} onClick={onImage}>
          <ImagePlus className="size-4" />
        </ToolButton>
        <ToolButton
          label="Insert table"
          active={state.table}
          disabled={off}
          onClick={() => run((c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}
        >
          <Table2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Undo" disabled={off || !state.canUndo} onClick={() => run((c) => c.undo())}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Redo" disabled={off || !state.canRedo} onClick={() => run((c) => c.redo())}>
          <Redo2 className="size-4" />
        </ToolButton>
        <div className="flex-1" />
        <button
          type="button"
          onClick={onToggleSource}
          aria-pressed={sourceMode}
          className={clsx(
            "h-8 rounded-md px-2.5 text-xs font-bold tracking-wide uppercase transition-colors",
            sourceMode ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
          )}
        >
          {sourceMode ? "Visual" : "HTML"}
        </button>
      </div>

      {state.table && !off && (
        <div className="flex flex-wrap items-center gap-1 border-t border-zinc-100 px-2 py-1.5 text-xs">
          <span className="mr-1 font-semibold text-zinc-500">Table</span>
          <TableButton onClick={() => run((c) => c.addRowBefore())} icon={<BetweenHorizontalStart className="size-3.5" />}>
            Row above
          </TableButton>
          <TableButton onClick={() => run((c) => c.addRowAfter())} icon={<BetweenHorizontalStart className="size-3.5 rotate-180" />}>
            Row below
          </TableButton>
          <TableButton onClick={() => run((c) => c.deleteRow())}>Delete row</TableButton>
          <span aria-hidden className="mx-1 h-4 w-px bg-zinc-200" />
          <TableButton onClick={() => run((c) => c.addColumnBefore())} icon={<BetweenVerticalStart className="size-3.5" />}>
            Column left
          </TableButton>
          <TableButton onClick={() => run((c) => c.addColumnAfter())} icon={<BetweenVerticalStart className="size-3.5 rotate-180" />}>
            Column right
          </TableButton>
          <TableButton onClick={() => run((c) => c.deleteColumn())}>Delete column</TableButton>
          <span aria-hidden className="mx-1 h-4 w-px bg-zinc-200" />
          <TableButton onClick={() => run((c) => c.toggleHeaderRow())}>Header row</TableButton>
          <TableButton onClick={() => run((c) => c.deleteTable())} icon={<Trash2 className="size-3.5" />} danger>
            Delete table
          </TableButton>
        </div>
      )}
    </div>
  );
}

function TableButton({
  onClick,
  icon,
  danger,
  children,
}: {
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={clsx(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 font-semibold transition-colors",
        danger ? "text-red-600 hover:bg-red-50" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
