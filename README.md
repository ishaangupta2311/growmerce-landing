# Growmerce landing page

Scroll-driven landing page for growmerce.ai. A steel shopping trolley is touched
by a robot hand at the top of the page and progressively digitises into a blue,
pixelated form by the bottom — collecting one product into its basket for every
section you scroll past.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — tokens live in `@theme` inside `src/app/globals.css`
- **three.js** via **@react-three/fiber** + **@react-three/drei**
- **Lenis** for scroll smoothing, **zustand** for the small amount of discrete state

## How the scroll narrative works

Everything hangs off one source of truth: `src/lib/scroll.ts`.

`scroll` is a plain mutable object, not React state — the 3D scene reads it in
`useFrame` every frame, and pushing that through React would re-render the tree
60 times a second. Only genuinely discrete state (which products are in the cart,
which section is active) lives in the `useScene` zustand store, where a re-render
is cheap and correct.

| Piece | File | Responsibility |
| --- | --- | --- |
| `ScrollDriver` | `src/components/ScrollDriver.tsx` | Runs Lenis, writes `scroll` each frame, derives collected products, mirrors `--digitize` onto `:root` for CSS |
| `useSection(id)` | `src/lib/useSection.ts` | Registers a DOM section so it gets a 0→1 progress value |
| `Rig` | `src/components/scene/Rig.tsx` | Moves the trolley between per-section "stops" |
| `Cart` | `src/components/scene/Cart.tsx` | The trolley meshes + digitisation uniforms |
| `Parcels` | `src/components/scene/Parcels.tsx` | One parcel per product, arcs into the basket |

### Derived values

- **`scroll.contact`** — 0 while the hand hovers, 1 when the fingertip lands on the
  handle. Completes 45% of the way through the hero.
- **`scroll.digitize`** — 0 until contact, then ramps to 1 by the time the outro is
  in view. Drives both the shader and the page's cool-blue wash.
- **Stop index** — the trolley's position is a *continuous* number derived from how
  far each section has travelled through the viewport (`Σ smoothstep(sectionProgress)`).
  That keeps transitions correct no matter how tall a section reflows to, which
  matters because the copy blocks change height at every breakpoint.

### The digitisation shader

`src/components/scene/materials/digitize.ts` injects into a standard PBR material
rather than replacing it, so the steel half keeps real lighting and environment
reflections for free. A spherical front expands from the contact point; anything
behind it gets its vertices snapped to a voxel lattice, its albedo pushed to the
digital blue, its metalness dropped, and an emissive scanline added. A bright rim
rides the advancing front.

## Placeholders to replace

These are deliberate stand-ins so the page is complete and reviewable today:

1. **The trolley and hand are procedural**, not GLB assets
   (`src/components/scene/geometry/cart.ts`, `src/components/scene/RobotHand.tsx`).
   The trolley is built from tubes, which is what the shader wants — a mesh dense
   enough that voxel-snapping reads as pixelation instead of a mangled surface.
   To swap in a real model, keep `CART_CONTACT` and the material wiring in
   `Cart.tsx` and replace `buildCart()` with a loader.
2. **The logo mark** in `src/components/brand/Logo.tsx` is traced by eye from the
   brand sheet. Drop the official SVG in `public/brand/` and swap `<Mark />`.
3. **Products 2–4** in `src/lib/products.ts` are invented. Only "Voiceshop AI"
   comes from the approved design. Names, blurbs, `side` and `accent` are all
   free to edit — the scene reads the array, so adding or removing a product
   automatically adds or removes a stop on the timeline.
4. **Copy** throughout is a first pass, not signed off.

## Known next steps

- Bloom post-processing would make the digital rim glow considerably harder
  (`@react-three/postprocessing`); left out to avoid the bundle cost until the
  look is signed off.
- The decorative floating keyboard from the reference hero is not built yet.
- Mobile keeps the trolley centred and stacks copy beneath it; worth a design
  pass once the desktop composition is approved.
- `prefers-reduced-motion` disables Lenis smoothing and the idle float, but the
  scroll-driven transition itself still runs.
