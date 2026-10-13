import Image from "next/image";

export type Tile = { name: string; price: string; img: string };

/**
 * Three products across, drawn for a phone.
 *
 * The demos on this page are screenshots of a desktop storefront. On a phone
 * they are either a thumbnail nobody can read or a crop that slices through
 * its own cards, so below sm the page draws the result itself: these are the
 * products out of those screenshots, cut out one by one into
 * public/img/demos/tiles, with the name and price set as real text.
 *
 * Decorative wherever it is used: the caller owns the accessible description.
 */
export default function ProductTiles({ tiles, className }: { tiles: Tile[]; className?: string }) {
  return (
    <ul className={`grid grid-cols-3 gap-2 ${className ?? ""}`}>
      {tiles.map((tile) => (
        <li key={tile.img} className="overflow-hidden rounded-[14px] border border-line bg-white">
          <Image
            src={`/img/demos/tiles/${tile.img}.webp`}
            alt=""
            width={200}
            height={200}
            sizes="30vw"
            className="aspect-square w-full object-cover"
          />
          <span className="block px-2 pt-1.5 text-[12px] leading-tight font-semibold text-charcoal">
            {tile.name}
          </span>
          <span className="block px-2 pt-0.5 pb-2 font-poppins text-[12px] font-bold text-brand">
            {tile.price}
          </span>
        </li>
      ))}
    </ul>
  );
}
