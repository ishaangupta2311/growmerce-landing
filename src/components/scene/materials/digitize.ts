import * as THREE from "three";

/**
 * The transition material.
 *
 * A standard PBR material with a digitisation front injected into it. The front
 * is a sphere that expands from `uOrigin` — the point where the robot hand
 * touches the cart — and everything it has swallowed gets:
 *
 *   1. its vertices snapped to a voxel grid (the "pixelated" read),
 *   2. its albedo pushed to the digital blue,
 *   3. its metalness dropped and an emissive scanline added.
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

export type DigitizeMaterial = THREE.MeshStandardMaterial & {
  userData: { uniforms: DigitizeUniforms };
};

const FRONT_WIDTH = 0.34;

export function createDigitizeMaterial(
  params: THREE.MeshStandardMaterialParameters & {
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
    voxel = 0.09,
    core = "#1657ff",
    edge = "#4cd8ff",
    ...standard
  } = params;

  const material = new THREE.MeshStandardMaterial(standard) as DigitizeMaterial;

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

        // Snap to a voxel lattice — this is the "pixelated" silhouette.
        vec3 voxel = floor(position / uVoxel + 0.5) * uVoxel;

        // Vertices right on the advancing front shiver before they settle.
        float crest = t * (1.0 - t) * 4.0;
        float noise = sin(uTime * 7.0 + position.y * 31.0 + position.x * 19.0 + position.z * 27.0);
        vec3 shiver = normal * noise * 0.022 * crest;

        transformed = mix(position, voxel, t * 0.88) + shiver;
      `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform float uVoxel;
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

        // Alternating lattice bands give the digital half a data-like texture.
        float band = step(0.5, fract(vLocalPos.y / (uVoxel * 2.0)));
        vec3 digital = mix(uColorCore, uColorCore * 2.1, band);
        diffuseColor.rgb = mix(diffuseColor.rgb, digital, vDigit);
      `,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.4, vDigit);
      `,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `
        #include <metalnessmap_fragment>
        metalnessFactor = mix(metalnessFactor, 0.0, vDigit);
      `,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `
        #include <emissivemap_fragment>

        // Bright rim exactly on the front, fading out behind it.
        float crest = vDigit * (1.0 - vDigit) * 4.0;
        float scan = 0.5 + 0.5 * sin(vLocalPos.y * 46.0 - uTime * 3.2);
        totalEmissiveRadiance += uColorEdge * crest * 2.4;
        totalEmissiveRadiance += uColorCore * vDigit * (0.22 + scan * 0.3);
      `,
      );
  };

  // Without this, three reuses the un-injected program for materials that share
  // the same feature set.
  material.customProgramCacheKey = () => "growmerce-digitize";

  return material;
}
