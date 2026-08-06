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
 * Measured from the vertex data: ~1.9 units tall, centred at the origin with
 * feet at y = -0.952, facing +Z (the toes point that way), standing with arms
 * at the sides — which conveniently rests its hands at the trolley's handle
 * height once scaled.
 */

export const ROBOT_URL = "/models/robot.glb";

/** Model faces +Z; the rig has it pushing toward -X. */
const FACE_MINUS_X = -Math.PI / 2;
/** ~1.5× the trolley's height, the human-to-trolley proportion. */
const ROBOT_SCALE = 1.7;
/** The model's feet sit at y = -0.952 in its own space. */
const FOOT_LIFT = 0.952;

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
    <group rotation={[0, FACE_MINUS_X, 0]} scale={ROBOT_SCALE}>
      <mesh
        ref={shell}
        geometry={geometry}
        material={material}
        position={[0, FOOT_LIFT, 0]}
      />
    </group>
  );
}

useGLTF.preload(ROBOT_URL);
