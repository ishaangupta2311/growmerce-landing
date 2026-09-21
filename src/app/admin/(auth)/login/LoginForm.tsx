"use client";

import { useActionState, useState, type FormEvent } from "react";
import { CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { login, type LoginState } from "@/app/admin/_actions/auth";
import { Button, Field, Input } from "@/components/admin/ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ email?: string; password?: string }>({});

  /* The same checks the server makes, run first so an empty field is caught
     instantly. The server repeats them; these only save a round trip. */
  function validate(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const errors: typeof clientErrors = {};
    if (!email) errors.email = "Enter your email address.";
    else if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setClientErrors(errors);
    if (errors.email || errors.password) event.preventDefault();
  }

  const errors = { ...state?.fieldErrors, ...clientErrors };

  return (
    <form action={action} onSubmit={validate} noValidate className="mt-6 space-y-4">
      {state?.error && !pending && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoFocus
          defaultValue={state?.email}
          aria-invalid={Boolean(errors.email) || undefined}
          onChange={() => clientErrors.email && setClientErrors((e) => ({ ...e, email: undefined }))}
          placeholder="you@company.com"
          className="h-10"
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password}>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password) || undefined}
            onChange={() => clientErrors.password && setClientErrors((e) => ({ ...e, password: undefined }))}
            className="h-10 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-zinc-400 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-brand"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
