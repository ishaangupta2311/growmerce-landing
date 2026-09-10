import Reveal from "./Reveal";

export default function HomeIntro() {
  return (
    <section className="border-t border-brand/10 bg-white px-6 py-20 sm:py-28 lg:px-10 lg:py-32">
      <Reveal className="mx-auto max-w-[1160px]">
        <div className="max-w-[1030px]">
          <h2 className="max-w-[1000px] font-poppins text-[clamp(2.4rem,5.7vw,5.8rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-charcoal">
            The AI Search app Built For Ecommerce Stores
          </h2>
          <div className="mt-10 max-w-[1020px] space-y-7 font-poppins text-[clamp(1.15rem,2vw,1.55rem)] leading-[1.45] text-body-mute">
            <p>Stop losing shoppers to dead-end searches. Growmerce reads intent, not just keywords, and turns every search into a sale.</p>
            <p>You can now make product discovery your biggest revenue driver by connecting shoppers to the right products.</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
