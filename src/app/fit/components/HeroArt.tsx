import Image from "next/image";

/* Everything is placed as a percentage of the original 841×669 artboard, so the
   whole composition scales with its container and nothing drifts.
   `card` is the white panel drawn in CSS; `art` is the icon, which is allowed
   to spill past the card exactly as it does in the drawing — the shoe, the tag
   and the magnifier all break their frame. */
type Tile = {
  name: string;
  card: [number, number, number, number];
  art: [number, number, number, number];
  w: number;
  h: number;
};

const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;

const TILES: Tile[] = [
  { name: "laptop", card: [180, 49, 134, 128], art: [170, 48, 144, 129], w: 720, h: 645 },
  { name: "gift", card: [340, 147, 126, 122], art: [338, 145, 128, 124], w: 640, h: 620 },
  { name: "tshirt", card: [473, 23, 141, 136], art: [458, 23, 165, 136], w: 825, h: 680 },
  { name: "review", card: [669, 105, 147, 129], art: [665, 105, 152, 129], w: 760, h: 645 },
  { name: "tag", card: [179, 235, 132, 126], art: [176, 235, 139, 127], w: 695, h: 635 },
  { name: "truck", card: [22, 295, 131, 124], art: [22, 295, 131, 129], w: 655, h: 645 },
  { name: "search", card: [203, 430, 135, 130], art: [179, 430, 160, 130], w: 800, h: 650 },
];

const ART_W = 841;
const ART_H = 669;

/**
 * The hero drawing, reassembled.
 *
 * The Figma ships this as one flat 841px bitmap, which is smaller than the
 * space it has to fill — so it arrives soft on any retina screen and there is
 * no larger source to go back to. It is rebuilt here instead: the icons and the
 * figure are traced to vector, and the seven cards under them are CSS, which is
 * also the only way their soft shadows stay shadows rather than becoming grey
 * pixels. Nothing in it is resolution-bound any more.
 */
export default function HeroArt({ className }: { className?: string }) {
  return (
    <div
      className={`relative ${className ?? ""}`}
      style={{ aspectRatio: `${ART_W} / ${ART_H}` }}
      aria-hidden
    >
      {/* The dotted run that threads the cards together, behind all of them. */}
      <Image
        src="/img/fit/thread.svg"
        alt=""
        fill
        sizes="(min-width: 1024px) 44vw, 100vw"
        priority
      />

      {TILES.map((tile) => (
        <span
          key={`${tile.name}-card`}
          className="absolute rounded-[14%] bg-white shadow-[0_16px_38px_-16px_rgba(126,64,26,0.22)]"
          style={{
            left: pc(tile.card[0], ART_W),
            top: pc(tile.card[1], ART_H),
            width: pc(tile.card[2], ART_W),
            height: pc(tile.card[3], ART_H),
          }}
        />
      ))}

      {TILES.map((tile) => (
        <Image
          key={tile.name}
          src={`/img/fit/icon-${tile.name}.svg`}
          alt=""
          width={tile.w}
          height={tile.h}
          sizes="(min-width: 1024px) 90px, 18vw"
          className="absolute"
          style={{
            left: pc(tile.art[0], ART_W),
            top: pc(tile.art[1], ART_H),
            width: pc(tile.art[2], ART_W),
            height: pc(tile.art[3], ART_H),
          }}
          priority
        />
      ))}

      <Image
        src="/img/fit/figure.svg"
        alt=""
        width={1484}
        height={1744}
        sizes="(min-width: 1024px) 250px, 45vw"
        /* The trace carries an opaque white sheet under the figure — the layer
           its outlines are cut out of, so it cannot simply be deleted. Multiply
           makes that sheet disappear against the white page while leaving the
           ink and the skin alone, and it is why nothing behind her corner gets
           a hard rectangular edge. */
        className="absolute mix-blend-multiply"
        style={{
          left: pc(401, ART_W),
          top: pc(232, ART_H),
          width: pc(371, ART_W),
          height: pc(436, ART_H),
        }}
        priority
      />
    </div>
  );
}
