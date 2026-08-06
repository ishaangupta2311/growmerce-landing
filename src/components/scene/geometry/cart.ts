import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A shopping trolley built from tubes.
 *
 * Modelled procedurally on purpose: the reference art is a wire basket, and
 * real wire geometry is exactly what the digitisation shader needs — a mesh
 * dense enough that snapping vertices to a voxel lattice reads as pixelation
 * rather than as a mangled surface. It also means there is no asset to wait on.
 *
 * When a real GLB lands, keep `CART_CONTACT` and the material wiring in
 * `Cart.tsx` and swap `buildCart()` for a loader — nothing else needs to move.
 *
 * Axes: +X is the handle end, +Y is up, +Z is the cart's right-hand side.
 */

const UP = new THREE.Vector3(0, 1, 0);

const BASKET = {
  top: { y: 0.5, frontHalfZ: 0.46, backHalfZ: 0.63, frontX: -1.0, backX: 0.9 },
  bottom: { y: -0.3, frontHalfZ: 0.27, backHalfZ: 0.38, frontX: -0.68, backX: 0.72 },
};

const AXLE_Y = -1.12;
const FRONT_AXLE_X = -0.56;
const REAR_AXLE_X = 0.66;

/** Where the robot fingertip lands, and the origin of the digitisation front. */
export const CART_CONTACT = new THREE.Vector3(
  BASKET.top.backX + 0.34,
  BASKET.top.y + 0.46,
  0,
);

/** Distance to the far corner of the cart — normalises the digitisation front. */
export const CART_SPAN = 3.1;

const WIRE = 0.015;
const RING_POINTS = 56;
const VERTICAL_EVERY = 3;

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

/** A cylinder stretched between two points. */
function bar(a: THREE.Vector3, b: THREE.Vector3, radius = WIRE, radial = 5) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  if (length < 1e-5) return null;

  const geo = new THREE.CylinderGeometry(radius, radius, length, radial, 1, true);
  const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
  geo.applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      quat,
      new THREE.Vector3(1, 1, 1),
    ),
  );
  return geo;
}

function chain(points: THREE.Vector3[], radius: number, closed = false) {
  const out: THREE.BufferGeometry[] = [];
  const last = closed ? points.length : points.length - 1;
  for (let i = 0; i < last; i++) {
    const g = bar(points[i], points[(i + 1) % points.length], radius);
    if (g) out.push(g);
  }
  return out;
}

/** Walks a polygon, replacing each corner with a quadratic fillet. */
function roundedPolygon(corners: THREE.Vector3[], radius: number) {
  const pts: THREE.Vector3[] = [];
  const n = corners.length;
  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const cur = corners[i];
    const next = corners[(i + 1) % n];

    const inDir = new THREE.Vector3().subVectors(cur, prev).normalize();
    const outDir = new THREE.Vector3().subVectors(next, cur).normalize();

    const a = cur.clone().addScaledVector(inDir, -radius);
    const b = cur.clone().addScaledVector(outDir, radius);

    pts.push(...new THREE.QuadraticBezierCurve3(a, cur, b).getPoints(5));
  }
  return pts;
}

/** Evenly redistributes points around a closed loop by arc length. */
function resampleClosed(points: THREE.Vector3[], count: number) {
  const n = points.length;
  const cum = [0];
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += points[i % n].distanceTo(points[i - 1]);
    cum.push(total);
  }

  const out: THREE.Vector3[] = [];
  let seg = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * total;
    while (seg < n - 1 && cum[seg + 1] < target) seg++;
    const span = cum[seg + 1] - cum[seg] || 1;
    const t = (target - cum[seg]) / span;
    out.push(points[seg].clone().lerp(points[(seg + 1) % n], t));
  }
  return out;
}

type RingSpec = {
  y: number;
  frontHalfZ: number;
  backHalfZ: number;
  frontX: number;
  backX: number;
};

/** The basket cross-section: a trapezoid, wider at the handle end so carts nest. */
function ring(spec: RingSpec, count = RING_POINTS) {
  const corners = [
    new THREE.Vector3(spec.frontX, spec.y, -spec.frontHalfZ),
    new THREE.Vector3(spec.backX, spec.y, -spec.backHalfZ),
    new THREE.Vector3(spec.backX, spec.y, spec.backHalfZ),
    new THREE.Vector3(spec.frontX, spec.y, spec.frontHalfZ),
  ];
  return resampleClosed(roundedPolygon(corners, 0.14), count);
}

const mixRing = (t: number): RingSpec => ({
  y: THREE.MathUtils.lerp(BASKET.top.y, BASKET.bottom.y, t),
  frontHalfZ: THREE.MathUtils.lerp(BASKET.top.frontHalfZ, BASKET.bottom.frontHalfZ, t),
  backHalfZ: THREE.MathUtils.lerp(BASKET.top.backHalfZ, BASKET.bottom.backHalfZ, t),
  frontX: THREE.MathUtils.lerp(BASKET.top.frontX, BASKET.bottom.frontX, t),
  backX: THREE.MathUtils.lerp(BASKET.top.backX, BASKET.bottom.backX, t),
});

/* ------------------------------------------------------------------ */
/* assemblies                                                          */
/* ------------------------------------------------------------------ */

function basket() {
  const parts: THREE.BufferGeometry[] = [];

  // Horizontal hoops. The top rail is thicker, as on a real trolley.
  const heights = [0, 0.3, 0.62, 1];
  const rings = heights.map((t) => ring(mixRing(t)));
  rings.forEach((pts, i) => {
    parts.push(...chain(pts, i === 0 ? WIRE * 2 : WIRE, true));
  });

  // Vertical wires tying the top hoop to the bottom one.
  const top = rings[0];
  const bottom = rings[rings.length - 1];
  for (let i = 0; i < top.length; i += VERTICAL_EVERY) {
    const g = bar(top[i], bottom[i], WIRE * 0.85);
    if (g) parts.push(g);
  }

  // Floor grid, inset just enough to sit inside the bottom hoop.
  const b = mixRing(1);
  const halfZAt = (x: number) => {
    const t = THREE.MathUtils.inverseLerp(b.frontX, b.backX, x);
    return THREE.MathUtils.lerp(b.frontHalfZ, b.backHalfZ, t) - 0.03;
  };
  for (let i = 1; i < 12; i++) {
    const x = THREE.MathUtils.lerp(b.frontX, b.backX, i / 12);
    const hz = halfZAt(x);
    const g = bar(
      new THREE.Vector3(x, b.y, -hz),
      new THREE.Vector3(x, b.y, hz),
      WIRE * 0.8,
    );
    if (g) parts.push(g);
  }
  for (let i = 1; i < 4; i++) {
    const z = THREE.MathUtils.lerp(-b.backHalfZ, b.backHalfZ, i / 4);
    // Clip the longitudinal bars to the trapezoid.
    let x0 = b.frontX;
    while (x0 < b.backX && halfZAt(x0) < Math.abs(z)) x0 += 0.02;
    const g = bar(
      new THREE.Vector3(x0, b.y, z),
      new THREE.Vector3(b.backX, b.y, z),
      WIRE * 0.8,
    );
    if (g) parts.push(g);
  }

  return parts;
}

function handle() {
  const { backX, backHalfZ, y } = BASKET.top;
  const gx = CART_CONTACT.x;
  const gy = CART_CONTACT.y;

  // A single bent bar: up off each rear corner at ~45°, then a straight grip.
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(backX - 0.02, y - 0.04, -backHalfZ + 0.03),
      new THREE.Vector3(backX + 0.2, y + 0.24, -backHalfZ + 0.02),
      new THREE.Vector3(gx, gy, -backHalfZ + 0.04),
      new THREE.Vector3(gx, gy, 0),
      new THREE.Vector3(gx, gy, backHalfZ - 0.04),
      new THREE.Vector3(backX + 0.2, y + 0.24, backHalfZ - 0.02),
      new THREE.Vector3(backX - 0.02, y - 0.04, backHalfZ - 0.03),
    ],
    false,
    "catmullrom",
    0.4,
  );

  return [new THREE.TubeGeometry(curve, 80, WIRE * 2.2, 8, false)];
}

function undercarriage() {
  const parts: THREE.BufferGeometry[] = [];
  const b = mixRing(1);

  for (const side of [-1, 1]) {
    const zBack = side * (b.backHalfZ - 0.03);
    const zFront = side * (b.frontHalfZ - 0.02);

    // Front leg: basket front corner down to the front axle.
    const front = bar(
      new THREE.Vector3(b.frontX + 0.05, b.y + 0.01, zFront),
      new THREE.Vector3(FRONT_AXLE_X, AXLE_Y, zFront),
      WIRE * 1.5,
    );
    if (front) parts.push(front);

    // Rear leg: basket back corner down to the rear axle.
    const rear = bar(
      new THREE.Vector3(b.backX - 0.03, b.y + 0.01, zBack),
      new THREE.Vector3(REAR_AXLE_X, AXLE_Y, zBack * 0.86),
      WIRE * 1.5,
    );
    if (rear) parts.push(rear);

    // Chassis rail joining the two axles.
    const rail = bar(
      new THREE.Vector3(FRONT_AXLE_X, AXLE_Y, zFront),
      new THREE.Vector3(REAR_AXLE_X, AXLE_Y, zBack * 0.86),
      WIRE * 1.5,
    );
    if (rail) parts.push(rail);
  }

  // Lower rack slung between the rails.
  for (let i = 0; i <= 7; i++) {
    const x = THREE.MathUtils.lerp(FRONT_AXLE_X + 0.04, REAR_AXLE_X - 0.04, i / 7);
    const hz = THREE.MathUtils.lerp(b.frontHalfZ - 0.02, b.backHalfZ * 0.86, i / 7);
    const g = bar(
      new THREE.Vector3(x, AXLE_Y + 0.03, -hz),
      new THREE.Vector3(x, AXLE_Y + 0.03, hz),
      WIRE * 0.7,
    );
    if (g) parts.push(g);
  }

  // Axle stubs.
  for (const [x, hz] of [
    [FRONT_AXLE_X, b.frontHalfZ - 0.02],
    [REAR_AXLE_X, b.backHalfZ * 0.86],
  ]) {
    const g = bar(
      new THREE.Vector3(x, AXLE_Y, -hz - 0.05),
      new THREE.Vector3(x, AXLE_Y, hz + 0.05),
      WIRE * 1.1,
    );
    if (g) parts.push(g);
  }

  return parts;
}

/* ------------------------------------------------------------------ */
/* public                                                              */
/* ------------------------------------------------------------------ */

export type CartGeometry = {
  frame: THREE.BufferGeometry;
  wheels: THREE.BufferGeometry;
};

let cached: CartGeometry | null = null;

export function buildCart(): CartGeometry {
  if (cached) return cached;

  const frame = mergeGeometries(
    [...basket(), ...handle(), ...undercarriage()],
    false,
  )!;
  frame.computeVertexNormals();

  // Four castors. Modelled separately so they keep their red under the shader.
  const wheelParts: THREE.BufferGeometry[] = [];
  const b = mixRing(1);
  const axles: [number, number][] = [
    [FRONT_AXLE_X, b.frontHalfZ + 0.03],
    [REAR_AXLE_X, b.backHalfZ * 0.86 + 0.03],
  ];
  for (const [x, hz] of axles) {
    for (const side of [-1, 1]) {
      const z = side * hz;
      const tyre = new THREE.TorusGeometry(0.062, 0.03, 8, 16);
      tyre.rotateY(Math.PI / 2);
      tyre.translate(x, AXLE_Y, z);
      wheelParts.push(tyre);

      const hub = new THREE.CylinderGeometry(0.034, 0.034, 0.05, 10);
      hub.rotateZ(Math.PI / 2);
      hub.translate(x, AXLE_Y, z);
      wheelParts.push(hub);
    }
  }
  const wheels = mergeGeometries(wheelParts, false)!;
  wheels.computeVertexNormals();

  cached = { frame, wheels };
  return cached;
}
