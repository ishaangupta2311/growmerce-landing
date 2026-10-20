import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/admin/session";
import { getEditablePost } from "@/lib/blog/posts";
import { editorOptions } from "@/lib/blog/taxonomy";
import { allows } from "@/lib/team/permissions";
import PostEditor from "../../PostEditor";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]/edit">) {
  const admin = await requireAccess("blog.posts");
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) notFound();

  const [post, options] = await Promise.all([getEditablePost(id), editorOptions()]);
  if (!post) notFound();

  /* Keyed on the save time, so saving (which refreshes this page) remounts
     the editor with what the server now holds. A role without edit on Posts
     gets the same editor, read-only. */
  return (
    <PostEditor
      key={post.updatedAt}
      post={post}
      defaults={post}
      options={options}
      readOnly={!allows(admin.grant, "blog.posts", "edit")}
    />
  );
}
