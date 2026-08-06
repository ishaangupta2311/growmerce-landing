"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Lightformer, Preload } from "@react-three/drei";
import * as THREE from "three";
import Rig from "./Rig";
import { useScene } from "@/lib/scroll";

/**
 * The fixed WebGL layer. Sits behind the copy for the whole page — the cart is
 * one continuous object across every section, so it must never unmount.
 *
 * The environment is built from Lightformers rather than an HDR preset so the
 * steel gets believable reflections with no network fetch.
 */
export default function SceneCanvas() {
  const setSceneReady = useScene((s) => s.setSceneReady);

  return (
    <Canvas
      className="!pointer-events-none"
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0.25, 9], fov: 30, near: 0.1, far: 60 }}
      onCreated={() => setSceneReady(true)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={2.1} />
      <directionalLight position={[-6, 2, -4]} intensity={0.7} color="#cfe0ff" />

      <Environment resolution={256} frames={1}>
        {/* Big soft key from above — the studio look in the reference. */}
        <Lightformer
          intensity={3.2}
          position={[0, 6, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 14, 1]}
          color="#ffffff"
        />
        {/* Rim strips that pick out the wire frame against the light page. */}
        <Lightformer
          form="ring"
          intensity={2.4}
          position={[-6, 2, 3]}
          scale={[6, 6, 1]}
          color="#dfe7f5"
        />
        <Lightformer
          intensity={1.6}
          position={[6, 0, -4]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[8, 5, 1]}
          color="#ffe6d6"
        />
        <Lightformer
          intensity={1.1}
          position={[0, -4, 2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          color="#f2f4f8"
        />
      </Environment>

      <Rig />

      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  );
}
