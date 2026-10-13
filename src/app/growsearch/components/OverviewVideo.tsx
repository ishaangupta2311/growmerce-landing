import Reveal from "@/components/site/Reveal";

const SRC = "/video/growsearch-overview";
const LABEL = "Growsearch in 30 seconds: what it does on a storefront";

/* The thirty-second overview, directly under the hero.
   ------------------------------------------------------------------
   Two cuts of the same film. The wide one is laid out for a desk; on a phone
   it would be a 220px strip with unreadable type, so a phone gets the tall cut
   that was composed for one instead.

   They are two elements switched in CSS rather than one element with `media`
   on its sources, because the two cuts are different shapes: the box, the
   poster and the sources all have to change together, and only the sources can
   be switched from inside a single <video>. The hidden one costs its poster
   and nothing else, since neither preloads.

   A real player, not a loop: it is watched once and on purpose, like the
   affiliate tutorial, so it has controls and waits to be pressed. There is no
   soundtrack, so there is nothing to mute and no captions to add.

   Sources and codec string as in `ReelVideo`; see
   `docs/demo-video-encoding.md`. */
function Cut({
  src,
  width,
  height,
  className,
}: {
  src: string;
  width: number;
  height: number;
  className: string;
}) {
  return (
    <video
      controls
      playsInline
      preload="none"
      poster={`${src}.jpg`}
      width={width}
      height={height}
      aria-label={LABEL}
      className={`h-auto rounded-[20px] border border-line bg-cream shadow-[0_30px_60px_-40px_rgba(30,30,30,0.35)] ${className}`}
    >
      <source src={`${src}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
      <source src={`${src}.mp4`} type="video/mp4" />
      Your browser cannot play this video.{" "}
      <a href={`${src}.mp4`} className="font-bold text-brand underline">
        Download it instead
      </a>
      .
    </video>
  );
}

export default function OverviewVideo() {
  return (
    <section aria-labelledby="overview-video-title" className="mx-auto max-w-[1370px] px-6 pb-20 lg:pb-28">
      <Reveal>
        <h2
          id="overview-video-title"
          className="text-center text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.1] font-bold text-charcoal"
        >
          See it in <span className="text-brand">30 seconds</span>
        </h2>
        <div className="mt-8 lg:mt-12">
          <Cut
            src={SRC}
            width={1920}
            height={1080}
            className="mx-auto hidden aspect-video w-full max-w-[1100px] sm:block"
          />
          <Cut
            src={`${SRC}-portrait`}
            width={1080}
            height={1920}
            className="mx-auto aspect-[9/16] w-full max-w-[340px] sm:hidden"
          />
        </div>
      </Reveal>
    </section>
  );
}
