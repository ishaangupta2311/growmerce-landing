"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import type { Option } from "@/lib/blog/types";
import { clsx } from "@/lib/clsx";

/**
 * Tags as removable chips, with type-ahead over existing tags and Enter to
 * create a new one on the spot.
 */
export default function TagPicker({
  id,
  options,
  value,
  onChange,
  onCreate,
}: {
  id: string;
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  onCreate: (name: string) => Promise<Option | null>;
}) {
  const listId = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);

  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const selected = value.map((tagId) => byId.get(tagId)).filter((option): option is Option => Boolean(option));

  const needle = text.trim().toLowerCase();
  const matches = options
    .filter((option) => !value.includes(option.id) && (!needle || option.name.toLowerCase().includes(needle)))
    .slice(0, 8);
  const exact = options.find((option) => option.name.toLowerCase() === needle);
  const canCreate = Boolean(needle) && !exact;
  const rows = matches.length + (canCreate ? 1 : 0);

  function add(option: Option) {
    if (!value.includes(option.id)) onChange([...value, option.id]);
    setText("");
    setActive(0);
  }

  async function create() {
    const name = text.trim();
    if (!name) return;
    setCreating(true);
    const option = await onCreate(name);
    setCreating(false);
    if (option) add(option);
  }

  function choose(index: number) {
    if (index < matches.length) add(matches[index]);
    else if (canCreate) void create();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(rows - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (exact && !value.includes(exact.id)) add(exact);
      else if (rows > 0) choose(active);
    } else if (event.key === "Backspace" && !text && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-xs focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
        {selected.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pr-1 pl-2 text-xs font-semibold text-zinc-700">
            {tag.name}
            <button
              type="button"
              onClick={() => onChange(value.filter((tagId) => tagId !== tag.id))}
              className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={selected.length ? "" : "Add tags…"}
          role="combobox"
          aria-expanded={open && rows > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-zinc-400"
        />
        {creating && <LoaderCircle className="size-4 animate-spin text-zinc-400" />}
      </div>

      {open && rows > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {matches.map((option, index) => (
            <li
              key={option.id}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => add(option)}
              onMouseEnter={() => setActive(index)}
              className={clsx("cursor-pointer rounded-md px-2.5 py-1.5 text-sm", index === active ? "bg-zinc-100" : "")}
            >
              {option.name}
            </li>
          ))}
          {canCreate && (
            <li
              role="option"
              aria-selected={active === matches.length}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void create()}
              onMouseEnter={() => setActive(matches.length)}
              className={clsx(
                "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-brand",
                active === matches.length ? "bg-brand/5" : "",
              )}
            >
              <Plus className="size-3.5" />
              Create “{text.trim()}”
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
