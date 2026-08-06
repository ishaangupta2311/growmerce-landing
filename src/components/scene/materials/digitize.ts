import * as THREE from "three";

/**
 * The transition material.
 *
 * A standard PBR material with a digitisation front injected into it. The front
 * is a sphere that expands from `uOrigin` — the point where the robot hand
 * touches the cart — and everything it has swallowed reads as a lit holographic
 * version of itself rather than a flat recolour:
 *
 *   - albedo shifts to a deep indigo with a soft vertical gradient
 *   - a fresnel term lights the grazing angles, which is what sells it as glass
 *     rather than as an untextured mesh
 *   - a thin, bright crest rides the advancing front
 *
 * Vertex quantisation is deliberately gentle. Snapping hard enough to actually
 * read as "voxels" destroys the silhouette of a thin wire mesh and looks broken;
 * the visible pixelation comes from `VoxelSwarm`, which adds cubes rather than
 * mangling the model. Here we only step the surface enough to feel quantised.
 *
 * Keeping this as an injection rather than a from-scratch ShaderMaterial means
 * the steel half still gets real lighting, shadows and environment reflections
 * for free — and it will keep working unchanged when the procedural cart is
 * swapped for a real GLB.
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

export type DigitizeMaterial = THREE.MeshPhysicalMaterial & {
  userData: { uniforms: DigitizeUniforms };
};

const FRONT_WIDTH = 0.3;
/** How far toward the voxel lattice the surface actually moves. */
const SNAP = 0.3;

export function createDigitizeMaterial(
  params: THREE.MeshPhysicalMaterialParameters & {
    origin?: THREE.Vector3;
    maxDist?: number;
    voxel?: number;
    core?: THREE.ColorRepresentation;
    edge?: THREE.ColorRepresentation;
  } = {},
): DigitizeMaterial {
  const {
    origin = new THREE.Vector3(0, 0, 0),
    maxDist = 3.4,
    voxel = 0.05,
    core = "#2440b8",
    edge = "#7fe6ff",
    ...standard
  } = params;

  const material = new THREE.MeshPhysicalMaterial(standard) as DigitizeMaterial;

  const uniforms: DigitizeUniforms = {
    uDigitize: { value: 0 },
    uTime: { value: 0 },
    uOrigin: { value: origin.clone() },
    uMaxDist: { value: maxDist },
    uVoxel: { value: voxel },
    uColorCore: { value: new THREE.Color(core) },
    uColorEdge: { value: new THREE.Color(edge) },
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

        // Normalised distance from the contact point, 0 at the fingertip.
        float d = distance(position, uOrigin) / uMaxDist;

        // Push the front slightly past 1.0 so uDigitize == 1 covers everything.
        float front = uDigitize * (1.0 + ${FRONT_WIDTH.toFixed(2)});
        float t = 1.0 - smoothstep(front - ${FRONT_WIDTH.toFixed(2)}, front, d);
        vDigit = t;

        vec3 voxel = floor(position / uVoxel + 0.5) * uVoxel;

        // Only vertices right on the advancing front shiver, and only barely.
        float crest = t * (1.0 - t) * 4.0;
        float noise = sin(uTime * 5.0 + position.y * 24.0 + position.x * 17.0 + position.z * 21.0);
        vec3 shiver = normal * noise * 0.008 * crest;

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
        float grad = clamp(vLocalPos.y * 0.3 + 0.55, 0.0, 1.0);
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

        // Thin bright crest exactly on the front, not a wide smear.
        float crest = vDigit * (1.0 - vDigit);
        crest = crest * crest * 14.0;

        // A slow scan plane travelling up the model, kept subtle.
        float scan = 0.5 + 0.5 * sin(vLocalPos.y * 5.0 - uTime * 0.9);

        totalEmissiveRadiance += uColorEdge * crest * 1.5;
        totalEmissiveRadiance += uColorEdge * fres * vDigit * 0.85;
        totalEmissiveRadiance += uColorCore * vDigit * (0.06 + scan * 0.06);
      `,
      );
  };

  // Without this, three reuses the un-injected program for materials that share
  // the same feature set.
  material.customProgramCacheKey = () => "growmerce-digitize";

  return material;
}
