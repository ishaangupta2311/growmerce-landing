import Link from "next/link";

const VARIANTS = [
  {
    href: "/v/1",
    name: "01 · Ledger",
    blurb:
      "Editorial print: cream paper, ink serif, the umbrella brand told like an investor-grade document. Growsearch as Exhibit A.",
  },
  {
    href: "/v/3",
    name: "03 · Shopfront",
    blurb:
      "Warm retail: a high street of AI tools — Growsearch's shop is open, the rest are opening soon. A/B winner.",
  },
  {
    href: "/v/4",
    name: "04 · Night Market",
    blurb:
      "The high street after dark — neon, string lights, one glowing shop. Crazier evolution of 03.",
  },
  {
    href: "/v/5",
    name: "05 · Sticker Bazaar",
    blurb:
      "Packaging-print maximalism — sticker sheets, product boxes, packing tape. Crazier evolution of 03.",
  },
];

export default function VariantHub() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-20">
      <h1 className="text-4xl font-bold">Growmerce — design variants</h1>
      <p className="text-body-mute">
        Three directions built on the same brand and Growsearch story. The
        current production page stays at <Link href="/" className="text-brand underline">/</Link>.
      </p>
      <ul className="mt-4 space-y-4">
        {VARIANTS.map((v) => (
          <li key={v.href}>
            <Link
              href={v.href}
              className="block rounded-2xl border border-black/10 p-6 transition-colors hover:border-brand hover:bg-peach/40"
            >
              <span className="text-xl font-bold">{v.name}</span>
              <span className="mt-1 block text-body-mute">{v.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
