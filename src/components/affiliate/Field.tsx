/**
 * The form controls the affiliate surface uses, and the one reason they are
 * shared: a label that is genuinely tied to its input.
 *
 * Every field here takes an id from React's `useId` and points `htmlFor` at
 * it, so tapping the label focuses the control and a screen reader announces
 * the two together. That is easy to do by hand and just as easy to forget on
 * the fourth field of the fifth form.
 *
 * `useId`, not the field's `name`. Ids only have to be unique per page, and
 * names are not: the admin payouts page renders one payout form per partner
 * per currency, each with a `reference` and a `note`. With ids from names,
 * every label on that page pointed at the first form's controls — a click on
 * the third partner's "Bank reference" focused the first partner's, possibly
 * inside a closed `<details>` where nothing visibly happened at all.
 *
 * `hint` is rendered below the input and wired through `aria-describedby`,
 * because a hint a sighted user reads before typing is one a screen-reader user
 * should hear before typing too, not after they have got it wrong.
 */

import { useId } from "react";

type Common = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
};

const CONTROL =
  "w-full rounded-[10px] border border-line bg-white px-4 py-3 text-[16px] text-charcoal " +
  "outline-none transition-[border-color,box-shadow] placeholder:text-muted " +
  "focus:border-brand focus:ring-2 focus:ring-brand/25";

function Shell({
  id,
  label,
  hint,
  required,
  children,
}: Common & { id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block font-poppins text-[14px] font-bold text-charcoal">
        {label}
        {!required && <span className="ml-1.5 font-normal text-muted">optional</span>}
      </label>
      <div className="mt-2">{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13.5px] leading-snug text-body-mute">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Field({
  type = "text",
  placeholder,
  autoComplete,
  ...common
}: Common & { type?: string; placeholder?: string; autoComplete?: string }) {
  const id = useId();
  return (
    <Shell {...common} id={id}>
      <input
        id={id}
        name={common.name}
        type={type}
        required={common.required}
        defaultValue={common.defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={common.hint ? `${id}-hint` : undefined}
        className={CONTROL}
      />
    </Shell>
  );
}

export function TextArea({
  rows = 4,
  placeholder,
  ...common
}: Common & { rows?: number; placeholder?: string }) {
  const id = useId();
  return (
    <Shell {...common} id={id}>
      <textarea
        id={id}
        name={common.name}
        rows={rows}
        required={common.required}
        defaultValue={common.defaultValue}
        placeholder={placeholder}
        aria-describedby={common.hint ? `${id}-hint` : undefined}
        className={`${CONTROL} resize-y`}
      />
    </Shell>
  );
}

export function Select({
  options,
  ...common
}: Common & { options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <Shell {...common} id={id}>
      <select
        id={id}
        name={common.name}
        required={common.required}
        defaultValue={common.defaultValue}
        aria-describedby={common.hint ? `${id}-hint` : undefined}
        className={CONTROL}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/**
 * The agency-or-creator choice, as two cards rather than a dropdown.
 *
 * It decides how the person is paid — once per store, or every month that store
 * stays — and it is not editable afterwards without us doing it by hand. A
 * choice with those consequences should state them at the point it is made,
 * which a `<select>` has nowhere to put.
 *
 * Still a radio group underneath, so it works without JavaScript, arrow-keys
 * correctly, and submits as one field.
 */
export function KindChoice({
  name = "kind",
  defaultValue = "agency",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const options = [
    {
      value: "agency",
      title: "Web-dev agency",
      body: "You build and look after stores. You earn on every payment a store you referred makes, for as long as it stays subscribed.",
    },
    {
      value: "influencer",
      title: "Creator or influencer",
      body: "You send merchants our way. You earn a one-off share of the first payment from every store you bring.",
    },
  ];

  return (
    <fieldset>
      <legend className="font-poppins text-[14px] font-bold text-charcoal">
        How are you joining?
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="group relative cursor-pointer rounded-[12px] border border-line bg-white p-4 transition-colors has-checked:border-brand has-checked:bg-cream has-focus-visible:ring-2 has-focus-visible:ring-brand/40"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              className="absolute top-4 right-4 size-4 accent-[color:var(--color-brand)]"
            />
            <p className="pr-7 font-poppins text-[15.5px] font-bold text-charcoal">
              {option.title}
            </p>
            <p className="mt-1.5 text-[13.5px] leading-snug text-body-mute">{option.body}</p>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
