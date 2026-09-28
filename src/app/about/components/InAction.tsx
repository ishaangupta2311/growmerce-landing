import Image from "next/image";
import { Box, ChartLine, ShoppingBag, Target, type LucideIcon } from "lucide-react";
import Reveal from "@/components/site/Reveal";

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: "Understands intent", body: "AI reads between the words and understands what shoppers want." },
  { icon: Box, title: "Finds the right products", body: "Relevant results across your entire catalog, in milliseconds." },
  { icon: ShoppingBag, title: "Personalized discovery", body: "Smarter recommendations based on behavior and preferences." },
  { icon: ChartLine, title: "Drives more growth", body: "Better discovery leads to higher conversions and revenue." },
];

export default function InAction() {
  return (
    <section aria-labelledby="action-title" className="mx-auto max-w-[1370px] px-6 py-16 lg:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
        <Reveal>
          <p className="section-eyebrow">See Growmerce in action</p>
          <h2
            id="action-title"
            className="mt-4 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.08] font-extrabold tracking-tight"
          >
            AI that understands.
            <br />
            <span className="text-brand">Results that grow.</span>
          </h2>
          <p className="mt-5 max-w-[34ch] text-[clamp(1rem,1.3vw,1.1875rem)] leading-snug font-semibold text-charcoal">
            From understanding intent to showing the right products, Growmerce
            makes discovery effortless.
          </p>

          <ul className="mt-8 space-y-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-[12px] bg-white text-brand shadow-[0_14px_30px_-20px_rgba(255,90,31,0.7)]">
                    <Icon aria-hidden className="size-6" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-[17px] font-bold text-charcoal">{feature.title}</span>
                    <span className="mt-1 block max-w-[38ch] text-[15px] leading-snug text-body-mute">
                      {feature.body}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-[26px] bg-white p-2 shadow-[0_30px_70px_-40px_rgba(73,28,8,0.45)] ring-1 ring-line/70">
            <Image
              src="/img/demos/linen-shirt.webp"
              alt="Growsearch answering “linen shirt but not white” with six linen shirts in other colours"
              width={1387}
              height={1134}
              sizes="(min-width: 1024px) 720px, 100vw"
              className="h-auto w-full rounded-[20px]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
