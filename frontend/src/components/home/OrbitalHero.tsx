import { lazy, Suspense, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import LandingDiagram from "./LandingDiagram";

const OrbitalHeroScene = lazy(() => import("./OrbitalHeroScene"));

export default function OrbitalHero() {
  const figureRef = useRef<HTMLElement>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const isInView = useInView(figureRef, { amount: 0.1 });
  const canUseWebGL = typeof window !== "undefined" && typeof window.WebGL2RenderingContext !== "undefined";

  return (
    <figure
      ref={figureRef}
      className="orbital-hero"
      role="img"
      aria-label="Play connects the host, friends, questions, and scores"
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || reduceMotion) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        tilt.current.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        tilt.current.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      }}
      onPointerLeave={() => { tilt.current.x = 0; tilt.current.y = 0; }}
    >
      {reduceMotion || !canUseWebGL ? (
        <LandingDiagram variant="hero" />
      ) : (
        <Suspense fallback={<LandingDiagram variant="hero" />}>
          <OrbitalHeroScene active={isInView} tilt={tilt} />
        </Suspense>
      )}
    </figure>
  );
}
