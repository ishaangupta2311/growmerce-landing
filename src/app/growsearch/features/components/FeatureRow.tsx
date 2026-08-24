import Reveal from "@/components/site/Reveal";
import FeatureVisual from "./FeatureVisual";
import type { FeatureRowData } from "../rows-data";

function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0 text-brand"
    >
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FeatureRow({
  row,
  index,
}: {
  row: FeatureRowData;
  index: number;
}) {
  const imageFirst = index % 2 === 0;

  return (
    <Reveal className="py-10 lg:py-12">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className={imageFirst ? "lg:order-1" : "lg:order-2"}>
          <FeatureVisual eyebrow={row.eyebrow} />
        </div>
        <div className={imageFirst ? "lg:order-2" : "lg:order-1"}>
          <p className="text-[13px] font-bold tracking-[0.2em] text-brand uppercase">
            {row.eyebrow}
          </p>
          <h3 className="mt-3 text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.15] font-bold text-charcoal">
            {row.title}
          </h3>
          <ul className="mt-5 space-y-3">
            {row.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-body-mute">
                <Check />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
