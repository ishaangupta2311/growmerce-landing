#!/usr/bin/env bash
#
# Encode a screen-capture demo clip for a feature reel card.
#
#   scripts/encode-demo-video.sh <source> <name> [poster-seconds]
#
# Writes public/video/<name>.av1.mp4, <name>.mp4 and <name>.jpg, then prints
# the line to paste into rows-data.ts. Pass --check as a fourth argument to
# also measure quality against a lossless reference (slower).
#
# Why it is shaped this way: docs/demo-video-encoding.md. The short version is
# that captures come off the recorder at absurd bitrates, the card is small,
# and AV1 wins on this content but Safari cannot always decode it.
set -euo pipefail

ARGS=()
CHECK=no
for arg in "$@"; do
  if [ "$arg" = "--check" ]; then CHECK=yes; else ARGS+=("$arg"); fi
done
SRC=${ARGS[0]:?usage: encode-demo-video.sh <source> <name> [poster-seconds] [--check]}
NAME=${ARGS[1]:?usage: encode-demo-video.sh <source> <name> [poster-seconds] [--check]}
POSTER_AT=${ARGS[2]:-}

# Overridable, but only change these with a measurement in hand.
WIDTH=${WIDTH:-1080}     # the card's media well is ~490 CSS px on desktop, ~720 on a
                         # portrait tablet; 1080 covers both. See docs/, Card framing.
FPS=${FPS:-30}
AV1_CRF=${AV1_CRF:-52}
H264_CRF=${H264_CRF:-30}
KEYINT=${KEYINT:-300}    # a loop is never seeked, so keyframes are pure overhead
START=${START:-}         # seconds to drop off the front. A capture usually opens on
                         # whatever was already on screen, and on this page that is
                         # often the panel a neighbouring card is already showing.
DECLARED_CODEC=${DECLARED_CODEC:-av01.0.08M.08}  # must match ReelVideo.tsx

OUT=public/video
mkdir -p "$OUT"

echo "== source =================================================="
ffprobe -v error -select_streams v:0 \
  -show_entries stream=width,height,r_frame_rate,codec_name \
  -show_entries format=duration,size,bit_rate -of default=nw=1 "$SRC"
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$SRC" | grep -q .; then
  echo "note: source has audio; it is being dropped (-an)"
fi

VF="scale=${WIDTH}:-2,fps=${FPS}"

# -ss ahead of -i so the decoder starts there instead of decoding and throwing
# frames away. Expanded as ${SEEK[@]+...} because an empty array under `set -u`
# is an unbound variable in bash 3.2, which is what macOS ships.
SEEK=()
if [ -n "$START" ]; then
  SEEK=(-ss "$START")
  echo "note: dropping the first ${START}s; poster time is measured from the new start"
fi

echo "== encoding ================================================"
# Primary. Smaller *and* cleaner than H.264 on flat UI capture.
ffmpeg -v error -y ${SEEK[@]+"${SEEK[@]}"} -i "$SRC" -an -vf "$VF" \
  -c:v libsvtav1 -crf "$AV1_CRF" -preset 4 -svtav1-params "keyint=${KEYINT}" \
  -pix_fmt yuv420p -movflags +faststart "$OUT/$NAME.av1.mp4" \
  2> >(grep -v '^Svt\[info\]' >&2)

# Fallback. What Safari downloads on hardware without AV1 decode.
ffmpeg -v error -y ${SEEK[@]+"${SEEK[@]}"} -i "$SRC" -an -vf "$VF" \
  -c:v libx264 -crf "$H264_CRF" -preset veryslow -g "$KEYINT" \
  -pix_fmt yuv420p -movflags +faststart "$OUT/$NAME.mp4"

# Poster. It is the first impression on a slow connection and the *only*
# frame a reduced-motion visitor ever sees, so it should show the feature
# working — frame 0 of a capture is usually a static page before anything
# happens.
if [ -z "$POSTER_AT" ]; then
  POSTER_AT=0
  echo "WARNING: no poster timestamp given, using frame 0. Check it shows something."
fi
ffmpeg -v error -y -ss "$POSTER_AT" -i "$OUT/$NAME.mp4" -frames:v 1 -q:v 5 "$OUT/$NAME.jpg"

LEVEL=$(ffprobe -v error -select_streams v:0 -show_entries stream=level -of csv=p=0 "$OUT/$NAME.av1.mp4")
EXPECTED_LEVEL=$(printf '%s' "$DECLARED_CODEC" | cut -d. -f3 | tr -d 'MH')
if [ "$LEVEL" != "$((10#$EXPECTED_LEVEL))" ]; then
  echo "WARNING: AV1 level is $LEVEL but ReelVideo.tsx declares $DECLARED_CODEC."
  echo "         Safari will skip a source whose codec string does not match."
fi

echo "== result =================================================="
# Byte counts, not `du` — disk-block rounding overstates a small file by enough
# to matter when the whole point is the number.
size() { wc -c < "$1" | awk '{printf "%.2f MB", $1/1048576}'; }
printf "  %-34s %s\n" "source" "$(size "$SRC")"
for f in "$OUT/$NAME.av1.mp4" "$OUT/$NAME.mp4" "$OUT/$NAME.jpg"; do
  printf "  %-34s %s\n" "$(basename "$f")" "$(size "$f")"
done

if [ "$CHECK" = yes ]; then
  echo "== quality ================================================="
  REF=$(mktemp -t reelref).mp4
  ffmpeg -v error -y ${SEEK[@]+"${SEEK[@]}"} -i "$SRC" -an -vf "$VF" -c:v libx264 -qp 0 -preset ultrafast "$REF"
  for f in "$OUT/$NAME.av1.mp4" "$OUT/$NAME.mp4"; do
    STATS=$(mktemp)
    printf "  %-28s " "$(basename "$f")"
    ffmpeg -hide_banner -i "$f" -i "$REF" \
      -lavfi "[0:v][1:v]ssim=stats_file=$STATS" -f null - 2>&1 | grep -o 'All:[0-9.]*' | tail -1
    # Averages hide the frames that actually break. Look at these before shipping.
    awk '{for(i=1;i<=NF;i++){split($i,kv,":");d[kv[1]]=kv[2]}
          print d["All"], d["n"]}' "$STATS" | sort -n | head -3 |
      awk -v fps="$FPS" '{printf "      worst: ssim %.4f at %.2fs\n",$1,$2/fps}'
    rm -f "$STATS"
  done
  rm -f "$REF"
  echo "  Judge these at the size the card renders (~492 CSS px wide), not zoomed in."
fi

echo "== wire it up =============================================="
echo "  In src/app/growsearch/features/rows-data.ts, on the row you want:"
echo "      videoSrc: \"/video/$NAME\","
