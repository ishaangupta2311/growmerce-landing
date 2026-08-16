import Image from "next/image";
import styles from "../shopfront.module.css";

/* --------------------------------------------------------------------------
   The hero product, as a carton on the shop floor.

   A CSS-3D box: one front face plus two hinged panels (top flap, right-hand
   spine) rotated into place inside a shared perspective. The technique is the
   same one used on the variant-05 shelf, re-drawn in this route's language —
   white stock, soft warm shadows, the 22px family of radii, orange spine —
   instead of that page's kraft-and-sticker styling.

   The whole thing turns a few degrees as the scene's --p advances, so the box
   presents itself to the visitor as the shop opens up around it.
-------------------------------------------------------------------------- */

/** Deterministic bar widths — identical on the server and in the browser. */
function barWidths(seed: string, count: number) {
  let h = 2166136261;
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    h ^= seed.charCodeAt(i % seed.length) + i * 7;
    h = Math.imul(h, 16777619) >>> 0;
    out.push(1 + (h % 3));
  }
  return out;
}

function Barcode({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex items-end gap-[2px] overflow-hidden ${className ?? ""}`}
    >
      {barWidths("growsearch-v3", 30).map((w, i) => (
        <span
          key={i}
          className="block h-full shrink-0 bg-[#171717]"
          style={{ width: `${w}px`, opacity: i % 5 === 3 ? 0.5 : 0.88 }}
        />
      ))}
    </span>
  );
}

export default function ProductCarton() {
  return (
    <div className="relative pt-9 pb-2">
      {/* Floor shadow — stays flat while the box turns and drifts above it. */}
      <div
        aria-hidden
        className="absolute inset-x-8 bottom-0 h-5 rounded-[50%] bg-[radial-gradient(closest-side,rgba(96,44,14,0.32),transparent)] blur-[3px]"
      />

      <div className={`${styles.cartonScene} relative mx-auto w-full max-w-[318px]`}>
        <div className={styles.cartonLift}>
        <div className={styles.cartonFloat}>
        <div className={styles.carton3d}>
          {/* Receding top flap — corrugated, because that is what a box is. */}
          <div
            aria-hidden
            className={`${styles.cartonTop} ${styles.corrugate} rounded-t-[14px]`}
          />

          {/* Receding right-hand panel, printed like a spine. */}
          <div className={`${styles.cartonSide} rounded-r-[14px]`}>
            <span
              aria-hidden
              className={`${styles.display} text-[12px] font-extrabold tracking-[0.22em] text-white/90 uppercase`}
              style={{ writingMode: "vertical-rl" }}
            >
              Growsearch
            </span>
          </div>

          {/* Front face. */}
          <div
            className={`${styles.cartonFace} relative overflow-hidden rounded-[14px] bg-white ring-1 ring-[#171717]/12`}
          >
            {/* Both labels sit left: the New! flash owns the right corner. */}
            <div
              className={`${styles.display} flex items-center gap-2 bg-[#ff5a1f] px-3.5 py-1.5 text-[9.5px] font-extrabold tracking-[0.22em] text-white uppercase`}
            >
              <span>Growmerce</span>
              <span aria-hidden className="opacity-50">
                ·
              </span>
              <span className="opacity-85">Shop 01</span>
            </div>

            <div className="px-3.5 pt-3 pb-3.5">
              <p
                className={`${styles.display} text-[22px] leading-none font-extrabold`}
              >
                Growsearch
              </p>
              <p className="mt-1 text-[11px] leading-tight font-semibold text-[#8a6b58]">
                Storefront search, boxed and ready
              </p>

              {/* Window onto the product itself. */}
              <div className="mt-2.5 overflow-hidden rounded-[9px] bg-[#ffe4d6] p-1 ring-1 ring-[#171717]/10">
                <Image
                  src="/img/smart-search-mock.png"
                  alt=""
                  width={900}
                  height={520}
                  sizes="320px"
                  className="h-[84px] w-full rounded-[6px] object-cover object-top"
                />
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[8.5px] font-bold tracking-[0.18em] text-[#8a8a8a] uppercase">
                    Net contents
                  </p>
                  <p
                    className={`${styles.display} text-[12px] font-extrabold text-[#171717]`}
                  >
                    1 Shopify storefront
                  </p>
                </div>
                <div className="text-right">
                  <Barcode className="ml-auto h-6 w-[92px]" />
                  <p className="mt-0.5 text-[7.5px] font-bold tracking-[0.26em] text-[#8a8a8a]">
                    GRW·03·0001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* NEW! flash, stuck on the corner of the carton. */}
          {/* Held just inside the shop's own rounded clip on narrow screens. */}
          <div
            className={`${styles.cartonFlash} absolute -top-6 -right-1 size-[82px] sm:-right-6`}
          >
            <span
              className={`${styles.starburst} ${styles.driftSlow} grid size-full place-items-center bg-[#ffcf6b] text-center`}
            >
              <span className={`${styles.display} block text-[15px] leading-none font-extrabold`}>
                New!
                <span className="mt-0.5 block text-[7px] font-bold tracking-[0.14em] uppercase">
                  In stock
                </span>
              </span>
            </span>
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
