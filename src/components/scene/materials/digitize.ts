import * as THREE from "three";

/**
 * The transition effect, layered onto a material that already exists.
 *
 * This is applied to the trolley GLB's own PBR material rather than replacing
 * it, so the model keeps its base colour, normal and metallic-roughness maps
 * for the whole steel half of the journey. A front expands from `origin` — the
 * point the robot taps — and everything behind it reads as a lit holographic
 * version of itself:
 *
 *   - albedo shifts to a deep indigo with a soft vertical gradient
 *   - a fresnel term lights the grazing angles, which is what sells it as glass
 *     rather than as an untextured mesh
 *   - a thin, bright crest rides the advancing front
 *
 * Vertex quantisation is deliberately gentle. Snapping hard enough to read as
 * "voxels" wrecks the silhouette; the visible pixelation comes from
 * `VoxelSwarm`, which adds cubes rather than mangling the model.
 *
 * All distances are in MODEL space — the mesh's raw `position` attribute — so
 * `origin` and `maxDist` must come from `model.ts`, not from rig space.
 */

export type DigitizeUniforms = {
  uDigitize: { value: number };
  uTime: { value: number };
  uOrigin: { value: THREE.Vector3 };
  uMaxDist: { value: number };
  uVoxel: { value: number };
  uColorCore: { value: THREE.Color };
  uColorEdge: { value: THREE.Color };
};

const FRONT_WIDTH = 0.3;
/** How far toward the voxel lattice the surface actually moves. */
const SNAP = 0.25;

export function applyDigitize(
  material: THREE.Material,
  opts: {
    origin: THREE.Vector3;
    maxDist: number;
    voxel?: number;
    core?: THREE.ColorRepresentation;
    edge?: THREE.ColorRepresentation;
  },
): DigitizeUniforms {
  const uniforms: DigitizeUniforms = {
    uDigitize: { value: 0 },
    uTime: { value: 0 },
    uOrigin: { value: opts.origin.clone() },
    uMaxDist: { value: opts.maxDist },
    uVoxel: { value: opts.voxel ?? 0.02 },
    uColorCore: { value: new THREE.Color(opts.core ?? "#2440b8") },
    uColorEdge: { value: new THREE.Color(opts.edge ?? "#7fe6ff") },
  };
  material.userData.uniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uDigitize;
        uniform float uTime;
        uniform vec3  uOrigin;
        uniform float uMaxDist;
        uniform float uVoxel;
        varying float vDigit;
        varying vec3  vLocalPos;
      `,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `
        #include <begin_vertex>

        vLocalPos = position;

        float d = distance(position, uOrigin) / uMaxDist;
        float front = uDigitize * (1.0 + ${FRONT_WIDTH.toFixed(2)});
        float t = 1.0 - smoothstep(front - ${FRONT_WIDTH.toFixed(2)}, front, d);
        vDigit = t;

        vec3 voxel = floor(position / uVoxel + 0.5) * uVoxel;

        // Only vertices right on the advancing front shiver, and only barely.
        float crest = t * (1.0 - t) * 4.0;
        float noise = sin(uTime * 5.0 + position.y * 60.0 + position.x * 43.0 + position.z * 51.0);
        vec3 shiver = normal * noise * 0.004 * crest;

        transformed = mix(position, voxel, t * ${SNAP.toFixed(2)}) + shiver;
      `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform vec3  uColorCore;
        uniform vec3  uColorEdge;
        varying float vDigit;
        varying vec3  vLocalPos;
      `,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        #include <map_fragment>

        // Soft vertical gradient — a hard band pattern reads as a texture bug.
        float grad = clamp(vLocalPos.y * 0.8 + 0.2, 0.0, 1.0);
        vec3 digital = mix(uColorCore * 0.72, uColorCore * 1.35, grad);
        diffuseColor.rgb = mix(diffuseColor.rgb, digital, vDigit);
      `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.22, vDigit);
      `,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `
        #include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.35, vDigit);
      `,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `
        #include <emissivemap_fragment>

        vec3 vDir = normalize(vViewPosition);
        float fres = pow(1.0 - clamp(dot(normal, vDir), 0.0, 1.0), 2.2);

        float crest = vDigit * (1.0 - vDigit);
        crest = crest * crest * 14.0;

        float scan = 0.5 + 0.5 * sin(vLocalPos.y * 12.0 - uTime * 0.9);

        totalEmissiveRadiance += uColorEdge * crest * 1.5;
        totalEmissiveRadiance += uColorEdge * fres * vDigit * 0.85;
        totalEmissiveRadiance += uColorCore * vDigit * (0.06 + scan * 0.06);
      `,
      );
  };

  // Without this, three reuses the un-injected program for materials that share
  // the same feature set.
  material.customProgramCacheKey = () => "growmerce-digitize";
  material.needsUpdate = true;

  return uniforms;
}
