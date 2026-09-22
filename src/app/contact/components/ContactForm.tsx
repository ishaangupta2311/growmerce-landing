"use client";

import { useId, useState } from "react";
import { normaliseStoreInput } from "@/lib/store-domain";
import Arrow from "@/components/site/Arrow";

const TOPICS = [
  "Growsearch or product questions",
  "Request a demo",
  "Existing customer support",
  "Partnership inquiry",
  "Something else",
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FIELD_CLASS =
  "mt-2 w-full rounded-[12px] border border-line bg-white px-4 py-3.5 text-[16px] text-charcoal outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";

type FormValues = {
  name: string;
  email: string;
  store: string;
  topic: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  name: "",
  email: "",
  store: "",
  topic: "",
  message: "",
};

export default function ContactForm() {
  const ids = useId();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const setValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status === "error") setStatus("idle");
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!values.name.trim()) next.name = "Please enter your name.";
    if (!EMAIL.test(values.email.trim())) next.email = "Enter a valid work email.";
    if (!values.topic) next.topic = "Choose what you need help with.";
    if (!values.message.trim()) next.message = "Tell us how we can help.";
    if (values.store.trim() && !normaliseStoreInput(values.store)) {
      next.store = "Enter a valid store URL.";
    }
    return next;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, website: "" }),
      });
      if (!response.ok) throw new Error("contact submission failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-[30px] bg-cream px-7 py-14 text-center sm:px-12 lg:px-16 lg:py-20">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-6 text-[clamp(1.75rem,3vw,2.75rem)] font-extrabold">Message sent</h2>
        <p className="mx-auto mt-3 max-w-[48ch] text-[17px] leading-relaxed text-body-mute">
          Thanks for reaching out. We&rsquo;ll make sure your message reaches the right person.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[30px] bg-cream px-7 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <label className="block text-[15px] font-bold text-charcoal" htmlFor={`${ids}-name`}>
          Name
          <input
            id={`${ids}-name`}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            className={FIELD_CLASS}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${ids}-name-error` : undefined}
          />
          {errors.name && <span id={`${ids}-name-error`} className="mt-1.5 block text-sm font-medium text-brand">{errors.name}</span>}
        </label>

        <label className="block text-[15px] font-bold text-charcoal" htmlFor={`${ids}-email`}>
          Work Email
          <input
            id={`${ids}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setValue("email", event.target.value)}
            className={FIELD_CLASS}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${ids}-email-error` : undefined}
          />
          {errors.email && <span id={`${ids}-email-error`} className="mt-1.5 block text-sm font-medium text-brand">{errors.email}</span>}
        </label>

        <label className="block text-[15px] font-bold text-charcoal" htmlFor={`${ids}-store`}>
          Store URL
          <input
            id={`${ids}-store`}
            name="store"
            type="url"
            inputMode="url"
            placeholder="yourstore.com"
            value={values.store}
            onChange={(event) => setValue("store", event.target.value)}
            className={FIELD_CLASS}
            aria-invalid={errors.store ? true : undefined}
            aria-describedby={errors.store ? `${ids}-store-error` : undefined}
          />
          {errors.store && <span id={`${ids}-store-error`} className="mt-1.5 block text-sm font-medium text-brand">{errors.store}</span>}
        </label>

        <label className="block text-[15px] font-bold text-charcoal" htmlFor={`${ids}-topic`}>
          How Can We Help?
          <select
            id={`${ids}-topic`}
            name="topic"
            value={values.topic}
            onChange={(event) => setValue("topic", event.target.value)}
            className={FIELD_CLASS}
            aria-invalid={errors.topic ? true : undefined}
            aria-describedby={errors.topic ? `${ids}-topic-error` : undefined}
          >
            <option value="">Choose a topic</option>
            {TOPICS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          </select>
          {errors.topic && <span id={`${ids}-topic-error`} className="mt-1.5 block text-sm font-medium text-brand">{errors.topic}</span>}
        </label>

        <label className="block text-[15px] font-bold text-charcoal sm:col-span-2" htmlFor={`${ids}-message`}>
          Message
          <textarea
            id={`${ids}-message`}
            name="message"
            rows={6}
            value={values.message}
            onChange={(event) => setValue("message", event.target.value)}
            className={`${FIELD_CLASS} resize-y`}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? `${ids}-message-error` : undefined}
          />
          {errors.message && <span id={`${ids}-message-error`} className="mt-1.5 block text-sm font-medium text-brand">{errors.message}</span>}
        </label>
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 border-t border-brand/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[48ch] text-[13px] leading-relaxed text-body-mute">
          By submitting this form, you agree that Growmerce may use the information provided to respond to your request.
        </p>
        <button type="submit" disabled={status === "submitting"} className="cta-primary w-full shrink-0 sm:w-fit">
          {status === "submitting" ? "Sending..." : "Send message"}
          {status !== "submitting" && <Arrow className="size-4" />}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-4 text-sm font-semibold text-brand">
          We couldn&rsquo;t send your message right now. Please try again.
        </p>
      )}
    </form>
  );
}
