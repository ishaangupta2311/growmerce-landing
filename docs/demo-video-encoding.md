# Demo clips — encoding and wiring

How the product demo videos on `/growsearch/features` are produced. Run
`scripts/encode-demo-video.sh` for the mechanics; this file is the reasoning,
so the numbers can be argued with rather than copied blindly.

    scripts/encode-demo-video.sh <source> <name> <poster-seconds> [--check]

It writes `public/video/<name>.av1.mp4`, `<name>.mp4` and `<name>.jpg`, then
prints the line to add to `rows-data.ts`.

## The short version

| | |
|---|---|
| Container / codecs | MP4. AV1 primary, H.264 fallback. Never GIF. |
| Resolution | 1080 wide (portrait 9:16 sources) |
| Frame rate | 30 |
| Audio | stripped (`-an`) |
| CRF | AV1 52, H.264 30 — for flat UI screen capture |
| GOP | 300 frames |
| Poster | a frame showing the feature working, **not** frame 0 |

Encoded so far, none showing visible loss at the size the card renders:

| clip | in | AV1 out | SSIM |
|---|---|---|---|
| `assistant-narrowing` | 92.7 MB | 0.86 MB | 0.9960 |
| `close-enough` | 101.2 MB | 0.71 MB | 0.9964 |
| `endless-refinement` | 76.2 MB | 0.69 MB | 0.9959 |
| `plain-language` | 182.3 MB | 0.99 MB | 0.9960 |
| `never-a-dead-end` | 71.2 MB | 0.70 MB | 0.9962 |

Five sources off the same recorder took the same settings unchanged, which
is the case for treating them as defaults rather than starting points. Output
size tracks clip length and motion, not input size: the 182 MB source is the
longest at 33s, not the most detailed.

## Decisions

**MP4, never GIF.** A 20-second GIF runs 5–20 MB against a few hundred KB for
H.264. GIF is capped at 256 colours, so UI screenshots band and dither; it
cannot be hardware-decoded, so it burns phone battery; and it cannot be
paused, seeked or lazily loaded. A muted looping `<video>` looks identical and
is a real media element.

**Most of the win is not the codec.** The first source arrived at 27.8 Mbps
and 60 fps — roughly Blu-ray bitrate for flat-coloured UI. Dropping to 30 fps
and letting the encoder choose its own bitrate did nearly all the work.
Expect recorder output to be wildly overspecified and do not be impressed by
the compression ratio.

**Resolution is not the lever — measured, not assumed.** At a fixed file size,
holding 1080 and raising CRF beat scaling down every time:

| | size | SSIM |
|---|---|---|
| 1080 @ CRF 32 | 1.37 MB | 0.9903 |
| 720 @ CRF 26 | 1.37 MB | 0.9880 |
| 1080 @ CRF 28 | 1.85 MB | 0.9933 |
| 936 @ CRF 26 | 1.83 MB | 0.9924 |

1080 comes from the card, not from habit: the reel card's media well is about
492 CSS px wide, so 1080 covers a 2× display with a little headroom. **A
different surface needs this re-derived** — encoding above the display size is
pure waste, and the arithmetic is the whole justification for the number.

**Two files, because AV1 wins but Safari is gated.** AV1 is smaller *and*
higher quality here (0.86 MB at SSIM 0.996 against H.264's 1.59 MB at 0.992) —
not a trade-off, just a better codec on this content. But Safari only decodes
AV1 where the hardware does: M3+ Macs, iPhone 15 Pro and newer. So the H.264
still ships, and it is what those visitors pay. Roughly 70–80% of traffic gets
the smaller file.

Source order decides it, first playable wins:

```html
<source src="/video/x.av1.mp4" type='video/mp4; codecs="av01.0.08M.08"'>
<source src="/video/x.mp4" type="video/mp4">
```

That codec string is load-bearing. Without it Safari matches on `video/mp4`,
picks the AV1 it cannot decode, and shows nothing. The level digits must match
what the encode actually produced — the script checks this and warns. Getting
it *wrong* fails safely into the H.264; getting it *absent* does not.

**Long GOP.** These loop and are never seeked, so frequent keyframes are pure
overhead. `-g 300` plus `-preset veryslow` gave back about 10% at identical
SSIM.

**`-movflags +faststart`** puts the index at the front so playback can start
before the file finishes downloading. **`-an`** drops the audio track: dead
weight, and it sidesteps autoplay-policy edge cases.

## Judging quality

Two mistakes to avoid.

**Do not trust the average.** Overall SSIM was 0.99 everywhere, including
settings with visible damage. Per-frame stats found the frames that actually
break — around 9.4s in the first clip, during motion, where a CRF-driven
encoder spends fewest bits. `--check` prints the worst three.

**Do not judge zoomed in.** At 1.8× those worst frames showed obvious ringing
around buttons and prices at CRF 32. Rendered at the ~492 CSS px the card
actually uses, CRF 28 through 32 were all indistinguishable from lossless.
Compare at display size or the encode ends up needlessly large.

The CRF values above suit flat UI capture. Camera footage, gradients or noise
compress far worse — re-measure rather than reusing them.

## Posters

The poster is the first impression on a slow connection and the *only* frame a
`prefers-reduced-motion` visitor ever sees. Frame 0 of a screen capture is
usually a static page before anything happens — the first clip opened on two
seconds of unremarkable banner. Pick a timestamp where the feature is visibly
working.

Better still, trim dead lead-in from the source: it fixes the poster, tightens
the loop, and drops the file size at the same time.

## Playback

`ReelVideo` (`src/app/growsearch/features/components/ReelVideo.tsx`) is a
client component because ten of these will share the page:

- No `autoplay` attribute and `preload="none"`. An IntersectionObserver starts
  playback when the card is within 200px of the viewport and pauses it on the
  way out, so an offscreen card requests **zero bytes**.
- `muted` and `playsinline` are both required — iOS refuses to autoplay
  without them, and without `playsinline` it takes over the screen.
- A reduced-motion preference holds the clip on its poster.

Verify in a real browser. Headless Chrome's virtual-time mode never delivers
IntersectionObserver callbacks, so the clip appears broken when it is not.
Offscreen it should sit at `readyState 0` with nothing requested; scrolled in,
`currentSrc` should be the `.av1.mp4` and `currentTime` should advance in real
time.

## Wiring a clip to a card

Add the base path to the row in
`src/app/growsearch/features/rows-data.ts` — one value names all three files:

```ts
videoSrc: "/video/assistant-narrowing",
```

Rows without one render the placeholder.

## Card framing

Worth knowing before recording, not after.

The card is capped against the viewport (`FeatureReelGrid.tsx`): its height
cannot exceed `100svh - 9rem`, and its width cannot exceed 3/4 of that, so one
card is always visible whole and always portrait. Its natural 9/14 only
survives on a tall window. The consequence for a clip is that **the media well
has no fixed size** — roughly 490 CSS px wide in the desktop two-column
layout, up to ~720 on a portrait tablet, down to ~310 on a short laptop
window. 1080 wide covers that from 1.5x to 3.5x.

`object-cover` fills the well from a 9:16 source, so the shorter the window,
the more is trimmed off the top and bottom.

**The chat input will be hidden.** It is pinned to the bottom of the recorded
UI, which puts it at 73-83% down the frame, while the caption's text begins at
about 64%. Roughly 52 points of frame are clear above the caption, but the
span from the first assistant message to the input is about 64 points, so the
conversation and the cursor cannot both be visible. Shifting or zooming the
clip only trades one for the other. If a clip needs its typing to read, the
fix is in the recording: size the assistant panel so the input sits just under
the last message instead of leaving ~35 points of empty white between them.

The eyebrow pill sits **above** the card, not in the caption — over a clip it
was one more thing covering a demo already short of room. The caption —
gradient, title, rule, bullets — covers the bottom **32-46%** of the well on a
normal desktop window, and up to ~59% on a short one with the wordiest row. It is sized in `cqw` against the well so it holds its fraction
as the card shrinks, but the type has floors, and below roughly a 650px-tall
window those floors win and the caption starts to gain. Only the top half is
reliably seen, so the moment that sells the feature belongs there. The first
clip put its typing interaction underneath the caption; the second happened to
put its result panel at the top of frame, which is what to aim for.

To check a candidate frame against the real crop without building anything,
scale to the well width and centre-crop to the well height:

    ffmpeg -ss <t> -i <clip>.mp4 -frames:v 1 \
      -vf "scale=492:-1,crop=492:673" /tmp/frame.png
