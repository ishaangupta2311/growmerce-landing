import Logo from "@/components/brand/Logo";

const COLUMNS = [
  { title: "Product", links: ["Voiceshop AI", "Ranklift AI", "Restock IQ", "Convert Copilot"] },
  { title: "Company", links: ["About us", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security"] },
];

export default function Footer() {
  return (
    <footer className="relative z-20 border-t border-ink/10 bg-white/60 px-6 py-16 backdrop-blur-sm md:px-12">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-mute">
            AI products for ecommerce teams who would rather grow than administrate.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-ink-mute transition-colors hover:text-brand"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-[1400px] border-t border-ink/10 pt-6 text-xs text-ink-mute">
        © {new Date().getFullYear()} Growmerce. All rights reserved.
      </div>
    </footer>
  );
}
