import Image from "next/image";

/**
 * A product mock, cropped for phones.
 *
 * These are screenshots of a desktop UI. At the width of a phone column the
 * whole 1386px frame renders at about a quarter of its natural size, which
 * puts the product names and prices under four pixels — the picture stops
 * being a picture of anything. A desktop reader sees the same file at roughly
 * 45%, so the crop below is chosen to land a phone in the same place: keep a
 * little over half the width, centred on the part of the mock that carries
 * the point, and let the rest go.
 *
 * The crop lives in CSS custom properties rather than a second `<img>`, so the
 * browser fetches one file: `--crop-*` come in from the call site and the
 * stylesheet resets them to the identity crop at sm, where the column is wide
 * enough to show the frame whole.
 */

/** Fractions of the source. Measured per mock — they are not one template. */
type Crop = { x: number; y: number; w: number; h: number };

const GRID_3_COL: Crop = { x: 0.407, y: 0.141, w: 0.541, h: 0.767 };
const GRID_2_COL: Crop = { x: 0.469, y: 0.132, w: 0.469, h: 0.784 };
/* The panels are the same frame without the search bar above it. */
const PANEL_3_COL: Crop = { x: 0.407, y: 0.023, w: 0.541, h: 0.955 };
const PANEL_2_COL: Crop = { x: 0.469, y: 0.02, w: 0.469, h: 0.96 };
/* Suggestion mocks: the chips are the queries, so they carry the idea the
   search bar would have. Starting below the bar avoids slicing it in half. */
/* 0.557 lands the right edge on a product-card boundary rather than
   through one. */
const SUGGESTIONS: Crop = { x: 0.036, y: 0.205, w: 0.557, h: 0.775 };

const CROPS: Record<string, Crop> = {
  "/img/demos/rainy-commute.webp": GRID_3_COL,
  "/img/demos/kava-drinks.webp": GRID_3_COL,
  "/img/demos/linen-shirt.webp": GRID_3_COL,
  "/img/demos/gifts.webp": GRID_2_COL,
  "/img/demos/rainy-commute-panel.webp": PANEL_3_COL,
  "/img/demos/kava-drinks-panel.webp": PANEL_3_COL,
  "/img/demos/linen-shirt-panel.webp": PANEL_3_COL,
  "/img/demos/gifts-panel.webp": PANEL_2_COL,
  "/img/demos/beauty-suggestions.webp": SUGGESTIONS,
  "/img/demos/tech-suggestions.webp": SUGGESTIONS,
};

export default function DemoShot({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  /** Goes on the frame, which is what the layout sees. */
  className?: string;
  priority?: boolean;
}) {
  const crop = CROPS[src];

  if (!crop) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`h-auto w-full ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`demo-shot ${className ?? ""}`}
      style={
        {
          "--sw": width,
          "--sh": height,
          "--crop-x": crop.x,
          "--crop-y": crop.y,
          "--crop-w": crop.w,
          "--crop-h": crop.h,
        } as React.CSSProperties
      }
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        /* The cropped frame lays the image over it at 1/crop.w of its own
           width — wider than the viewport. Without saying so the browser
           picks a phone-sized candidate and the crop displays it upscaled,
           which costs back the sharpness the crop was for. */
        sizes={`(max-width: 639px) ${Math.round(95 / crop.w)}vw, ${sizes}`}
        priority={priority}
      />
    </div>
  );
}
