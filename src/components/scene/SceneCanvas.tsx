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
 * The environment does most of the work here. Polished metal is essentially a
 * mirror, so what the trolley looks like is decided almost entirely by what
 * surrounds it. Two failure modes to stay between: a uniformly white studio
 * gives a flat white blob with no form, and a dark studio turns the whole
 * object muddy. The rig below is a bright studio with *banded* contrast — light
 * shell, bright strip lights, and a few dark panels whose reflections draw the
 * dark lines that make chrome read as chrome.
 *
 * Deliberately no bloom. The reference art is a clean product render with no
 * glow; on a light page, bloom smears the specular highlights into a haze and
 * costs the image all of its crispness.
 *
 * Built from Lightformers rather than an HDR preset so there is no network
 * fetch at runtime.
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
        toneMappingExposure: 1,
      }}
      camera={{ position: [0, 0.25, 9], fov: 30, near: 0.1, far: 60 }}
      onCreated={() => setSceneReady(true)}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.9} />
      <directionalLight position={[-6, 2, -4]} intensity={0.6} color="#cfe0ff" />

      <Environment resolution={512} frames={1}>
        {/* Light shell — the studio's ambient value. */}
        <mesh scale={60}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#c3cbd8" side={THREE.BackSide} />
        </mesh>

        {/* Dark panels. Chrome only reads as metal when it has something dark
            to reflect between the highlights — these draw those bands. */}
        <mesh position={[0, -3, -14]} rotation={[0, 0, 0]}>
          <planeGeometry args={[40, 14]} />
          <meshBasicMaterial color="#39414f" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -9, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial color="#4a5262" side={THREE.DoubleSide} />
        </mesh>

        {/* Broad soft key overhead — the studio softbox. */}
        <Lightformer
          form="rect"
          intensity={5}
          position={[0, 9, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 14, 1]}
          color="#ffffff"
        />

        {/* Long strip lights either side, which draw the bright highlight
            running down the length of each wire. */}
        <Lightformer
          form="rect"
          intensity={5}
          position={[-8, 2, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[12, 3, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={3.5}
          position={[8, 1.5, -2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[12, 2.2, 1]}
          color="#eef4ff"
        />

        {/* Front fill so the face of the basket isn't in shadow. */}
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 1, 9]}
          scale={[9, 7, 1]}
          color="#ffffff"
        />
      </Environment>

      <Rig />

      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  );
}
