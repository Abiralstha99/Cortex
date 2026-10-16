import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { MathUtils, type Group, type Mesh, type MeshStandardMaterial } from "three";
import LandingDiagram from "./LandingDiagram";

type Point = [number, number, number];
type Node = { label: string; color: string; position: Point; radius: number; phase: number };

const nodes: Node[] = [
  { label: "HOST", color: "#F2912F", position: [-1.62, 1.03, 0.1], radius: 0.39, phase: 0 },
  { label: "FRIENDS", color: "#8F44E8", position: [1.63, 0.99, 0.18], radius: 0.45, phase: 1.6 },
  { label: "QUESTIONS", color: "#2E86E0", position: [-1.56, -1.11, 0.14], radius: 0.46, phase: 3.1 },
  { label: "SCORES", color: "#47B72B", position: [1.58, -1.16, 0.12], radius: 0.38, phase: 4.5 },
];

function circlePoints(radius: number, z: number): Point[] {
  return Array.from({ length: 97 }, (_, index) => {
    const angle = index * Math.PI * 2 / 96;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, z];
  });
}

const outerRing = circlePoints(1.82, -0.38);
const innerRing = circlePoints(1.16, -0.25);

function OrbitalNode({ node }: { node: Node }) {
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  const hovered = useRef(false);

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return;
    mesh.current.position.y = node.position[1] + Math.sin(clock.elapsedTime * 0.65 + node.phase) * 0.035;
    const scale = MathUtils.damp(mesh.current.scale.x, hovered.current ? 1.08 : 1, 7, delta);
    mesh.current.scale.setScalar(scale);
    if (material.current) {
      material.current.emissiveIntensity = MathUtils.damp(material.current.emissiveIntensity, hovered.current ? 0.18 : 0.06, 7, delta);
    }
  });

  return (
    <mesh
      ref={mesh}
      position={node.position}
      onPointerOver={(event) => {
        event.stopPropagation();
        hovered.current = true;
      }}
      onPointerOut={() => { hovered.current = false; }}
    >
      <sphereGeometry args={[node.radius, 32, 24]} />
      <meshStandardMaterial
        ref={material}
        color={node.color}
        emissive={node.color}
        emissiveIntensity={0.06}
        roughness={0.65}
        metalness={0.02}
      />
      <mesh position={[0, 0, node.radius + 0.005]}>
        <sphereGeometry args={[0.055, 12, 8]} />
        <meshBasicMaterial color="#161410" />
      </mesh>
    </mesh>
  );
}

function Orbit({ tilt }: { tilt: React.RefObject<{ x: number; y: number }> }) {
  const group = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -tilt.current.y * 0.085, 2.5, delta);
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, tilt.current.x * 0.085, 2.5, delta);
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.2) * 0.015;
  });

  return (
    <group ref={group}>
      <Line points={outerRing} color="#D5D2C7" lineWidth={1.2} transparent opacity={0.9} />
      <Line points={innerRing} color="#D5D2C7" lineWidth={1.1} transparent opacity={0.75} />
      {nodes.map((node) => (
        <Line key={`${node.label}-line`} points={[[0, 0, -0.2], node.position]} color="#817F77" lineWidth={1.1} transparent opacity={0.55} />
      ))}
      <mesh position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.64, 40, 32]} />
        <meshStandardMaterial color="#F3EEDC" emissive="#F3EEDC" emissiveIntensity={0.15} roughness={0.8} metalness={0} />
      </mesh>
      {nodes.map((node) => <OrbitalNode key={node.label} node={node} />)}
    </group>
  );
}

export default function OrbitalHeroScene({ active, tilt }: { active: boolean; tilt: React.RefObject<{ x: number; y: number }> }) {
  return (
    <div className="orbital-hero-scene">
      <Canvas
        className="orbital-hero-canvas"
        camera={{ position: [0, 0, 7.5], fov: 42 }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "demand"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        fallback={<LandingDiagram variant="hero" />}
      >
        <ambientLight intensity={2.2} />
        <directionalLight position={[-3, 5, 7]} intensity={2.4} />
        <Orbit tilt={tilt} />
      </Canvas>
      <div className="orbital-hero-labels" aria-hidden="true">
        {nodes.map((node) => (
          <span key={node.label} className={`orbital-hero-label orbital-hero-${node.label.toLowerCase()}`}>{node.label}</span>
        ))}
        <span className="orbital-hero-label orbital-hero-play">PLAY</span>
      </div>
    </div>
  );
}
