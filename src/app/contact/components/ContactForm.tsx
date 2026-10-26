"use client";

import { useId, useState } from "react";
import { isPhone } from "@/lib/phone";
import Arrow from "@/components/site/Arrow";

const TOPICS = [
  "Growsearch or product questions",
  "Request a demo",
  "Existing customer support",
  "Partnership inquiry",
  "Something else",
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LABEL_CLASS = "block text-[15px] font-bold text-charcoal";
const FIELD_CLASS =
  "mt-2 w-full rounded-[12px] border border-line bg-white px-4 py-3.5 text-[16px] font-normal text-charcoal outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15";
const CARD_CLASS = "rounded-[24px] bg-white shadow-[0_30px_60px_-40px_rgba(23,23,23,0.35)]";

type FormValues = {
  name: string;
  company: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  name: "",
  company: "",
  email: "",
  phone: "",
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
    if (!values.company.trim()) next.company = "Please enter your company name.";
    if (!EMAIL.test(values.email.trim())) next.email = "Enter a valid email.";
    if (!isPhone(values.phone)) next.phone = "Enter a valid phone number.";
    if (!values.topic) next.topic = "Choose what you need help with.";
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
      <div className={`${CARD_CLASS} px-7 py-14 text-center sm:px-10`}>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m4 12.5 5.5 5.5L20 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-6 text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold">Thanks, we&rsquo;ve got it</h2>
        <p className="mx-auto mt-3 max-w-[40ch] text-[17px] leading-relaxed text-body-mute">
          Someone from our team will reach out shortly.
        </p>
      </div>
    );
  }

  const field = (key: keyof FormValues) => ({
    id: `${ids}-${key}`,
    name: key,
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValue(key, event.target.value),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${ids}-${key}-error` : undefined,
  });

  const error = (key: keyof FormValues) =>
    errors[key] && (
      <span id={`${ids}-${key}-error`} className="mt-1.5 block text-sm font-medium text-brand">
        {errors[key]}
      </span>
    );

  return (
    <form onSubmit={submit} noValidate className={`${CARD_CLASS} px-6 py-7 sm:px-8 sm:py-9`}>
      <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
        <label className={LABEL_CLASS} htmlFor={`${ids}-name`}>
          Your name
          <input {...field("name")} autoComplete="name" className={FIELD_CLASS} />
          {error("name")}
        </label>

        <label className={LABEL_CLASS} htmlFor={`${ids}-company`}>
          Company name
          <input {...field("company")} autoComplete="organization" className={FIELD_CLASS} />
          {error("company")}
        </label>

        <label className={LABEL_CLASS} htmlFor={`${ids}-email`}>
          Email
          <input {...field("email")} type="email" inputMode="email" autoComplete="email" className={FIELD_CLASS} />
          {error("email")}
        </label>

        <label className={LABEL_CLASS} htmlFor={`${ids}-phone`}>
          Phone number
          <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel" className={FIELD_CLASS} />
          {error("phone")}
        </label>

        <label className={`${LABEL_CLASS} sm:col-span-2`} htmlFor={`${ids}-topic`}>
          How can we help?
          <select {...field("topic")} className={FIELD_CLASS}>
            <option value="">Choose a topic</option>
            {TOPICS.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          </select>
          {error("topic")}
        </label>

        <label className={`${LABEL_CLASS} sm:col-span-2`} htmlFor={`${ids}-message`}>
          Any growth challenge? <span className="font-medium text-muted">(optional)</span>
          <textarea
            {...field("message")}
            rows={4}
            maxLength={5000}
            placeholder="e.g. traffic is up but sales aren't"
            className={`${FIELD_CLASS} resize-y`}
          />
          {error("message")}
        </label>
      </div>

      <button type="submit" disabled={status === "submitting"} className="cta-primary mt-7 w-full">
        {status === "submitting" ? "Sending..." : "Let's talk"}
        {status !== "submitting" && <Arrow className="cta-arrow size-4" />}
      </button>
      {status === "error" && (
        <p role="alert" className="mt-4 text-sm font-semibold text-brand">
          We couldn&rsquo;t send that right now. Please try again.
        </p>
      )}
    </form>
  );
}
