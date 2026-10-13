const SRC = "/video/affiliate-onboarding";

/**
 * The walkthrough of getting a client's store onto Growsearch.
 *
 * Only the player. It appears twice, and each place frames it differently: on
 * the dashboard it sits directly under the code, as the answer to "what do I
 * do with this?"; on the public programme page it sits under "How it works",
 * showing somebody who has not applied yet how little there is to it.
 *
 * Native controls and no autoplay. Unlike the looping clips on the features
 * page this one is watched once, on purpose, and scrubbed back to the step
 * somebody got stuck on, so it is a real player rather than moving wallpaper.
 * `preload="none"` keeps a partner who only came to check a balance from
 * paying for a video they did not ask for; the poster is all they download.
 *
 * Two sources for the same reason as `ReelVideo`: AV1 is the smaller file, and
 * the codec string is what lets a Safari that cannot decode it fall through to
 * the H.264 instead of showing nothing. See `docs/demo-video-encoding.md`.
 *
 * No captions track, because there is no soundtrack: every instruction is
 * already text on the screen.
 */
export default function OnboardingVideo() {
  return (
    <video
      controls
      playsInline
      preload="none"
      poster={`${SRC}.jpg`}
      width={1920}
      height={1080}
      aria-label="Tutorial: onboarding a client onto Growsearch with your affiliate code"
      className="aspect-video h-auto w-full rounded-[12px] border border-line bg-cream"
    >
      <source src={`${SRC}.av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
      <source src={`${SRC}.mp4`} type="video/mp4" />
      Your browser cannot play this video.{" "}
      <a href={`${SRC}.mp4`} className="font-bold text-brand underline">
        Download it instead
      </a>
      .
    </video>
  );
}
