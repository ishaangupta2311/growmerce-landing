"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import Cart from "./Cart";
import Parcels from "./Parcels";
import Robot, {
  ROBOT_BODY_HALF_DEPTH,
  ROBOT_GRIP_FRAC,
  ROBOT_HEIGHT,
} from "./Robot";
import RobotHand from "./RobotHand";
import { CART_CONTACT } from "./model";
import { PRODUCTS } from "@/lib/products";
import {
  clamp01,
  damp,
  scroll,
  sectionProgress,
  sectionRect,
  smoothstep,
} from "@/lib/scroll";

type Stop = {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
};

// Scratch vectors — allocated once, mutated per frame, never shared outside
// this module.
const _ndc = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _handle = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** How far the final push travels, in world units — enough to exit the frame. */
const PUSH_DIST = 11;

/** Handle height above the trolley's own ground plane, in trolley-local units. */
const HANDLE_RISE = CART_CONTACT.y + 1.25;

/**
 * Where the hero trolley's wheels sit, as a fraction of viewport height. The
 * copy lane starts at 52vh (see Hero.tsx), so the trolley — however tall it
 * renders — can never touch the type. Anchored in pixels and unprojected, not
 * tuned in world units, precisely because the two drifted apart before.
 */
const HERO_GROUND = 0.44;

/**
 * Drives the whole scene off the scroll timeline.
 *
 * The trolley moves between "stops" — one per section — and the position
 * between stops is a continuous number derived from how far each section has
 * travelled through the viewport, so transitions stay correct as copy reflows.
 * All motion is scroll-scrubbed: scrolling back plays every beat in reverse,
 * which also makes the whole thing interruptible by construction.
 *
 * Beats:
 *   1. hero — the trolley presents itself with a slow scroll-driven turn while
 *      the hand descends and taps the handle once, seeding the digitisation.
 *      The copy owns the lower half of the viewport; the trolley never
 *      crosses into it.
 *   2. products — the trolley parks opposite each copy block.
 *   3. outro — the trolley settles small in the lower right while the copy
 *      takes the stage, and the robot walks in to meet it.
 *   4. footer — the trolley grounds itself ON the footer's top border as it
 *      scrolls into view, and the robot pushes it out along that line, gait
 *      synced to the distance travelled.
 */
export default function Rig() {
  const cart = useRef<THREE.Group>(null!);
  const hand = useRef<THREE.Group>(null!);
  const robot = useRef<THREE.Group>(null!);
  const spark = useRef<THREE.PointLight>(null!);
  const { viewport, size } = useThree();

  const compact = size.width < 900;

  const stops = useMemo<Stop[]>(() => {
    // Park the trolley roughly a quarter of the way in from the edge, opposite
    // the copy. On narrow screens the copy stacks underneath, so stay centred.
    const offset = compact ? 0 : Math.min(viewport.width * 0.23, 3.1);

    return [
      // Hero: centred in the upper half. Y here is notional — the trolley is
      // pixel-anchored to HERO_GROUND, above the copy lane, each frame.
      { x: 0, y: 1.0, z: 0, rotY: -0.22, scale: compact ? 0.38 : 0.5 },
      ...PRODUCTS.map((p) => ({
        x: p.side === "right" ? -offset : offset,
        y: compact ? 0.9 : 0.38,
        z: 0.2,
        rotY: p.side === "right" ? -0.3 : -0.62,
        scale: compact ? 0.44 : 0.62,
      })),
      // Outro: small, lower right, clear of the centred copy — and far enough
      // right that the robot, which parks outboard of the handle, still lands
      // inside the frame. Near profile (rotY ≈ 0 puts the handle at +X), because
      // the trolley is about to roll left and a 3/4 view reads as drifting
      // sideways rather than being pushed. Its Y is notional: once the outro
      // takes over, the trolley grounds itself on the footer border instead.
      {
        x: compact ? 0.7 : 1.9,
        y: 0.5,
        z: 0.35,
        rotY: -0.16,
        scale: compact ? 0.28 : 0.34,
      },
    ];
  }, [compact, viewport.width]);

  // Smoothed rig values, so a flick of the wheel never snaps the trolley.
  const state = useRef({
    x: 0, y: 0, z: 0, rotY: 0, scale: 1, contact: 0, t: 0,
    travel: 0, walk: 0,
  });

  useFrame((frame, dt) => {
    const time = frame.clock.elapsedTime;
    // Read off the frame state rather than closing over useThree's camera —
    // the rig writes to it every tick, and that binding is meant to be read-only.
    const camera = frame.camera;

    const heroP = sectionProgress("hero");
    const outroP = sectionProgress("outro");
    const footerP = sectionProgress("footer");
    const outroT = smoothstep(0.12, 0.55, outroP);

    // Continuous stop index: each section contributes 0→1 as it centres.
    let t = 0;
    for (const p of PRODUCTS) t += smoothstep(0.22, 0.6, sectionProgress(p.id));
    t += outroT;
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

    /* ---- camera (first: the ground unprojection below needs it) -------- */

    camera.position.x = damp(camera.position.x, s.x * -0.06, 3, dt);
    camera.position.y = damp(camera.position.y, 0.25 - scroll.progress * 0.5, 3, dt);
    camera.lookAt(0, -0.1, 0);
    camera.updateMatrixWorld();

    /* ---- robot beats --------------------------------------------------- */

    // 1. Descent to the tap.
    s.contact = damp(s.contact, scroll.contact, 6, dt);
    const c = s.contact;
    // 2. Withdrawal, straight after the tap lands.
    const withdraw = smoothstep(0.5, 0.68, heroP);
    // 3. The robot walks in late in the outro, once the copy has landed. It has
    //    to be *in position* before the footer border arrives and the push
    //    starts, so this closes at 0.60 — at 0.85 the walk-in ran past the
    //    bottom of the document and the robot never actually reached the
    //    handle.
    const enter = smoothstep(0.30, 0.6, outroP);
    // 4. ...and the push is keyed to the FOOTER: it only happens once the
    //    footer's top border is on screen, and completes while it is. The
    //    0.09 lead-in is the beat where the trolley just stands on the border
    //    with the robot behind it; 0.28 leaves scroll to spare, because the
    //    border stops moving when the document bottoms out.
    const push = smoothstep(0.09, 0.28, footerP);

    /* ---- ground line ---------------------------------------------------
       The trolley's finale plays out on the footer's top border. Until the
       footer arrives, the ground is a line near the bottom of the viewport;
       once the border rises past it, the scene rides the border itself. */

    // Unprojects a viewport pixel row onto the trolley's z-plane. Pixel
    // anchoring is what guarantees the 3D layer and the DOM copy never fight:
    // both are positioned in the same coordinate system.
    const worldYAtPx = (px: number) => {
      _ndc.set(0, 1 - (2 * px) / size.height, 0.5).unproject(camera);
      _dir.copy(_ndc).sub(camera.position).normalize();
      const tPlane = (s.z - camera.position.z) / _dir.z;
      return camera.position.y + _dir.y * tPlane;
    };

    const footer = sectionRect("footer");
    let groundPx = size.height * 0.92;
    if (footer) {
      const footerTopPx = footer.top - scroll.y;
      groundPx = Math.min(groundPx, footerTopPx - 4);
    }
    // Floor the ground line well below the outro copy: the border keeps rising
    // after the trolley has left, and there is no reason to follow it up into
    // the type.
    groundPx = Math.max(groundPx, size.height * 0.62);
    const groundWorldY = worldYAtPx(groundPx);

    // The hero's own ground line, fixed above the copy lane.
    const heroGroundY = worldYAtPx(size.height * HERO_GROUND);
    // Full strength at the hero stop, gone by the first product stop.
    const heroAnchor = clamp01(1 - s.t * 2);

    /* ---- trolley -------------------------------------------------------- */

    // Wheels-on-ground Y for the grounded (outro/footer) staging.
    const groundedY = groundWorldY + 1.25 * s.scale;

    // Free-flowing Y between the pixel-anchored beats.
    const flowY = THREE.MathUtils.lerp(
      s.y + Math.sin(time * 0.7) * 0.02 * float,
      heroGroundY + 1.25 * s.scale,
      heroAnchor,
    );

    cart.current.position.set(
      // The push travels toward -X, the direction the handle faces.
      s.x - push * PUSH_DIST,
      THREE.MathUtils.lerp(flowY, groundedY, outroT),
      s.z,
    );
    // The hero reveal: a slow quarter-turn scrubbed by the first half of the
    // hero scroll — motion the user drives, not a loop that runs at them.
    const heroTwist = -0.28 * (1 - smoothstep(0, 0.5, heroP));
    cart.current.rotation.set(
      Math.sin(time * 0.55) * 0.01 * float * (1 - outroT),
      s.rotY + heroTwist + Math.sin(time * 0.25) * 0.03 * float * (1 - outroT),
      THREE.MathUtils.clamp(-scroll.velocity * 0.00004, -0.08, 0.08) - push * 0.04,
    );
    cart.current.scale.setScalar(s.scale);

    /* ---- hero hand ------------------------------------------------------ */

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

    /* ---- outro robot ----------------------------------------------------
       The robot is a sibling of the trolley, not a child of it. As a child it
       inherited the trolley's scale and heading, so it shrank with the trolley
       and got swung off its line every time the trolley turned — which is why
       it never appeared to touch anything. Here it is placed in world space,
       against the trolley's actual handle. */

    // Where the handle is, in the world: the contact point carried through the
    // trolley's own scale and heading.
    _handle
      .copy(CART_CONTACT)
      .multiplyScalar(s.scale)
      .applyAxisAngle(_up, cart.current.rotation.y)
      .add(cart.current.position);

    // Size the robot so its palms land on the handle. See Robot.tsx: the arms
    // hang at the sides, so the grip height is a fixed fraction of the body.
    const robotScale =
      (HANDLE_RISE * s.scale) / (ROBOT_HEIGHT * ROBOT_GRIP_FRAC);
    const bodyHeight = ROBOT_HEIGHT * robotScale;

    // Stand it back by half a torso, so the palms — which hang flush with the
    // chest — meet the handle rather than reaching through it.
    const standX = _handle.x + ROBOT_BODY_HALF_DEPTH * bodyHeight;
    // Walks in from just outside the right edge, whatever the viewport is.
    const offscreenX = viewport.width * 0.5 + bodyHeight;
    const robotX = THREE.MathUtils.lerp(offscreenX, standX, smoothstep(0, 1, enter));

    // A static mesh can't swing its legs, so the walk is a gait illusion:
    // footstep bob and lateral sway phased by DISTANCE TRAVELLED. Because
    // `standX` tracks the handle, the push distance is already folded in — the
    // robot stays glued to the trolley and the steps stay in lockstep.
    const travel = offscreenX - robotX;
    const stride = 0.55 * bodyHeight;
    const phase = (travel * Math.PI) / Math.max(stride, 1e-3);

    // Gait amplitude follows actual movement, so the robot stands still
    // cleanly between the walk-in and the push.
    const speed = Math.abs(travel - s.travel) / Math.max(dt, 1e-4);
    s.travel = travel;
    s.walk = damp(s.walk, clamp01(speed / 1.2), 6, dt);
    const gait = s.walk * float;

    robot.current.scale.setScalar(robotScale);
    robot.current.position.set(
      robotX,
      groundWorldY +
        Math.abs(Math.sin(phase)) * 0.03 * bodyHeight * gait +
        Math.sin(time * 1.3) * 0.008 * bodyHeight * float * enter * (1 - gait),
      _handle.z,
    );
    robot.current.rotation.set(
      // Lateral rock, one cycle per two footfalls — walking mechanics.
      Math.sin(phase) * 0.05 * gait,
      0,
      // Forward lean into the push, plus a small stride nod.
      0.04 * enter + 0.11 * push + Math.sin(phase * 2) * 0.012 * gait,
    );
    robot.current.visible = enter > 0.003;

    // The point of contact flares as the tap seeds the conversion.
    const seed = clamp01(c) * (1 - smoothstep(0.04, 0.3, scroll.digitize));
    spark.current.intensity = seed * (5 + Math.sin(time * 9) * 2.2);
  });

  return (
    <group>
      <group ref={cart}>
        <Cart />
        <Parcels />

        {/* Soft ground shadow, at the model's ground plane so it rides with the
            trolley — and, in the finale, along the footer border. It renders
            the whole scene, so the robot's feet land in it too. */}
        <ContactShadows
          position={[0, -1.245, 0]}
          scale={11}
          far={3.4}
          blur={2.6}
          opacity={0.42}
          resolution={512}
          color="#37322c"
        />

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

      {/* Deliberately NOT a child of the trolley: the robot has to keep its own
          scale and its own heading while the trolley turns and shrinks. */}
      <group ref={robot} visible={false}>
        <Robot />
      </group>
    </group>
  );
}
