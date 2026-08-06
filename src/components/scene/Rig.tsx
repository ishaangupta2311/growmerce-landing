"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import Cart from "./Cart";
import Parcels from "./Parcels";
import Robot from "./Robot";
import RobotHand from "./RobotHand";
import { CART_CONTACT } from "./model";
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
 * The trolley moves between "stops" — one per section — and the position
 * between stops is a continuous number derived from how far each section has
 * travelled through the viewport, so transitions stay correct as copy reflows.
 *
 * The trolley is GROUNDED: it sits on a contact shadow rather than floating,
 * and its idle motion is a couple of centimetres of settle, not a hover. The
 * reference art is a product photographed on a desk, and floating was one of
 * the bigger tells against it.
 *
 * The robot appears twice:
 *   1. hero — hand and forearm only, reaching down from the top of frame to
 *      tap the handle once, then withdrawing. Mirrors the reference's human
 *      hand reaching into the product shot.
 *   2. outro — the ENTIRE robot glides in from the right, takes the handle
 *      with both hands, and pushes the finished hologram out of frame.
 */
export default function Rig() {
  const cart = useRef<THREE.Group>(null!);
  const hand = useRef<THREE.Group>(null!);
  const robot = useRef<THREE.Group>(null!);
  const spark = useRef<THREE.PointLight>(null!);
  const { viewport, size } = useThree();

  const compact = size.width < 900;

  // Where the robot stands, in cart-group space. The Neo model's arms hang at
  // its sides with hands at thigh height — which lands at the handle bar once
  // scaled — so it stands close enough that its front nearly touches the
  // handle and the hands overlap the grip.
  const ROBOT_STAND_X = 1.28;

  const stops = useMemo<Stop[]>(() => {
    // Park the trolley roughly a quarter of the way in from the edge, opposite
    // the copy. On narrow screens the copy stacks underneath, so stay centred.
    const offset = compact ? 0 : Math.min(viewport.width * 0.23, 3.1);

    return [
      // Hero: big and centred, the product-shot framing of the reference —
      // raised so the whole trolley sits above the pinned copy block.
      { x: 0, y: compact ? 1.45 : 1.18, z: 0, rotY: -0.3, scale: compact ? 0.52 : 0.84 },
      ...PRODUCTS.map((p) => ({
        x: p.side === "right" ? -offset : offset,
        y: compact ? 0.9 : 0.38,
        z: 0.2,
        rotY: p.side === "right" ? -0.3 : -0.62,
        scale: compact ? 0.5 : 0.62,
      })),
      // Outro: cart left of centre and smaller, so the robot — which stands on
      // the handle side — lands centre-right, fully in frame, above the copy.
      { x: compact ? -0.4 : -0.85, y: compact ? 1.4 : 1.3, z: 0.5, rotY: -0.45, scale: compact ? 0.44 : 0.5 },
    ];
  }, [compact, viewport.width]);

  // Smoothed rig values, so a flick of the wheel never snaps the trolley.
  const state = useRef({ x: 0, y: 0, z: 0, rotY: 0, scale: 1, contact: 0, t: 0 });

  useFrame((frame, dt) => {
    const time = frame.clock.elapsedTime;
    // Read off the frame state rather than closing over useThree's camera —
    // the rig writes to it every tick, and that binding is meant to be read-only.
    const camera = frame.camera;

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

    /* ---- robot beats ------------------------------------------------- */

    const heroP = sectionProgress("hero");
    const outroP = sectionProgress("outro");

    // 1. Descent to the tap.
    s.contact = damp(s.contact, scroll.contact, 6, dt);
    const c = s.contact;
    // 2. Withdrawal, straight after the tap lands.
    const withdraw = smoothstep(0.5, 0.68, heroP);
    // 3. The whole robot enters at the CTA...
    const enter = smoothstep(0.16, 0.46, outroP);
    // ...then shoves the trolley out of frame.
    const push = smoothstep(0.52, 0.86, outroP);

    /* ---- trolley ------------------------------------------------------ */

    cart.current.position.set(
      // The push travels toward -X, the direction the handle faces.
      s.x - push * 16,
      // A couple of centimetres of settle — grounded, not hovering.
      s.y + Math.sin(time * 0.7) * 0.02 * float,
      s.z,
    );
    cart.current.rotation.set(
      Math.sin(time * 0.55) * 0.01 * float,
      s.rotY + Math.sin(time * 0.4) * 0.015 * float,
      THREE.MathUtils.clamp(-scroll.velocity * 0.00004, -0.08, 0.08) - push * 0.05,
    );
    cart.current.scale.setScalar(s.scale);

    /* ---- hero hand ---------------------------------------------------- */

    const settle = Math.sin(time * 1.1) * 0.02 * float * c;
    hand.current.position.set(
      CART_CONTACT.x + 0.17,
      CART_CONTACT.y + 1.0 + (1 - c) * 0.55 + withdraw * 5 + settle,
      CART_CONTACT.z - 0.04,
    );
    hand.current.rotation.set(0.14 * c, -0.3, 0.16 - 0.12 * c);
    // In frame from the first paint, hovering above the handle — the reference
    // has the hand in the opening shot. It only leaves after the tap.
    hand.current.visible = withdraw < 0.995;

    /* ---- outro robot --------------------------------------------------- */

    robot.current.position.set(
      THREE.MathUtils.lerp(9.5, ROBOT_STAND_X, smoothstep(0, 1, enter)),
      -1.25 + Math.sin(time * 1.3) * 0.02 * float * enter,
      0.12,
    );
    // rotZ tips the top toward -X: a glide-in lean, then a harder push lean.
    robot.current.rotation.set(0, 0, 0.05 * enter + 0.1 * push);
    robot.current.visible = enter > 0.003;

    // The point of contact flares as the tap seeds the conversion.
    const seed = clamp01(c) * (1 - smoothstep(0.04, 0.3, scroll.digitize));
    spark.current.intensity = seed * (5 + Math.sin(time * 9) * 2.2);

    /* ---- camera ------------------------------------------------------- */

    // A whisper of camera parallax keeps the fixed canvas from feeling flat.
    camera.position.x = damp(camera.position.x, s.x * -0.06, 3, dt);
    camera.position.y = damp(camera.position.y, 0.25 - scroll.progress * 0.5, 3, dt);
    camera.lookAt(0, -0.1, 0);
  });

  return (
    <group ref={cart}>
      <Cart />
      <Parcels />

      {/* Soft ground shadow, at the model's ground plane so it rides with the
          trolley. Grounding the object on a lit surface is most of the gap
          between "3D asset floating on a gradient" and "product photograph". */}
      <ContactShadows
        position={[0, -1.245, 0]}
        scale={9}
        far={3.4}
        blur={2.6}
        opacity={0.42}
        resolution={512}
        color="#37322c"
      />

      <group ref={hand}>
        <RobotHand curl={1} />
      </group>

      <group ref={robot} visible={false}>
        <Robot />
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
