#!/usr/bin/env python3
"""Generate and align Deepgram and Gemini voiceovers for Growsearch demo clips."""

from __future__ import annotations

import concurrent.futures
import csv
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VIDEO_DIR = ROOT / "public" / "video"
PACKAGE_DIR = ROOT / "public" / "media" / "growsearch-voiceovers"
CACHE_DIR = ROOT / ".voiceover-cache"
SAMPLE_RATE = 24_000
LEAD_SECONDS = 0.12


@dataclass(frozen=True)
class Beat:
    start: float
    end: float
    text: str
    direction: str


@dataclass(frozen=True)
class Clip:
    name: str
    beats: tuple[Beat, ...]


CLIPS = (
    Clip(
        "endless-refinement",
        (
            Beat(0, 6, "Watch this gift search go from browsing... to one clear option.", "confident and conversational"),
            Beat(6, 13, "It's for my sister. Keep it under fifty dollars. Then—only discounted products.", "curious, with building momentum"),
            Beat(13, 21.266667, "Are these vegan? One gift box remains. Grow Search lets shoppers narrow things down, one follow-up at a time.", "warm, satisfied, and confident"),
        ),
    ),
    Clip(
        "never-a-dead-end",
        (
            Beat(0, 6, "What if your search bar could answer back? Here, a shopper has a makeup question.", "intriguing and conversational"),
            Beat(6, 13, "My foundation looks different outside. Grow Search recommends a mirror—and they ask about the lighting modes.", "empathetic and helpful"),
            Beat(13, 23.533333, "Then: is it magnifying? They get the answer and add it to cart, right here. That's Grow Search—helping shoppers make a decision.", "building energy, ending with warm confidence"),
        ),
    ),
    Clip(
        "close-enough",
        (
            Beat(0, 6, "No exact match doesn't have to end the search. Watch this.", "reassuring and intriguing"),
            Beat(6, 14, "Grow Search shows alternatives. The shopper explains their skin type and what they're looking for.", "clear and conversational"),
            Beat(14, 21, "Only show options under twenty-five dollars. Now there are two. Then they ask another product question.", "focused, with building momentum"),
            Beat(21, 27.266667, "Compare the options. Add one to cart. Give shoppers a way to keep going.", "confident, with a satisfying finish"),
        ),
    ),
    Clip(
        "fast-first",
        (
            Beat(0, 5, "Quick matches first. Then a more focused search.", "brisk and confident"),
            Beat(5, 15, "Here, a shopper searches for sunscreen, then explains the finish they want. Grow Search recommends options and explains the differences.", "helpful and conversational"),
            Beat(15, 24, "Next, they set a twenty-five-dollar budget. The product list narrows to two options.", "clear, with building momentum"),
            Beat(24, 31, "Changed their mind? I meant thirty-five. The results update again.", "lightly playful and responsive"),
            Beat(31, 36.633333, "Then they add to cart, right from search. That's Grow Search.", "upbeat and satisfied"),
        ),
    ),
    Clip(
        "assistant-narrowing",
        (
            Beat(0, 6, "Two shampoos. Different benefits. How does your shopper choose?", "curious and direct"),
            Beat(6, 14, "They explain: colour-treated hair that gets frizzy in humidity. Grow Search lays out the options. Which are sulphate-free?", "empathetic and informative"),
            Beat(14, 21, "Compare these two. Then: preserving my colour matters more.", "thoughtful, with building focus"),
            Beat(21, 26.7, "The recommendation follows their priority. Grow Search helps shoppers choose through conversation.", "warm and confident"),
        ),
    ),
    Clip(
        "visitor-journeys",
        (
            Beat(0, 5, "What happened after that search? Open a visitor journey in Grow Search.", "curious and inviting"),
            Beat(5, 10, "See the searches, returned results, and follow-up questions.", "clear and insightful"),
            Beat(10, 14.4, "Then read the AI's responses, step by step.", "confident, with a satisfying finish"),
        ),
    ),
    Clip(
        "what-shoppers-want",
        (
            Beat(0, 3, "Does your store search lead anywhere?", "curious and direct"),
            Beat(3, 8.766667, "Grow Search tracks clicks, add-to-carts, and purchases from search. See the numbers.", "clear and confident"),
        ),
    ),
    Clip(
        "top-searches",
        (
            Beat(0, 3.5, "Your shoppers are telling you what they want.", "insightful and engaging"),
            Beat(3.5, 7.166667, "Grow Search shows their searches—and what happened next.", "confident, with a satisfying finish"),
        ),
    ),
    Clip(
        "search-opportunities",
        (
            Beat(0, 3.4, "Slow searches. Missing matches. No clicks.", "direct and urgent"),
            Beat(3.4, 7.6, "Grow Search flags the issues, so you know what to fix first.", "clear and decisive"),
        ),
    ),
)


MODELS = {
    "flux-wade": {
        "model": "deepgram/flux-tts:free",
        "voice": "flux-wade-en",
        "format": "mp3",
        "folder": "deepgram-flux-wade",
    },
    "gemini-puck": {
        "model": "google/gemini-3.1-flash-tts-preview",
        "voice": "Puck",
        "format": "pcm",
        "folder": "gemini-puck",
    },
}


def load_api_key() -> str:
    if key := os.environ.get("OPENROUTER_API_KEY"):
        return key
    env_path = ROOT / ".env"
    if env_path.exists():
        for raw_line in env_path.read_text().splitlines():
            line = raw_line.strip()
            if line.startswith("OPENROUTER_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("OPENROUTER_API_KEY was not found in the environment or .env")


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def capture(*args: str) -> str:
    return subprocess.check_output(args, text=True).strip()


def synthesize(api_key: str, model_key: str, clip: Clip, index: int, beat: Beat) -> Path:
    config = MODELS[model_key]
    suffix = config["format"]
    output = CACHE_DIR / model_key / f"{clip.name}-{index:02d}.{suffix}"
    if output.exists() and output.stat().st_size > 0:
        return output

    output.parent.mkdir(parents=True, exist_ok=True)
    spoken_input = beat.text
    if model_key == "gemini-puck":
        spoken_input = f"[{beat.direction}] {beat.text}"

    payload = json.dumps(
        {
            "model": config["model"],
            "input": spoken_input,
            "voice": config["voice"],
            "response_format": config["format"],
        }
    ).encode()
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/audio/speech",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    for attempt in range(1, 5):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                audio = response.read()
                content_type = response.headers.get("Content-Type", "")
                if not content_type.startswith("audio/"):
                    raise RuntimeError(f"Unexpected response type {content_type}: {audio[:200]!r}")
                output.write_bytes(audio)
                print(f"generated {model_key:11} {clip.name} beat {index + 1}/{len(clip.beats)}", flush=True)
                return output
        except urllib.error.HTTPError as error:
            body = error.read().decode(errors="replace")
            if error.code not in (429, 502) or attempt == 4:
                raise RuntimeError(f"OpenRouter returned HTTP {error.code}: {body}") from error
            time.sleep(2**attempt)
        except (TimeoutError, urllib.error.URLError) as error:
            if attempt == 4:
                raise RuntimeError(f"OpenRouter request failed: {error}") from error
            time.sleep(2**attempt)
    raise AssertionError("unreachable")


def pcm_duration(path: Path) -> float:
    return path.stat().st_size / (SAMPLE_RATE * 2)


def prepare_beat(source: Path, model_key: str, target_seconds: float, work_dir: Path) -> bytes:
    raw_pcm = work_dir / f"{source.stem}-decoded.pcm"
    if model_key == "flux-wade":
        run(
            "ffmpeg", "-y", "-v", "error", "-i", str(source),
            "-ar", str(SAMPLE_RATE), "-ac", "1", "-f", "s16le", str(raw_pcm),
        )
    else:
        raw_pcm.write_bytes(source.read_bytes())

    duration = pcm_duration(raw_pcm)
    if duration <= target_seconds:
        return raw_pcm.read_bytes()

    speed = duration / target_seconds
    filters: list[str] = []
    while speed > 2:
        filters.append("atempo=2.0")
        speed /= 2
    filters.append(f"atempo={speed:.6f}")
    fitted_pcm = work_dir / f"{source.stem}-fitted.pcm"
    run(
        "ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SAMPLE_RATE),
        "-ac", "1", "-i", str(raw_pcm), "-af", ",".join(filters),
        "-f", "s16le", str(fitted_pcm),
    )
    print(f"fitted    {model_key:11} {source.stem} at {duration / target_seconds:.2f}x", flush=True)
    return fitted_pcm.read_bytes()


def video_duration(path: Path) -> float:
    return float(
        capture(
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        )
    )


def render_clip(clip_number: int, clip: Clip, model_key: str, sources: list[Path]) -> tuple[Path, Path]:
    source_video = VIDEO_DIR / f"{clip.name}.mp4"
    total_duration = video_duration(source_video)
    total_frames = round(total_duration * SAMPLE_RATE)
    timeline = bytearray(total_frames * 2)
    work_dir = CACHE_DIR / model_key / "work" / clip.name
    work_dir.mkdir(parents=True, exist_ok=True)

    for beat, source in zip(clip.beats, sources, strict=True):
        target_seconds = max(0.25, beat.end - beat.start - LEAD_SECONDS - 0.08)
        pcm = prepare_beat(source, model_key, target_seconds, work_dir)
        start_frame = round((beat.start + LEAD_SECONDS) * SAMPLE_RATE)
        available_bytes = max(0, len(timeline) - start_frame * 2)
        pcm = pcm[:available_bytes]
        timeline[start_frame * 2 : start_frame * 2 + len(pcm)] = pcm

    model_dir = PACKAGE_DIR / MODELS[model_key]["folder"]
    side = "customer-side" if clip_number <= 5 else "merchant-side"
    file_stem = f"{clip_number:02d}_{clip.name}"
    audio_path = model_dir / side / "audio" / f"{file_stem}.wav"
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(audio_path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(timeline)

    video_path = model_dir / side / "review-video" / f"{file_stem}.mp4"
    video_path.parent.mkdir(parents=True, exist_ok=True)
    run(
        "ffmpeg", "-y", "-v", "error", "-i", str(source_video), "-i", str(audio_path),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac",
        "-b:a", "160k", "-t", f"{total_duration:.6f}", "-movflags", "+faststart",
        str(video_path),
    )
    print(f"rendered  {model_key:11} {clip.name}", flush=True)
    return audio_path, video_path


def write_cue_sheet() -> Path:
    cue_path = PACKAGE_DIR / "cue-sheet.csv"
    cue_path.parent.mkdir(parents=True, exist_ok=True)
    with cue_path.open("w", newline="") as output:
        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(("clip_number", "side", "source_clip", "beat", "start_seconds", "end_seconds", "voiceover"))
        for clip_number, clip in enumerate(CLIPS, 1):
            side = "customer-side" if clip_number <= 5 else "merchant-side"
            for beat_number, beat in enumerate(clip.beats, 1):
                writer.writerow(
                    (
                        f"{clip_number:02d}",
                        side,
                        f"{clip.name}.mp4",
                        beat_number,
                        f"{beat.start:.3f}",
                        f"{beat.end:.3f}",
                        beat.text,
                    )
                )
    return cue_path


def write_package_notes() -> Path:
    notes_path = PACKAGE_DIR / "README.txt"
    notes_path.write_text(
        "Growsearch voiceover edit package\n"
        "=================================\n\n"
        "Each model folder is divided into customer-side and merchant-side clips.\n"
        "Inside each section:\n"
        "- audio: 24 kHz mono WAV voice tracks, aligned to the original clip timeline\n"
        "- review-video: the original picture with the matching voice track attached\n\n"
        "Voice options:\n"
        "- deepgram-flux-wade: Deepgram Flux TTS, Wade voice\n"
        "- gemini-puck: Google Gemini 3.1 Flash TTS Preview, Puck voice\n\n"
        "Files are numbered in the recommended review and edit order. Import a WAV at\n"
        "00:00 beneath its matching source clip; all pauses are already included. The\n"
        "cue-sheet.csv file lists the narration text and timing for every spoken beat.\n"
    )
    return notes_path


def validate(outputs: list[tuple[Path, Path]]) -> None:
    for audio_path, video_path in outputs:
        if not audio_path.exists() or not video_path.exists():
            raise RuntimeError(f"Missing output for {audio_path.stem}")
        audio_duration = video_duration(audio_path)
        video_length = video_duration(video_path)
        if abs(audio_duration - video_length) > 0.08:
            raise RuntimeError(
                f"Duration mismatch for {video_path.name}: audio={audio_duration}, video={video_length}"
            )
        streams = capture(
            "ffprobe", "-v", "error", "-show_entries", "stream=codec_type",
            "-of", "csv=p=0", str(video_path),
        ).splitlines()
        if "video" not in streams or "audio" not in streams:
            raise RuntimeError(f"Missing media stream in {video_path.name}: {streams}")


def main() -> int:
    api_key = load_api_key()
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tasks: list[tuple[str, Clip, int, Beat]] = []
    for model_key in MODELS:
        for clip in CLIPS:
            for index, beat in enumerate(clip.beats):
                tasks.append((model_key, clip, index, beat))

    generated: dict[tuple[str, str, int], Path] = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_map = {
            executor.submit(synthesize, api_key, model_key, clip, index, beat): (model_key, clip.name, index)
            for model_key, clip, index, beat in tasks
        }
        for future in concurrent.futures.as_completed(future_map):
            generated[future_map[future]] = future.result()

    outputs: list[tuple[Path, Path]] = []
    for model_key in MODELS:
        for clip_number, clip in enumerate(CLIPS, 1):
            sources = [generated[(model_key, clip.name, index)] for index in range(len(clip.beats))]
            outputs.append(render_clip(clip_number, clip, model_key, sources))

    cue_path = write_cue_sheet()
    notes_path = write_package_notes()
    validate(outputs)
    print(f"validated {len(outputs)} audio files and {len(outputs)} review videos", flush=True)
    print(f"wrote cue sheet to {cue_path.relative_to(ROOT)}", flush=True)
    print(f"wrote package notes to {notes_path.relative_to(ROOT)}", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
