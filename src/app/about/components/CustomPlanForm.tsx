import Arrow from "@/components/site/Arrow";

/* The Figma's custom-plan box: three fields and "Get My custom Plan". A plain
   GET to /pricing, so it works before any script loads. */
const FIELD =
  "h-14 w-full rounded-full border border-line bg-[#f3eeeb] px-6 text-[16px] text-charcoal placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none";

const VISITORS = ["Under 10,000", "10,000 – 50,000", "50,000 – 250,000", "250,000+"];
const PLATFORMS = ["Shopify", "WooCommerce", "BigCommerce", "Something else"];

export default function CustomPlanForm() {
  return (
    <section aria-labelledby="plan-title" className="mx-auto max-w-[1370px] px-6 py-16">
      <form
        action="/pricing"
        method="get"
        className="mx-auto max-w-[1240px] rounded-[30px] border-[3px] border-brand px-7 py-10 text-center sm:px-12"
      >
        <h2 id="plan-title" className="text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold tracking-tight">
          Get a plan sized to your store
        </h2>
        <div className="mt-8 grid gap-4 text-left md:grid-cols-3 md:gap-6">
          <label className="block">
            <span className="sr-only">Store URL</span>
            <input name="store" type="text" inputMode="url" autoComplete="url" placeholder="Store URL" className={FIELD} />
          </label>
          <label className="block">
            <span className="sr-only">Monthly visitors</span>
            <select name="visitors" defaultValue="" className={`${FIELD} appearance-none`}>
              <option value="" disabled>
                Monthly visitors
              </option>
              {VISITORS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Platform</span>
            <select name="platform" defaultValue="" className={`${FIELD} appearance-none`}>
              <option value="" disabled>
                Platform
              </option>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="mt-8 inline-flex items-center gap-3 rounded-[10px] border-2 border-brand bg-peach/40 px-6 py-3 text-[18px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Get My custom Plan
          <Arrow className="size-5" />
        </button>
      </form>
    </section>
  );
}
