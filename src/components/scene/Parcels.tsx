"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { PRODUCTS } from "@/lib/products";
import { clamp01, damp, scroll, smoothstep, useScene } from "@/lib/scroll";

/**
 * One parcel per product. Each flies in along an arc and settles into a slot in
 * the basket once its section has been scrolled past, and flies back out if the
 * user scrolls up again — the cart is always an honest read of how far down the
 * page you are.
 *
 * Rendered as a child of the cart group so parcels ride with the trolley.
 */

/** Resting places inside the basket, roughly stacked. */
const SLOTS: [number, number, number][] = [
  [-0.4, -0.06, -0.18],
  [0.14, -0.04, 0.2],
  [-0.24, 0.16, 0.16],
  [0.46, 0.14, -0.16],
];

const SIZES: [number, number, number][] = [
  [0.42, 0.3, 0.34],
  [0.36, 0.36, 0.28],
  [0.46, 0.26, 0.3],
  [0.32, 0.34, 0.32],
];

const TILT: [number, number, number][] = [
  [0.06, 0.4, -0.08],
  [-0.05, -0.3, 0.1],
  [0.1, 0.75, 0.04],
  [-0.08, -0.6, -0.06],
];

function Parcel({ index }: { index: number }) {
  const product = PRODUCTS[index];
  const group = useRef<THREE.Group>(null!);
  const progress = useRef(0);

  const material = useMemo(
    () =>
      // Soft matte card stock with a light sheen, so parcels read as objects
      // next to the chrome rather than as flat blocks of colour.
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(product.accent),
        roughness: 0.62,
        metalness: 0.02,
        clearcoat: 0.35,
        clearcoatRoughness: 0.45,
        envMapIntensity: 0.9,
      }),
    [product.accent],
  );

  const path = useMemo(() => {
    const slot = new THREE.Vector3(...SLOTS[index % SLOTS.length]);
    // Parcels enter from the side the copy sits on, so they read as coming
    // out of the section you just finished.
    const from = new THREE.Vector3(product.side === "right" ? 3.6 : -3.6, 2.9, 1.4);
    const apex = new THREE.Vector3(
      (from.x + slot.x) * 0.5,
      Math.max(from.y, slot.y) + 0.5,
      (from.z + slot.z) * 0.5,
    );
    return { from, apex, slot };
  }, [index, product.side]);

  const base = new THREE.Color(product.accent);
  const digital = new THREE.Color("#2440b8");

  useFrame((state, dt) => {
    const collected = useScene.getState().collected.includes(product.id);
    progress.current = damp(progress.current, collected ? 1 : 0, 6, dt);

    const p = progress.current;
    const eased = smoothstep(0, 1, p);

    // Quadratic bezier from the entry point into the basket.
    const inv = 1 - eased;
    const pos = group.current.position;
    pos.set(
      inv * inv * path.from.x + 2 * inv * eased * path.apex.x + eased * eased * path.slot.x,
      inv * inv * path.from.y + 2 * inv * eased * path.apex.y + eased * eased * path.slot.y,
      inv * inv * path.from.z + 2 * inv * eased * path.apex.z + eased * eased * path.slot.z,
    );

    const settle = smoothstep(0.55, 1, p);
    group.current.rotation.set(
      THREE.MathUtils.lerp(TILT[index % 4][0] - 1.2, TILT[index % 4][0], settle),
      THREE.MathUtils.lerp(TILT[index % 4][1] - 2.4, TILT[index % 4][1], settle),
      THREE.MathUtils.lerp(TILT[index % 4][2] + 0.9, TILT[index % 4][2], settle),
    );

    const s = clamp01(p * 1.6);
    group.current.scale.setScalar(s);
    group.current.visible = s > 0.01;

    // Parcels pick up the digital tint alongside the cart.
    material.color.copy(base).lerp(digital, scroll.digitize * 0.85);
    material.emissive
      .copy(digital)
      .multiplyScalar(scroll.digitize * 0.35 * (0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 2 + index)));
  });

  return (
    <group ref={group}>
      <RoundedBox
        args={SIZES[index % SIZES.length]}
        radius={0.045}
        smoothness={3}
        material={material}
      />
    </group>
  );
}

export default function Parcels() {
  return (
    <group>
      {PRODUCTS.map((p, i) => (
        <Parcel key={p.id} index={i} />
      ))}
    </group>
  );
}
