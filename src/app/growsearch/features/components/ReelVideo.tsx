"use client";

import { useEffect, useRef, useState } from "react";

/* A demo clip inside a reel card.
   ------------------------------------------------------------------
   Ten of these will end up on this page, so nothing is fetched until the card
   is nearly in view and playback stops again once it leaves — otherwise every
   clip decodes at once and the page costs a phone its battery to scroll.

   Two sources per clip. AV1 is both smaller and cleaner on this kind of flat
   UI capture, but Safari only decodes it where the hardware does, so the H.264
   is what everything else falls back to. First playable source wins, and a
   wrong codec string fails safely into the fallback rather than into nothing. */
export default function ReelVideo({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Assume motion is fine until the browser tells us otherwise; the check
  // cannot run during render.
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimate(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (!animate) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Rejects if the tab is in the background or autoplay is refused.
          // Either way the poster stays up, which is the right fallback.
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <video
      ref={ref}
      poster={`${src}.jpg`}
      muted
      loop
      playsInline
      // No `autoPlay`: the observer starts it, so an offscreen card never
      // pulls the file down. `preload="none"` keeps it that way.
      preload="none"
      aria-label={`${title} product demonstration`}
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={`${src}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
