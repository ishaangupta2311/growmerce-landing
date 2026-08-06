"use client";

import dynamic from "next/dynamic";

// WebGL has no business running during SSR, and drei's Environment expects a
// live renderer at module scope.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export default function Scene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10" aria-hidden="true">
      <SceneCanvas />
    </div>
  );
}
