"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { applyDigitize } from "./materials/digitize";
import VoxelSwarm from "./VoxelSwarm";
import {
  CART_URL,
  MODEL_ORIGIN,
  MODEL_SPAN,
  MODEL_TRANSFORM,
  firstMesh,
} from "./model";
import { damp, scroll } from "@/lib/scroll";

/**
 * The trolley.
 *
 * Loads the supplied GLB and layers the digitisation onto its own PBR material,
 * so the steel half keeps the model's base colour, normal and roughness maps.
 * The inner group is the MODEL → RIG transform described in `model.ts`; the
 * voxel swarm lives inside it so its cubes share the model's coordinate space.
 */
export default function Cart() {
  const gltf = useGLTF(CART_URL);
  const shell = useRef<THREE.Mesh>(null!);

  const { geometry, material } = useMemo(() => {
    const mesh = firstMesh(gltf.scene);
    if (!mesh) throw new Error(`No mesh found in ${CART_URL}`);

    const geometry = mesh.geometry;
    // Cloned so the cached GLTF's material is never mutated — useGLTF hands the
    // same instance to every consumer.
    const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const material = source.clone();

    applyDigitize(material, { origin: MODEL_ORIGIN, maxDist: MODEL_SPAN });

    return { geometry, material };
  }, [gltf]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((frame, dt) => {
    const node = shell.current;
    if (!node) return;

    // Reached through the mesh ref rather than the memoised material: three's
    // uniforms are mutated every tick by design, and the ref is the handle the
    // compiler treats as writable.
    const progress = damp(node.userData.digitize ?? 0, scroll.digitize, 5.5, dt);
    node.userData.digitize = progress;

    const u = (node.material as THREE.Material).userData.uniforms;
    u.uDigitize.value = progress;
    u.uTime.value = frame.clock.elapsedTime;
  });

  return (
    <group
      position={[0, MODEL_TRANSFORM.offsetY, 0]}
      rotation={[0, MODEL_TRANSFORM.rotationY, 0]}
      scale={MODEL_TRANSFORM.scale}
    >
      {/* Both, not just cast: the basket is a cage, so most of what sells it as
          a solid object is the wires shadowing each other. */}
      <mesh
        ref={shell}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />
      <VoxelSwarm geometry={geometry} />
    </group>
  );
}

useGLTF.preload(CART_URL);
