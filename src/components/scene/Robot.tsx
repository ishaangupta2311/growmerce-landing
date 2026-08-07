"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { firstMesh } from "./model";
import { damp, scroll } from "@/lib/scroll";

/**
 * The full robot for the outro: it glides in from the right, meets the trolley
 * at the handle, and pushes it out of frame.
 *
 * The asset is the supplied "Neo" humanoid (a Meshy export), optimised from
 * 253k to ~114k triangles — see README for the pipeline. The export is
 * position-only: no normals, no UVs, no materials. Normals are computed at
 * load, and the shell material is ours — matte white with the studio
 * environment doing the work, matching the hero hand's design language.
 *
 * Measured from the vertex data: 1.904 units tall, centred at the origin with
 * feet at y = -0.952, facing +Z (the toes point that way), standing with the
 * arms hanging at the sides.
 *
 * That last part is the whole difficulty of the outro. A standing model can't
 * reach forward, so the only way to put its palms on the trolley handle is to
 * scale it until they happen to line up — which makes the robot taller than a
 * human would be beside a trolley. That exaggeration is deliberate and matches
 * the hero, where an oversized hand descends on the cart. Correct proportions
 * *and* contact would need a rigged export posed with the arms forward.
 */

export const ROBOT_URL = "/models/robot.glb";

/** Model faces +Z; the rig has it pushing toward -X. */
const FACE_MINUS_X = -Math.PI / 2;
/** The model's feet sit at y = -0.952 in its own space. */
const FOOT_LIFT = 0.952;

/* ---------------------------------------------------------------------------
   Measured from the source GLB's vertex data (see README). The rig needs these
   to size and place the robot against the trolley handle, and guessing them is
   exactly how you end up with a robot that pushes thin air.
--------------------------------------------------------------------------- */

/** Overall height of the model, feet to crown. */
export const ROBOT_HEIGHT = 1.904;

/**
 * Height of the palm centre as a fraction of body height.
 *
 * The arms are baked hanging at the sides, so the hands rest low — 0.40 of the
 * way up, with the fingertips at 0.38. Isolated by taking every vertex
 * outboard of the legs (|x| > 0.205) and averaging the lowest 10cm of that set.
 *
 * The rig scales the robot so this lands exactly on the trolley handle, which
 * is what makes the push read as contact rather than mime.
 */
export const ROBOT_GRIP_FRAC = 0.4045;

/**
 * Half the torso's depth, in body-heights. The hands hang flush with the chest
 * rather than reaching forward, so the body has to sit back by this much for
 * the palms to meet the handle instead of the basket.
 */
export const ROBOT_BODY_HALF_DEPTH = 0.095;

export default function Robot() {
  const gltf = useGLTF(ROBOT_URL);
  const shell = useRef<THREE.Mesh>(null!);

  const { geometry, material } = useMemo(() => {
    const mesh = firstMesh(gltf.scene);
    if (!mesh) throw new Error(`No mesh found in ${ROBOT_URL}`);

    const geometry = mesh.geometry;
    // Meshy ships no NORMAL attribute; without this the robot renders flat.
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();

    // Light grey rather than white: against the paper-white page a white shell
    // washes out completely. The grey plus a touch of metalness lets the studio
    // strips draw its silhouette.
    const material = new THREE.MeshStandardMaterial({
      color: "#c9cfd8",
      roughness: 0.28,
      metalness: 0.22,
      envMapIntensity: 1.35,
    });

    return { geometry, material };
  }, [gltf]);

  useEffect(() => () => material.dispose(), [material]);

  // The digitised trolley casts blue light; let the robot's white shell pick a
  // whisper of it up as the two meet, so they read as being in the same room.
  useFrame((frame, dt) => {
    const node = shell.current;
    if (!node) return;
    const tint = damp(node.userData.tint ?? 0, scroll.digitize, 4, dt);
    node.userData.tint = tint;
    (node.material as THREE.MeshStandardMaterial).emissive.setRGB(
      0.005 * tint,
      0.012 * tint,
      0.035 * tint,
    );
  });

  return (
    // Natural scale, feet on y = 0. The rig owns the scale, because it is
    // derived per frame from the trolley's own size.
    <group rotation={[0, FACE_MINUS_X, 0]}>
      <mesh
        ref={shell}
        geometry={geometry}
        material={material}
        position={[0, FOOT_LIFT, 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

useGLTF.preload(ROBOT_URL);
