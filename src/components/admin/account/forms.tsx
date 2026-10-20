"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, ShieldCheck, Smartphone } from "lucide-react";

import {
  changePasswordAction,
  confirmTwoStepAction,
  startTwoStepAction,
  turnOffTwoStepAction,
  updateProfileAction,
  verifySignInCodeAction,
} from "@/app/admin/_actions/account";
import { acceptInviteAction, joinWithPasswordAction } from "@/app/admin/_actions/join";
import { ConfirmDialog, useToast } from "@/components/admin/overlay";
import { Button, Card, Field, Input } from "@/components/admin/ui";

/**
 * The forms a teammate fills in about themselves: their name, password and
 * two-step login under My account, and the three pages before the admin —
 * the sign-in code, a forced new password, and accepting an invite.
 */

function Spinner({ on }: { on: boolean }) {
  return on ? <LoaderCircle className="size-4 animate-spin" /> : null;
}

/** Six digits, as the authenticator app shows them; spaces are dropped. */
function CodeInput({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="123456"
      className="font-mono text-lg tracking-[0.3em]"
      autoFocus
    />
  );
}

export function ProfileCard({ name, email, roleName }: { name: string; email: string; roleName: string }) {
  const notify = useToast();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <Card title="Profile" description="How you appear in the admin, and on Team → Activity.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updateProfileAction({ name: value });
            if (!result.ok) {
              setError(result.fieldErrors?.name ?? result.error);
              return;
            }
            setError(undefined);
            notify(result.message ?? "Saved.");
          });
        }}
      >
        <Field label="Name" htmlFor="profile-name" error={error}>
          <Input id="profile-name" value={value} maxLength={100} onChange={(event) => setValue(event.target.value)} />
        </Field>
        <Field label="Email" htmlFor="profile-email" hint={`Your sign-in address. Your role is ${roleName}.`}>
          <Input id="profile-email" value={email} disabled readOnly />
        </Field>
        <Button type="submit" variant="primary" disabled={pending || value.trim() === name}>
          <Spinner on={pending} />
          Save
        </Button>
      </form>
    </Card>
  );
}

/**
 * A new password. `requireCurrent` is false only on the page that forces a
 * change after signing in with a password somebody else chose.
 */
export function PasswordForm({ requireCurrent, then }: { requireCurrent: boolean; then?: string }) {
  const router = useRouter();
  const notify = useToast();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await changePasswordAction({ current, password, confirm });
          if (!result.ok) {
            setErrors(result.fieldErrors ?? {});
            notify(result.error, "error");
            return;
          }
          setErrors({});
          setCurrent("");
          setPassword("");
          setConfirm("");
          notify(result.message ?? "Password changed.");
          if (then) router.replace(then);
        });
      }}
    >
      {requireCurrent && (
        <Field label="Current password" htmlFor="password-current" error={errors.current}>
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
      )}
      <Field label="New password" htmlFor="password-new" error={errors.password} hint="At least 8 characters.">
        <Input
          id="password-new"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      <Field label="New password again" htmlFor="password-confirm" error={errors.confirm}>
        <Input
          id="password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </Field>
      <Button
        type="submit"
        variant="primary"
        disabled={pending || !password || !confirm || (requireCurrent && !current)}
      >
        <Spinner on={pending} />
        Change password
      </Button>
    </form>
  );
}

/**
 * Two-step login under My account: off, being set up (QR code and a code to
 * confirm it), or on.
 */
export function TwoStepCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  const [setup, setSetup] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [turningOff, setTurningOff] = useState(false);

  return (
    <Card
      title="Two-step login"
      description="Ask for a code from an authenticator app (Google Authenticator, 1Password, Authy…) each time you sign in."
    >
      {enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="size-4" />
            On. You&rsquo;ll be asked for a code when you sign in.
          </p>
          <Button variant="dangerGhost" onClick={() => setTurningOff(true)} disabled={pending}>
            Turn off
          </Button>
        </div>
      ) : setup ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await confirmTwoStepAction(setup.factorId, code);
              if (!result.ok) {
                setError(result.fieldErrors?.code ?? result.error);
                return;
              }
              notify(result.message ?? "Two-step login is on.");
              setSetup(null);
              setCode("");
              router.refresh();
            });
          }}
        >
          <ol className="list-decimal space-y-1 pl-4 text-sm text-zinc-600">
            <li>Scan this code with your authenticator app.</li>
            <li>Type the 6-digit code it shows.</li>
          </ol>
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            {/* A data: URL with an SVG in it, straight from Supabase. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setup.qrCode}
              alt="QR code for your authenticator app"
              className="size-40 rounded-lg border border-zinc-200 bg-white p-2"
            />
            <div className="min-w-0 text-xs text-zinc-500">
              Can&rsquo;t scan it? Enter this key instead:
              <code className="mt-1 block font-mono text-[13px] break-all text-zinc-900 select-all">
                {setup.secret}
              </code>
            </div>
          </div>
          <Field label="Code from the app" htmlFor="two-step-code" error={error}>
            <CodeInput id="two-step-code" value={code} onChange={setCode} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={pending || code.length !== 6}>
              <Spinner on={pending} />
              Turn on
            </Button>
            <Button onClick={() => setSetup(null)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          onClick={() =>
            startTransition(async () => {
              const result = await startTwoStepAction();
              if (!result.ok) {
                notify(result.error, "error");
                return;
              }
              setError(undefined);
              setSetup(result.data);
            })
          }
          disabled={pending}
        >
          {pending ? <Spinner on /> : <Smartphone className="size-4" />}
          Turn on
        </Button>
      )}

      <ConfirmDialog
        open={turningOff}
        onClose={() => setTurningOff(false)}
        pending={pending}
        title="Turn off two-step login?"
        confirmLabel="Turn off"
        onConfirm={() =>
          startTransition(async () => {
            const result = await turnOffTwoStepAction();
            setTurningOff(false);
            if (!result.ok) {
              notify(result.error, "error");
              return;
            }
            notify(result.message ?? "Two-step login is off.");
            router.refresh();
          })
        }
      >
        You&rsquo;ll sign in with your password alone. You can turn it back on any time.
      </ConfirmDialog>
    </Card>
  );
}

/** The second step of signing in. */
export function SignInCodeForm({ next }: { next?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await verifySignInCodeAction(code, next);
          if (!result.ok) {
            setError(result.error);
            setCode("");
            return;
          }
          router.replace(result.data.next);
        });
      }}
    >
      <Field label="Code from your authenticator app" htmlFor="sign-in-code" error={error}>
        <CodeInput id="sign-in-code" value={code} onChange={setCode} />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={pending || code.length !== 6}>
        <Spinner on={pending} />
        Continue
      </Button>
    </form>
  );
}

/** Joining from an invite, for an address with no login yet. */
export function JoinForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const notify = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await joinWithPasswordAction(token, { password, confirm });
          if (!result.ok) {
            setErrors(result.fieldErrors ?? {});
            notify(result.error, "error");
            return;
          }
          router.replace(result.data.next);
        });
      }}
    >
      <Field label="Email" htmlFor="join-email" hint="The address you were invited at. It's how you'll sign in.">
        <Input id="join-email" value={email} disabled readOnly autoComplete="username" />
      </Field>
      <Field label="Choose a password" htmlFor="join-password" error={errors.password} hint="At least 8 characters.">
        <Input
          id="join-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Password again" htmlFor="join-confirm" error={errors.confirm}>
        <Input
          id="join-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={pending || !password || !confirm}>
        <Spinner on={pending} />
        Join the team
      </Button>
    </form>
  );
}

/** Joining from an invite, for somebody already signed in as the invited address. */
export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const notify = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="primary"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await acceptInviteAction(token);
          if (!result.ok) {
            notify(result.error, "error");
            return;
          }
          router.replace(result.data.next);
        })
      }
    >
      <Spinner on={pending} />
      Accept and open the admin
    </Button>
  );
}
