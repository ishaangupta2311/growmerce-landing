"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildCart, CART_CONTACT, CART_SPAN } from "./geometry/cart";
import { damp, scroll } from "@/lib/scroll";

/**
 * The pixelation layer.
 *
 * Cubes sampled along the trolley's own wires, which bloom into existence as the
 * digitisation front sweeps past them. This is where the "pixelated" read comes
 * from — doing it by snapping the model's vertices to a lattice instead just
 * shreds the silhouette of a thin wire mesh and looks like a broken asset.
 *
 * Every per-frame value is a single uniform: the front position. Instance
 * transforms and per-cube distances are baked once at build time, so this costs
 * nothing on the CPU no matter how many cubes there are.
 */

const COUNT = 640;
const SIZE = 0.036;
const FRONT_WIDTH = 0.3;

function samplePoints(geometry: THREE.BufferGeometry, count: number) {
  const pos = geometry.getAttribute("position");
  const stride = Math.max(1, Math.floor(pos.count / count));
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count && points.length < count; i += stride) {
    points.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }
  return points;
}

export default function VoxelSwarm() {
  const mesh = useRef<THREE.InstancedMesh>(null!);

  const { geometry, material, points } = useMemo(() => {
    const { frame } = buildCart();
    const points = samplePoints(frame, COUNT);

    const geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);

    // Distance from the contact point, baked per cube so the shader only needs
    // to compare it against the front.
    const dist = new Float32Array(points.length);
    const seed = new Float32Array(points.length);
    points.forEach((p, i) => {
      dist[i] = p.distanceTo(CART_CONTACT) / CART_SPAN;
      seed[i] = (Math.sin(i * 127.1) * 43758.5453) % 1;
    });
    geometry.setAttribute("aDist", new THREE.InstancedBufferAttribute(dist, 1));
    geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 1));

    const uniforms = {
      uDigitize: { value: 0 },
      uTime: { value: 0 },
      uGlow: { value: new THREE.Color("#7fe6ff") },
    };

    const material = new THREE.MeshStandardMaterial({
      color: "#2f56e0",
      roughness: 0.28,
      metalness: 0.2,
    });
    material.userData.uniforms = uniforms;

    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `
          #include <common>
          attribute float aDist;
          attribute float aSeed;
          uniform float uDigitize;
          uniform float uTime;
          varying float vAppear;
          varying float vSeed;
        `,
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `
          #include <begin_vertex>

          float front = uDigitize * (1.0 + ${FRONT_WIDTH.toFixed(2)});
          float appear = 1.0 - smoothstep(front - ${FRONT_WIDTH.toFixed(2)}, front, aDist);
          vAppear = appear;
          vSeed = aSeed;

          // Cubes at the front are momentarily oversized, then settle — that
          // overshoot is what makes the sweep feel like it has energy.
          float pop = 1.0 + (1.0 - abs(appear * 2.0 - 1.0)) * 0.9;
          float s = appear * pop;

          vec3 drift = vec3(
            sin(aSeed * 91.7),
            cos(aSeed * 47.3),
            sin(aSeed * 133.1)
          ) * 0.05 * appear;

          float wobble = sin(uTime * 1.4 + aSeed * 6.2831) * 0.01 * appear;

          transformed = position * s + drift + wobble;
        `,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `
          #include <common>
          uniform vec3 uGlow;
          uniform float uTime;
          varying float vAppear;
          varying float vSeed;
        `,
        )
        .replace(
          "#include <emissivemap_fragment>",
          /* glsl */ `
          #include <emissivemap_fragment>
          float twinkle = 0.55 + 0.45 * sin(uTime * 2.2 + vSeed * 12.0);
          float crest = 1.0 - abs(vAppear * 2.0 - 1.0);
          totalEmissiveRadiance += uGlow * (vAppear * 0.35 * twinkle + crest * 1.1);
        `,
        );
    };
    material.customProgramCacheKey = () => "growmerce-voxel";

    return { geometry, material, points };
  }, []);

  // Instance transforms are static — written once, never touched again.
  useEffect(() => {
    const dummy = new THREE.Object3D();
    points.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.rotation.set(p.x * 3.1, p.y * 2.7, p.z * 4.3);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [points]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((frame, dt) => {
    const node = mesh.current;
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
    <instancedMesh
      ref={mesh}
      args={[geometry, material, points.length]}
      frustumCulled={false}
    />
  );
}
