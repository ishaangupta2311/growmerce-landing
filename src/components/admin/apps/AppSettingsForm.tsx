"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, LoaderCircle, RotateCw, Trash2 } from "lucide-react";

import { deleteAppAction, saveAppAction } from "@/app/admin/_actions/apps";
import { ConfirmDialog, useToast } from "@/components/admin/overlay";
import { Button, Card, Field, Input } from "@/components/admin/ui";
import { clsx } from "@/lib/clsx";
import { PLATFORM_LABEL, PLATFORMS, type AppRow, type Platform } from "@/lib/apps/types";

/** "Shop Helper" → "SHOP_HELPER_ANALYTICS_SECRET": the suggestion for a new app's secret. */
function suggestedSecretEnv(name: string): string {
  const stem = name
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9_]+/, "")
    .slice(0, 40)
    .replace(/_+$/, "");
  return stem ? `${stem}_ANALYTICS_SECRET` : "";
}

/**
 * A new app's form, or an existing app's settings. `readOnly` is for a role
 * that can see app settings but not change them: the same fields, disabled,
 * and no Save.
 */
export default function AppSettingsForm({ app, readOnly = false }: { app: AppRow | null; readOnly?: boolean }) {
  const router = useRouter();
  const notify = useToast();
  const [name, setName] = useState(app?.name ?? "");
  const [platforms, setPlatforms] = useState<Platform[]>(app?.platforms ?? ["shopify"]);
  const [baseUrl, setBaseUrl] = useState(app?.baseUrl ?? "");
  const [secretEnv, setSecretEnv] = useState(app?.secretEnv ?? "");
  const [secretTouched, setSecretTouched] = useState(app !== null);
  const [iconUrl, setIconUrl] = useState(app?.iconUrl ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const shownSecretEnv = secretTouched ? secretEnv : suggestedSecretEnv(name);

  const togglePlatform = (platform: Platform) =>
    setPlatforms((list) => (list.includes(platform) ? list.filter((item) => item !== platform) : [...list, platform]));

  return (
    <Card title="About the app" description="Shown on its card in Your apps, and how the admin reaches it.">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (readOnly) return;
          startTransition(async () => {
            const result = await saveAppAction(app?.id ?? null, {
              name,
              platforms,
              baseUrl,
              secretEnv: shownSecretEnv,
              iconUrl,
            });
            if (!result.ok) {
              setErrors(result.fieldErrors ?? {});
              notify(result.error, "error");
              return;
            }
            setErrors({});
            notify(result.message ?? "Saved.");
            if (app) router.refresh();
            else router.push(`/admin/apps/${result.data.id}`);
          });
        }}
      >
        <fieldset disabled={readOnly} className="min-w-0 space-y-5">
          <Field label="Name" htmlFor="app-name" error={errors.name ?? errors.id}>
            <Input id="app-name" value={name} maxLength={60} onChange={(event) => setName(event.target.value)} required />
          </Field>

          <Field label="Platforms" error={errors.platforms}>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Platforms">
              {PLATFORMS.map((platform) => {
                const on = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => togglePlatform(platform)}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-xs hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:text-zinc-500"
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        "grid size-4 place-items-center rounded",
                        on ? "bg-brand text-white" : "border-[1.5px] border-zinc-300 bg-white",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {PLATFORM_LABEL[platform]}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label="App address"
            htmlFor="app-url"
            error={errors.baseUrl}
            hint="Where the app runs. The admin asks it for its stores and dashboards here."
          >
            <Input
              id="app-url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://app.example.com"
              className="font-mono text-[13px]"
              required
            />
          </Field>

          <Field
            label="Shared secret"
            htmlFor="app-secret"
            error={errors.secretEnv}
            hint={
              <>
                The <em>name</em> of the environment variable holding the secret on this site. The secret itself lives in
                Vercel&rsquo;s settings, never in the database. The app needs the same value.
              </>
            }
          >
            <Input
              id="app-secret"
              value={shownSecretEnv}
              onChange={(event) => {
                setSecretTouched(true);
                setSecretEnv(event.target.value.toUpperCase());
              }}
              placeholder="MY_APP_ANALYTICS_SECRET"
              className="font-mono text-[13px]"
              required
            />
          </Field>

          <Field
            label="Icon (optional)"
            htmlFor="app-icon"
            error={errors.iconUrl}
            hint="A path on this site like /brand/icon.svg, or an https address. Empty shows the first letter."
          >
            <Input
              id="app-icon"
              value={iconUrl}
              onChange={(event) => setIconUrl(event.target.value)}
              className="font-mono text-[13px]"
            />
          </Field>

          {!readOnly && (
            <Button type="submit" variant="primary" disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              {app ? "Save" : "Add app"}
            </Button>
          )}
        </fieldset>
      </form>
    </Card>
  );
}

export function TestAgainButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
      Test connection
    </Button>
  );
}

export function RemoveAppCard({ app }: { app: AppRow }) {
  const router = useRouter();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Card title="Remove app" description="Takes it off Your apps, with its starred stores. The app itself is untouched.">
      <Button variant="dangerGhost" onClick={() => setOpen(true)}>
        <Trash2 className="size-4" />
        Remove {app.name}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Remove ${app.name}?`}
        confirmLabel="Remove"
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteAppAction(app.id);
            if (!result.ok) {
              notify(result.error, "error");
              return;
            }
            notify(result.message ?? "Removed.");
            router.push("/admin/apps");
          })
        }
      >
        Its card and starred stores go. Nothing changes in {app.name} or for its merchants, and you can add it again
        later.
      </ConfirmDialog>
    </Card>
  );
}
