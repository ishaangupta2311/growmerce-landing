const PLACEHOLDERS = Array.from({ length: 6 });

export default function LogoBar() {
  return (
    <section aria-label="Trusted by" className="mt-16 overflow-hidden bg-logobar py-5">
      {/* Infinite marquee: the row is duplicated and slides by -50%. */}
      <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-10 pr-10 hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center gap-10"
            >
              {PLACEHOLDERS.map((_, i) => (
                <div
                  key={i}
                  className="flex h-[69px] w-[166px] items-center justify-center rounded-full bg-white text-4xl text-black"
                >
                  logo
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
