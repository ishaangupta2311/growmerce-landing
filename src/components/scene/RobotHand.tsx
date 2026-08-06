"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { RoundedBox } from "@react-three/drei";

/**
 * A stylised robotic hand: white shell panels, dark machined joints and a
 * teal circuit trace running down each digit.
 *
 * The hand hangs from above with the index finger extended; every other digit
 * stays curled. `curl` is exposed so the rig can flex the hand slightly on
 * contact with the trolley handle.
 */

type FingerSpec = {
  position: [number, number, number];
  /** Splay away from the palm, radians. */
  spread: number;
  lengths: number[];
  width: number;
  /** Joint angle at curl = 1, per segment. */
  bend: number[];
};

const FINGERS: FingerSpec[] = [
  // Index — the one that reaches the handle. Stays almost straight.
  { position: [-0.17, -0.2, 0.02], spread: -0.06, lengths: [0.3, 0.26, 0.2], width: 0.105, bend: [0.25, 0.3, 0.25] },
  { position: [-0.02, -0.22, 0.02], spread: 0.0, lengths: [0.32, 0.27, 0.2], width: 0.105, bend: [1.35, 1.5, 1.2] },
  { position: [0.13, -0.21, 0.02], spread: 0.05, lengths: [0.3, 0.25, 0.19], width: 0.1, bend: [1.4, 1.55, 1.25] },
  { position: [0.27, -0.18, 0.01], spread: 0.12, lengths: [0.25, 0.21, 0.17], width: 0.092, bend: [1.45, 1.5, 1.3] },
];

const THUMB: FingerSpec = {
  position: [-0.24, -0.02, 0.14],
  spread: -0.5,
  lengths: [0.24, 0.22],
  width: 0.11,
  bend: [0.7, 0.6],
};

function Segment({
  length,
  width,
  shell,
  joint,
  trace,
  children,
}: {
  length: number;
  width: number;
  shell: THREE.Material;
  joint: THREE.Material;
  trace: THREE.Material;
  children?: React.ReactNode;
}) {
  return (
    <group>
      {/* Knuckle at the pivot. */}
      <mesh material={joint} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[width * 0.5, width * 0.5, width * 1.02, 14]} />
      </mesh>

      {/* Shell panel. */}
      <RoundedBox
        args={[width, length, width * 0.92]}
        radius={width * 0.32}
        smoothness={3}
        position={[0, -length / 2 - width * 0.18, 0]}
        material={shell}
      />

      {/* Circuit trace down the back of the digit. */}
      <mesh
        material={trace}
        position={[0, -length / 2 - width * 0.18, -width * 0.47]}
      >
        <boxGeometry args={[width * 0.24, length * 0.6, width * 0.06]} />
      </mesh>

      {/* Next phalanx, pivoting at the far end. */}
      <group position={[0, -length - width * 0.34, 0]}>{children}</group>
    </group>
  );
}

function Finger({
  spec,
  curl,
  shell,
  joint,
  trace,
}: {
  spec: FingerSpec;
  curl: number;
  shell: THREE.Material;
  joint: THREE.Material;
  trace: THREE.Material;
}) {
  // Build from the fingertip back so each segment nests inside its parent and
  // joint rotations compound the way a real finger's do.
  let node: React.ReactNode = null;
  for (let i = spec.lengths.length - 1; i >= 0; i--) {
    const inner = node;
    node = (
      <group key={i} rotation={[-spec.bend[i] * curl, 0, 0]}>
        <Segment
          length={spec.lengths[i]}
          width={spec.width * (1 - i * 0.1)}
          shell={shell}
          joint={joint}
          trace={trace}
        >
          {inner}
        </Segment>
      </group>
    );
  }

  return (
    <group position={spec.position} rotation={[0, 0, spec.spread]}>
      {node}
    </group>
  );
}

export default function RobotHand({ curl = 1 }: { curl?: number }) {
  const materials = useMemo(() => {
    const shell = new THREE.MeshStandardMaterial({
      color: "#f7f8fa",
      roughness: 0.34,
      metalness: 0.06,
      envMapIntensity: 1.1,
    });
    const joint = new THREE.MeshStandardMaterial({
      color: "#2f3236",
      roughness: 0.32,
      metalness: 0.85,
    });
    const trace = new THREE.MeshStandardMaterial({
      color: "#0f9c8a",
      roughness: 0.4,
      metalness: 0.3,
      emissive: new THREE.Color("#0aa38d"),
      emissiveIntensity: 0.45,
    });
    const cuff = new THREE.MeshStandardMaterial({
      color: "#d9dce1",
      roughness: 0.3,
      metalness: 0.55,
    });
    return { shell, joint, trace, cuff };
  }, []);

  const { shell, joint, trace, cuff } = materials;

  return (
    <group>
      {/* Forearm, cropped by the top of the frame like the reference. */}
      <mesh material={shell} position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.23, 0.27, 1.5, 24, 1, true]} />
      </mesh>
      <mesh material={cuff} position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.275, 0.26, 0.16, 24]} />
      </mesh>
      <mesh material={joint} position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.46, 20]} />
      </mesh>

      {/* Palm. */}
      <RoundedBox
        args={[0.56, 0.44, 0.26]}
        radius={0.09}
        smoothness={4}
        position={[0.03, 0.03, 0]}
        material={shell}
      />
      <mesh material={trace} position={[0.03, 0.03, -0.13]}>
        <boxGeometry args={[0.3, 0.22, 0.02]} />
      </mesh>

      {FINGERS.map((spec, i) => (
        <Finger
          key={i}
          spec={spec}
          // The index finger keeps a light, near-straight pose regardless.
          curl={i === 0 ? curl * 0.35 : 0.55 + curl * 0.45}
          shell={shell}
          joint={joint}
          trace={trace}
        />
      ))}

      <group rotation={[0, 0.55, 0]}>
        <Finger spec={THUMB} curl={0.5 + curl * 0.5} shell={shell} joint={joint} trace={trace} />
      </group>
    </group>
  );
}
