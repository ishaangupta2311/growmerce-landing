import type { FeatureRowData } from "../rows-data";

/* Small CSS-only mock UIs standing in for a per-feature screenshot — one
   tasteful visual per category, no new image assets. Figma leaves these as
   grey `IMAGE` rectangles; per the brief those are never shipped as-is. */

function SmartFilteringVisual() {
  return (
    <div className="w-full max-w-[380px] rounded-[24px] border border-line bg-cream p-5">
      <div className="rounded-full border border-line bg-white px-4 py-2.5 text-[13px] font-medium text-charcoal">
        “only under $20, in stock”
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Under $20", "In stock", "Skincare"].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-[12px] font-semibold text-brand"
          >
            {chip}
            <span aria-hidden>×</span>
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {["Vitamin C serum — $18", "Clay mask — $14"].map((row) => (
          <div
            key={row}
            className="rounded-lg bg-white px-3 py-2 text-[13px] text-charcoal shadow-sm"
          >
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}

function ShopperExperienceVisual() {
  return (
    <div className="w-full max-w-[380px] rounded-[24px] border border-line bg-cream p-5">
      <p className="text-[13px] text-muted line-through">kava drinks</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
          0 results
        </span>
        <span className="text-[13px] text-body-mute">→ closest match</span>
      </div>
      <div className="mt-3 rounded-lg bg-white px-3 py-2.5 text-[13px] font-medium text-charcoal shadow-sm">
        Kratom Seltzers
      </div>
      <div className="mt-2 rounded-lg bg-white px-3 py-2.5 text-[13px] font-medium text-charcoal shadow-sm">
        Herbal Energy Tonic
      </div>
    </div>
  );
}

function BuyerExperienceVisual() {
  return (
    <div className="w-full max-w-[380px] rounded-[24px] border border-line bg-cream p-5">
      <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
        You might also like
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-gradient-to-br from-brand/20 to-brand/5"
          />
        ))}
      </div>
    </div>
  );
}

function PerformanceVisual() {
  return (
    <div className="w-full max-w-[380px] rounded-[24px] border border-line bg-cream p-5">
      <div className="flex items-center justify-between text-[12px] font-semibold text-muted">
        <span>Native results</span>
        <span className="text-charcoal">~40ms</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white">
        <div className="h-full w-[20%] rounded-full bg-charcoal" />
      </div>
      <div className="mt-4 flex items-center justify-between text-[12px] font-semibold text-muted">
        <span>+ AI semantic layer</span>
        <span className="text-brand">~250ms</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white">
        <div className="h-full w-[75%] rounded-full bg-brand" />
      </div>
    </div>
  );
}

function MerchantInsightsVisual() {
  const bars = [40, 65, 50, 80, 60, 95, 70];
  return (
    <div className="w-full max-w-[380px] rounded-[24px] border border-line bg-cream p-5">
      <div className="flex h-24 items-end gap-2">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-md bg-brand/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="mt-3 text-[13px] font-medium text-body-mute">
        Searches, clicks and checkouts, in one view
      </p>
    </div>
  );
}

const VISUALS: Record<FeatureRowData["eyebrow"], () => React.JSX.Element> = {
  "SMART FILTERING": SmartFilteringVisual,
  "SHOPPER EXPERIENCE": ShopperExperienceVisual,
  "BUYER EXPERIENCE": BuyerExperienceVisual,
  PERFORMANCE: PerformanceVisual,
  "MERCHANT INSIGHTS": MerchantInsightsVisual,
};

export default function FeatureVisual({
  eyebrow,
}: {
  eyebrow: FeatureRowData["eyebrow"];
}) {
  const Visual = VISUALS[eyebrow];
  return (
    <div className="flex justify-center">
      <Visual />
    </div>
  );
}
