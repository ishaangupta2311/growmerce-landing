import { signOut } from "@/app/affiliates/actions";

/**
 * Sign out, as a form rather than a link.
 *
 * A GET link that ends a session can be triggered by anything that fetches a
 * URL — a prefetch, an image tag on another site, an over-eager link scanner —
 * and the partner is signed out without having clicked anything. A form posts,
 * and a Server Action post carries the framework's own origin check.
 *
 * A Server Component, so the action is called directly with no client
 * JavaScript involved.
 */
export default function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="font-poppins text-[14.5px] font-bold text-body-mute transition-colors hover:text-brand"
      >
        Sign out
      </button>
    </form>
  );
}
