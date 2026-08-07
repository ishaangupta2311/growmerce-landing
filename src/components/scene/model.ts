import * as THREE from "three";

/**
 * Placement data for the trolley GLB.
 *
 * The supplied model is ~1m tall, sits on the ground at Y=0, runs along X with
 * the handle at -X, and is 63MB of unindexed 1.9M-triangle geometry. It ships
 * from `public/models/cart.glb`, which is the same asset put through
 * gltf-transform (simplify to ~105k tris, 2048² WebP textures, meshopt) — see
 * README for the exact command.
 *
 * Two coordinate spaces matter here and mixing them up is the easy mistake:
 *
 *   MODEL space — the raw vertex positions inside the GLB. The digitisation
 *   shader and the voxel swarm both work here, because they read the mesh's
 *   `position` attribute directly.
 *
 *   RIG space — what the rest of the scene sees, after `MODEL_TRANSFORM` flips
 *   the model to put the handle at +X, scales it up and drops the ground to
 *   y = -1.25. The robot hand is placed in this space.
 */

export const CART_URL = "/models/cart.glb";

export const MODEL_TRANSFORM = {
  /** Model faces -X; the rig convention is handle at +X. */
  rotationY: Math.PI,
  scale: 2.2,
  /** Puts the model's ground plane at the rig's old wheel height. */
  offsetY: -1.25,
};

/**
 * Centre of the handle grip bar, in MODEL space. Measured from the vertex data
 * rather than guessed: the topmost 3cm of the mesh is a single bar spanning the
 * full width at x ≈ -0.445.
 */
export const MODEL_ORIGIN = new THREE.Vector3(-0.445, 0.962, 0.003);

/** Distance from MODEL_ORIGIN to the far bottom corner — normalises the front. */
export const MODEL_SPAN = 1.36;

/** The same handle point, in RIG space. This is where the fingertip lands. */
export const CART_CONTACT = new THREE.Vector3(0.979, 0.866, 0);

/**
 * Extent of the RENDERED trolley in RIG space — measured, not assumed.
 *
 * `Cart` renders the GLB's raw geometry and deliberately drops the node
 * transform the exporter wrapped it in (translate y +0.4895, uniform scale
 * 0.4895). It has to: MODEL_ORIGIN, MODEL_SPAN, VOXEL_SIZE and the digitisation
 * shader all work in raw vertex space, so re-applying that node would
 * invalidate every one of them at once.
 *
 * The consequence is the part that bit us. The mesh spans y ∈ [-0.9995, 0.9995]
 * instead of resting on y = 0, so MODEL_TRANSFORM puts the wheels at -3.449,
 * not at its `offsetY` of -1.25. The rig treated -1.25 as the wheel line for a
 * long time, which quietly dropped the trolley 2.2 × scale below every pixel
 * anchor that was supposed to be positioning it — and no amount of tuning
 * HERO_GROUND could fix that, because the error scaled with the model.
 *
 * Read off the POSITION accessor bounds in `public/models/cart.glb`.
 */
export const MODEL_GROUND = -0.999512 * MODEL_TRANSFORM.scale + MODEL_TRANSFORM.offsetY;
export const MODEL_TOP = 0.999512 * MODEL_TRANSFORM.scale + MODEL_TRANSFORM.offsetY;
export const MODEL_HEIGHT = MODEL_TOP - MODEL_GROUND;

/** Voxel cube edge length, in MODEL space (scaled up by the group transform). */
export const VOXEL_SIZE = 0.016;

/** Pulls the first mesh out of a loaded GLB scene. */
export function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((child) => {
    if (!found && (child as THREE.Mesh).isMesh) found = child as THREE.Mesh;
  });
  return found;
}

/** Evenly strided sample of a geometry's vertices, in MODEL space. */
export function samplePoints(geometry: THREE.BufferGeometry, count: number) {
  const pos = geometry.getAttribute("position");
  const stride = Math.max(1, Math.floor(pos.count / count));
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count && points.length < count; i += stride) {
    points.push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }
  return points;
}
