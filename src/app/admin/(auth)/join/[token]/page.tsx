import { createHash } from "node:crypto";
import type { Metadata } from "next";

import { signOutForInviteAction } from "@/app/admin/_actions/join";
import { AcceptInviteButton, JoinForm } from "@/components/admin/account/forms";
import { ButtonLink, Card } from "@/components/admin/ui";
import { currentUser } from "@/lib/supabase/server";
import { inviteByTokenHash, loginByEmail } from "@/lib/team/store";

/* The token is in the address, so it must not leave in a Referer header. */
export const metadata: Metadata = { title: "Join the team", referrer: "no-referrer" };

/**
 * An invite to the team, opened from its email. Open to anybody (src/proxy.ts
 * lets /admin/join/ through), because the person may not have a login yet:
 * the token is the proof, and every action here checks it again.
 */
export default async function JoinPage({ params }: PageProps<"/admin/join/[token]">) {
  const { token } = await params;
  const invite = /^[0-9a-f]{64}$/.test(token)
    ? await inviteByTokenHash(createHash("sha256").update(token).digest("hex"))
    : null;

  if (!invite) {
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-tight">This invite can&rsquo;t be used</h1>
        <p className="mt-2 text-sm text-zinc-500">
          It has expired, been used already, or been cancelled. Ask whoever invited you to send a new one.
        </p>
      </>
    );
  }

  const user = await currentUser();
  const signedInAs = user?.email?.trim().toLowerCase() ?? null;

  let body: React.ReactNode;
  if (signedInAs === invite.email) {
    body = <AcceptInviteButton token={token} />;
  } else if (signedInAs) {
    body = (
      <div className="space-y-4 text-sm text-zinc-600">
        <p>
          You&rsquo;re signed in as <strong className="text-zinc-900">{signedInAs}</strong>, but this invite is for{" "}
          <strong className="text-zinc-900">{invite.email}</strong>.
        </p>
        <form action={signOutForInviteAction.bind(null, token)}>
          <button type="submit" className="font-semibold text-brand hover:underline">
            Log out and continue as {invite.email}
          </button>
        </form>
      </div>
    );
  } else if (await loginByEmail(invite.email)) {
    body = (
      <div className="space-y-4 text-sm text-zinc-600">
        <p>
          <strong className="text-zinc-900">{invite.email}</strong> already has a Growmerce login. Sign in with it to
          accept.
        </p>
        <ButtonLink href={`/affiliates/login?next=/admin/join/${token}`} variant="primary" className="w-full">
          Sign in to accept
        </ButtonLink>
      </div>
    );
  } else {
    body = <JoinForm token={token} email={invite.email} />;
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Join the Growmerce admin</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        {invite.invitedBy ? `${invite.invitedBy} invited you` : "You've been invited"} as{" "}
        <strong className="text-zinc-800">{invite.role.name}</strong>.
      </p>
      <Card>{body}</Card>
    </>
  );
}
