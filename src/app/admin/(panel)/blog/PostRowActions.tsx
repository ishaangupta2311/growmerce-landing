"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Copy, Ellipsis, ExternalLink, Eye, EyeOff, Pencil, Send, Trash2 } from "lucide-react";
import {
  deletePostAction,
  duplicatePostAction,
  setPublishedAction,
} from "@/app/admin/_actions/posts";
import { ConfirmDialog, useToast } from "@/components/admin/overlay";
import { buttonClass } from "@/components/admin/ui";
import type { PostStatus } from "@/lib/blog/types";

const ITEM =
  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50";

export default function PostRowActions({
  post,
}: {
  post: { id: string; title: string; slug: string; status: PostStatus };
}) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  /* A popover renders in the top layer, so the table's horizontal scroll
     container cannot clip it; it is placed under its button by hand. */
  function openMenu() {
    const button = trigger.current;
    const panel = menu.current;
    if (!button || !panel) return;
    const rect = button.getBoundingClientRect();
    panel.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - 240)}px`;
    panel.style.left = `${Math.max(8, rect.right - 208)}px`;
    panel.showPopover();
  }

  function run(work: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) {
    menu.current?.hidePopover();
    startTransition(async () => {
      const result = await work();
      if (result.ok) {
        /* No router.refresh(): these actions revalidate, and the re-rendered
           list arrives in the action's own response. */
        if (result.message) notify(result.message);
        after?.();
      } else {
        notify(result.error ?? "Something went wrong.", "error");
      }
    });
  }

  const live = post.status === "published";

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link href={`/admin/blog/${post.id}/edit`} className={buttonClass("ghost", "icon")} aria-label={`Edit “${post.title}”`} title="Edit">
        <Pencil className="size-4" />
      </Link>
      <a
        href={`/admin/blog/${post.id}/preview`}
        target="_blank"
        rel="noreferrer"
        className={buttonClass("ghost", "icon")}
        aria-label={`Preview “${post.title}”`}
        title="Preview"
      >
        <Eye className="size-4" />
      </a>
      <button
        ref={trigger}
        type="button"
        onClick={openMenu}
        disabled={pending}
        className={buttonClass("ghost", "icon")}
        aria-label={`More actions for “${post.title}”`}
        aria-haspopup="menu"
      >
        <Ellipsis className="size-4" />
      </button>

      <div
        ref={menu}
        popover="auto"
        role="menu"
        className="fixed m-0 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"
      >
        {live ? (
          <button role="menuitem" type="button" className={ITEM} onClick={() => run(() => setPublishedAction(post.id, false))}>
            <EyeOff className="size-4 text-zinc-400" /> Unpublish
          </button>
        ) : (
          <button role="menuitem" type="button" className={ITEM} onClick={() => run(() => setPublishedAction(post.id, true))}>
            <Send className="size-4 text-zinc-400" /> Publish now
          </button>
        )}
        <button
          role="menuitem"
          type="button"
          className={ITEM}
          onClick={() =>
            run(async () => {
              const result = await duplicatePostAction(post.id);
              if (result.ok) router.push(`/admin/blog/${result.data.id}/edit`);
              return result;
            })
          }
        >
          <Copy className="size-4 text-zinc-400" /> Duplicate
        </button>
        {live && (
          <a role="menuitem" href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className={ITEM}>
            <ExternalLink className="size-4 text-zinc-400" /> View live
          </a>
        )}
        <div className="my-1 h-px bg-zinc-100" />
        <button
          role="menuitem"
          type="button"
          className={`${ITEM} text-red-600 hover:bg-red-50`}
          onClick={() => {
            menu.current?.hidePopover();
            setConfirming(true);
          }}
        >
          <Trash2 className="size-4" /> Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        pending={pending}
        title="Delete this post?"
        onConfirm={() => run(() => deletePostAction(post.id), () => setConfirming(false))}
      >
        <strong className="text-zinc-900">“{post.title}”</strong> will be permanently deleted
        {live ? " and removed from the blog and sitemap" : ""}. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
