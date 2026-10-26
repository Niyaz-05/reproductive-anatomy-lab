import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SimulationDefinition } from '../contract/schema';
import { pointAlong, routePath, vec } from '../repro/anchors';
import type { Flow, SpermStream } from '../repro/live';

function curveOf(points: readonly (readonly number[])[]) {
  return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...vec(p))), false, 'centripetal');
}

interface Track { curve: THREE.CatmullRomCurve3; length: number; count: number; offset: number; colour: string; flow: string; size: number; speed: number }

/** How many particles a metre of route carries at full strength. */
const DENSITY = 90;

/**
 * Particles streaming along their routes (hormones, blood, milk, seminal fluid) at a steady speed. A
 * route's strength (the level) sets how many of its particles show and how large they are, so a
 * rising level reads as a thicker stream. Drawn over the tissue, like vessels in a textbook diagram.
 */
export function HormoneFlow({ def, flows, playing, reducedMotion }: { def: SimulationDefinition; flows: Flow[]; playing: boolean; reducedMotion: boolean }) {
  // Rebuild the tracks only when the routes change, not when the levels do.
  const key = `${def.body}|` + flows.map((f) => `${f.id}:${f.paths.map((p) => p.join('+')).join('|')}`).join(';');
  const tracks = useMemo(() => {
    let offset = 0;
    const out: Track[] = [];
    for (const f of flows) for (const path of f.paths) {
      let pts: number[][];
      try { pts = routePath(def, path); } catch { continue; }
      const curve = curveOf(pts);
      const length = curve.getLength();
      const count = Math.max(6, Math.round(length * DENSITY));
      out.push({ curve, length, count, offset, colour: f.colour, flow: f.id, size: f.size ?? 1, speed: f.speed ?? 1 });
      offset += count;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const levels = useRef<Record<string, number>>({});
  levels.current = Object.fromEntries(flows.map((f) => [f.id, f.level]));
  const total = tracks.reduce((n, t) => n + t.count, 0);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const travelled = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => new THREE.SphereGeometry(0.0011, 8, 6), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false, depthTest: false, transparent: true, opacity: 0.95 }), []);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);

  function place(distance: number) {
    const m = mesh.current;
    if (!m) return;
    for (const t of tracks) {
      const level = levels.current[t.flow] ?? 0;
      // Share of particles shown: none at zero, all from 1.5 times normal.
      const shown = Math.round(t.count * Math.min(1, level / 1.5));
      const size = (0.6 + 0.35 * Math.min(level, 2)) * t.size;
      const shift = (distance * t.speed) / t.length;
      for (let i = 0; i < t.count; i++) {
        const u = (((i / t.count + shift) % 1) + 1) % 1;
        t.curve.getPointAt(u, p);
        tmp.position.copy(p);
        const visible = shown > 0 && Math.floor(((i + 1) * shown) / t.count) !== Math.floor((i * shown) / t.count);
        tmp.scale.setScalar(visible ? size : 0);
        tmp.updateMatrix();
        m.setMatrixAt(t.offset + i, tmp.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  }

  useEffect(() => {
    const m = mesh.current;
    if (m) {
      const c = new THREE.Color();
      for (const t of tracks) for (let i = 0; i < t.count; i++) m.setColorAt(t.offset + i, c.set(t.colour));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    place(travelled.current);
    invalidate();
  });

  useFrame((_, dt) => {
    if (!playing || reducedMotion) return;
    travelled.current += 0.05 * Math.min(dt, 0.25);
    place(travelled.current);
  });

  if (!total) return null;
  return <instancedMesh key={`${key}-${total}`} ref={mesh} args={[geometry, material, total]} frustumCulled={false} renderOrder={6} />;
}

/** A deterministic hash in 0 … 1 for particle i. */
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/**
 * Sperm swimming along their route: each particle has its own speed; the share still swimming at
 * each point follows the route's survival (most are lost at the cervix), and none pass `reach` (a
 * vasectomy). Each sperm is a head with a short tail pointing back along the route. Larger than life.
 */
export function SpermFlow({ def, streams, playing, reducedMotion }: { def: SimulationDefinition; streams: SpermStream[]; playing: boolean; reducedMotion: boolean }) {
  const PER = 160;
  const key = `${def.body}|${streams.map((s) => `${s.route}:${s.reach.toFixed(3)}`).join(';')}`;
  const tracks = useMemo(() => streams.map((s) => { let pts: number[][] = []; try { pts = routePath(def, [s.route]); } catch { /* not in this body */ } return { s, pts }; }).filter((t) => t.pts.length > 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]);
  const head = useRef<THREE.InstancedMesh>(null), tail = useRef<THREE.InstancedMesh>(null);
  const t0 = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const geoHead = useMemo(() => new THREE.SphereGeometry(0.0008, 8, 6).scale(1, 1, 1.5), []);
  const geoTail = useMemo(() => new THREE.CylinderGeometry(0.00012, 0.00028, 0.0045, 4).translate(0, -0.0026, 0), []);
  const matHead = useMemo(() => new THREE.MeshBasicMaterial({ color: '#f4f6ff', toneMapped: false, depthTest: false, transparent: true, opacity: 0.95 }), []);
  const matTail = useMemo(() => new THREE.MeshBasicMaterial({ color: '#cfd8ff', toneMapped: false, depthTest: false, transparent: true, opacity: 0.7 }), []);
  useEffect(() => () => { geoHead.dispose(); geoTail.dispose(); matHead.dispose(); matTail.dispose(); }, [geoHead, geoTail, matHead, matTail]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  function place(time: number) {
    const h = head.current, tl = tail.current;
    if (!h || !tl) return;
    let i = 0;
    for (const { s, pts } of tracks) {
      for (let k = 0; k < PER; k++, i++) {
        const speed = 0.04 + 0.05 * hash(k + 7);
        const u = (((hash(k) + time * speed) % 1) + 1) % 1 * s.reach;
        const alive = hash(k + 99) < s.survival(u) * s.level;
        const p = new THREE.Vector3(...pointAlong(pts, u)), q = new THREE.Vector3(...pointAlong(pts, Math.min(s.reach, u + 0.004)));
        const dir = q.sub(p);
        tmp.position.copy(p);
        if (dir.lengthSq() > 0) tmp.quaternion.setFromUnitVectors(up, dir.normalize());
        tmp.scale.setScalar(alive ? 1 : 0);
        tmp.updateMatrix();
        h.setMatrixAt(i, tmp.matrix); tl.setMatrixAt(i, tmp.matrix);
      }
    }
    h.instanceMatrix.needsUpdate = true; tl.instanceMatrix.needsUpdate = true;
  }
  useEffect(() => { place(t0.current); invalidate(); });
  useFrame((_, dt) => {
    if (!playing || reducedMotion) return;
    t0.current += Math.min(dt, 0.25);
    place(t0.current);
  });
  const n = tracks.length * PER;
  if (!n) return null;
  return (
    <group>
      <instancedMesh key={`h${key}`} ref={head} args={[geoHead, matHead, n]} frustumCulled={false} renderOrder={7} />
      <instancedMesh key={`t${key}`} ref={tail} args={[geoTail, matTail, n]} frustumCulled={false} renderOrder={7} />
    </group>
  );
}

/** A single glowing marker on a route (the egg, the embryo), larger than life, with its label. */
export function RouteMarker({ def, route, u, radius, colour }: { def: SimulationDefinition; route: string; u: number; radius: number; colour: string }) {
  const pos = useMemo(() => { try { return new THREE.Vector3(...pointAlong(routePath(def, [route]), u)); } catch { return null; } }, [def, route, u]);
  if (!pos) return null;
  return (
    <group position={pos}>
      <mesh renderOrder={8} raycast={() => null}>
        <sphereGeometry args={[radius, 20, 14]} />
        <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={0.55} roughness={0.35} depthTest={false} transparent opacity={0.95} />
      </mesh>
      <mesh renderOrder={8} raycast={() => null}>
        <sphereGeometry args={[radius * 1.45, 20, 14]} />
        <meshBasicMaterial color={colour} transparent opacity={0.18} depthTest={false} />
      </mesh>
    </group>
  );
}
