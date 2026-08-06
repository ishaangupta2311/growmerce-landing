"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { buildCart, CART_CONTACT, CART_SPAN } from "./geometry/cart";
import { createDigitizeMaterial } from "./materials/digitize";
import { damp, scroll } from "@/lib/scroll";

/**
 * The trolley. Steel frame and red castors, both wired to the same digitisation
 * front so the transition sweeps across the whole object as one.
 */
export default function Cart() {
  const { frame, wheels } = useMemo(() => buildCart(), []);

  const materials = useMemo(() => {
    const shared = { origin: CART_CONTACT, maxDist: CART_SPAN };
    return {
      // Near-mirror chrome. Polished metal is almost entirely reflection, so
      // the look here is carried by the environment in SceneCanvas, not by the
      // base colour — a grey albedo with mid roughness is what reads as plastic.
      steel: createDigitizeMaterial({
        ...shared,
        color: "#c8cdd6",
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 1.5,
      }),
      rubber: createDigitizeMaterial({
        ...shared,
        color: "#bf3a24",
        metalness: 0.05,
        roughness: 0.48,
        clearcoat: 0.5,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.1,
      }),
    };
  }, []);

  // Damped locally so the transition keeps easing after the scroll stops.
  const current = useRef(0);

  useFrame((state, dt) => {
    current.current = damp(current.current, scroll.digitize, 5.5, dt);
    for (const m of [materials.steel, materials.rubber]) {
      const u = m.userData.uniforms;
      u.uDigitize.value = current.current;
      u.uTime.value = state.clock.elapsedTime;
    }
  });

  useEffect(
    () => () => {
      materials.steel.dispose();
      materials.rubber.dispose();
    },
    [materials],
  );

  return (
    <group>
      <mesh geometry={frame} material={materials.steel} castShadow />
      <mesh geometry={wheels} material={materials.rubber} castShadow />
    </group>
  );
}
