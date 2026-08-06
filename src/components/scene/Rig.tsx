"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import Cart from "./Cart";
import Parcels from "./Parcels";
import RobotHand from "./RobotHand";
import { CART_CONTACT } from "./geometry/cart";
import { PRODUCTS } from "@/lib/products";
import { clamp01, damp, scroll, sectionProgress, smoothstep } from "@/lib/scroll";

type Stop = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
};

/**
 * Drives the whole scene off the scroll timeline.
 *
 * The cart moves between "stops" — one per section — and the position between
 * stops is a continuous number derived from how far each section has travelled
 * through the viewport. That means stop transitions stay correct no matter how
 * tall a section ends up being, which matters because the copy blocks reflow at
 * every breakpoint.
 */
export default function Rig() {
  const cart = useRef<THREE.Group>(null!);
  const hand = useRef<THREE.Group>(null!);
  const spark = useRef<THREE.PointLight>(null!);
  const { viewport, size, camera } = useThree();

  const compact = size.width < 900;

  const stops = useMemo<Stop[]>(() => {
    // Park the cart roughly a quarter of the way in from the edge, opposite the
    // copy. On narrow screens the copy stacks underneath, so stay centred.
    const offset = compact ? 0 : Math.min(viewport.width * 0.23, 3.1);
    // Sized so the forearm still has headroom above the handle before the top
    // of the frame crops it — that crop is the composition in the reference.
    const scale = compact ? 0.5 : 0.66;

    return [
      { x: 0, y: 0.1, z: 0, rotY: -0.26, scale: scale * 0.98 },
      ...PRODUCTS.map((p) => ({
        x: p.side === "right" ? -offset : offset,
        y: compact ? 0.85 : -0.1,
        z: 0.2,
        rotY: p.side === "right" ? -0.3 : -0.62,
        scale,
      })),
      // Outro: centred and pushed high, copy sits underneath it.
      { x: 0, y: compact ? 1.15 : 0.92, z: 1.1, rotY: -0.42, scale: scale * 1.08 },
    ];
  }, [compact, viewport.width]);

  // Smoothed rig values, so a flick of the wheel never snaps the cart.
  const state = useRef({ x: 0, y: 0, z: 0, rotY: 0, scale: 1, contact: 0, t: 0 });

  useFrame(({ clock }, dt) => {
    const time = clock.elapsedTime;

    // Continuous stop index: each section contributes 0→1 as it centres.
    let t = 0;
    for (const p of PRODUCTS) t += smoothstep(0.22, 0.6, sectionProgress(p.id));
    t += smoothstep(0.12, 0.55, sectionProgress("outro"));
    t = Math.min(t, stops.length - 1);

    const s = state.current;
    s.t = damp(s.t, t, 8, dt);

    const i = Math.min(stops.length - 1, Math.floor(s.t));
    const j = Math.min(stops.length - 1, i + 1);
    const f = smoothstep(0, 1, s.t - i);

    const a = stops[i];
    const b = stops[j];

    const lambda = scroll.reducedMotion ? 30 : 5;
    s.x = damp(s.x, THREE.MathUtils.lerp(a.x, b.x, f), lambda, dt);
    s.y = damp(s.y, THREE.MathUtils.lerp(a.y, b.y, f), lambda, dt);
    s.z = damp(s.z, THREE.MathUtils.lerp(a.z, b.z, f), lambda, dt);
    s.rotY = damp(s.rotY, THREE.MathUtils.lerp(a.rotY, b.rotY, f), lambda, dt);
    s.scale = damp(s.scale, THREE.MathUtils.lerp(a.scale, b.scale, f), lambda, dt);

    const float = scroll.reducedMotion ? 0 : 1;

    cart.current.position.set(
      s.x,
      s.y + Math.sin(time * 0.7) * 0.055 * float,
      s.z,
    );
    cart.current.rotation.set(
      Math.sin(time * 0.55) * 0.022 * float,
      s.rotY + Math.sin(time * 0.4) * 0.03 * float,
      // Leans into the direction of travel.
      THREE.MathUtils.clamp(-scroll.velocity * 0.00004, -0.08, 0.08),
    );
    cart.current.scale.setScalar(s.scale);

    // Hand: descends onto the handle during the hero, then stays with it.
    s.contact = damp(s.contact, scroll.contact, 6, dt);
    const c = s.contact;
    const settle = Math.sin(time * 1.1) * 0.02 * float * c;

    // The fingertip sits ~1.0 below the hand root, so that is the resting
    // offset; the extra lift is what the hero scroll closes.
    hand.current.position.set(
      CART_CONTACT.x + 0.17,
      CART_CONTACT.y + 1.0 + (1 - c) * 0.55 + settle,
      CART_CONTACT.z - 0.04,
    );
    hand.current.rotation.set(0.14 * c, -0.3, 0.16 - 0.12 * c);

    // The point of contact glows as the digitisation seed catches.
    const seed = clamp01(c) * (1 - smoothstep(0.35, 0.9, scroll.digitize));
    spark.current.intensity = seed * (5 + Math.sin(time * 9) * 2.2);

    // A whisper of camera parallax keeps the fixed canvas from feeling flat.
    camera.position.x = damp(camera.position.x, s.x * -0.06, 3, dt);
    camera.position.y = damp(
      camera.position.y,
      0.25 - scroll.progress * 0.5,
      3,
      dt,
    );
    camera.lookAt(0, -0.1, 0);
  });

  return (
    <group ref={cart}>
      <Cart />
      <Parcels />

      <group ref={hand}>
        <RobotHand curl={1} />
      </group>

      <pointLight
        ref={spark}
        position={CART_CONTACT}
        color="#63e0ff"
        distance={2.6}
        decay={2}
        intensity={0}
      />
    </group>
  );
}
