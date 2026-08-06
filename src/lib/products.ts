export type Product = {
  id: string;
  /** Eyebrow pill copy, e.g. "Product 1". */
  label: string;
  name: string;
  blurb: string;
  /** Which side the copy sits on; the cart takes the opposite side. */
  side: "left" | "right";
  /** Colour of the 3D parcel that drops into the cart for this section. */
  accent: string;
};

/**
 * Placeholder catalogue. Only "Voiceshop AI" comes from the approved design —
 * the rest are stand-ins so the scroll timeline has real content to drive.
 * Swap names/blurbs freely; the scene reads `side` and `accent` per entry.
 */
export const PRODUCTS: Product[] = [
  {
    id: "voiceshop",
    label: "Product 1",
    name: "Voiceshop AI",
    blurb:
      "Shopping, simplified to a sentence. Describe what you need in your own words, and Voiceshop AI matches you with real, in-stock products — no filters, no dropdowns, no guesswork.",
    side: "right",
    accent: "#ef6c25",
  },
  {
    id: "ranklift",
    label: "Product 2",
    name: "Ranklift AI",
    blurb:
      "Your catalogue, rewritten to be found. Ranklift generates and tests product copy against live search demand, so every listing earns its place on the first page.",
    side: "left",
    accent: "#f2a03d",
  },
  {
    id: "restock",
    label: "Product 3",
    name: "Restock IQ",
    blurb:
      "Never guess a reorder again. Restock IQ reads velocity, seasonality and supplier lead times to tell you exactly what to buy, how much, and when.",
    side: "right",
    accent: "#3fa9f5",
  },
  {
    id: "copilot",
    label: "Product 4",
    name: "Convert Copilot",
    blurb:
      "A merchandiser that never sleeps. Convert Copilot reshapes bundles, pricing and placement per visitor, then proves the lift with clean experiment data.",
    side: "left",
    accent: "#1657ff",
  },
];
