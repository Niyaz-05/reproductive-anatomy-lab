import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { CloseUp, SimulationDefinition } from '../contract/schema';
import { closeUpFrame } from '../repro/anchors';
import { stageAt } from '../repro/fertilisation';

/**
 * Close-ups built in code: magnified scenes drawn where their tissue is while the body is hidden.
 * Scenes are laid out in local units (about −10 … 10) and scaled to the frame. Layouts are
 * deterministic and illustrative, at textbook proportions, not to scale with each other.
 */
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
const fib = (n: number, i: number) => {
  const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
};

function Label({ at, children }: { at: THREE.Vector3 | [number, number, number]; children: ReactNode }) {
  return <Html position={at} center zIndexRange={[3, 0]} className="closeup-label" pointerEvents="none">{children}</Html>;
}
function Tube({ points, radius, colour, opacity = 1, emissive = 0.12 }: { points: THREE.Vector3[]; radius: number; colour: string; opacity?: number; emissive?: number }) {
  const g = useMemo(() => new THREE.TubeGeometry(curve(points), Math.max(16, points.length * 8), radius, 8, false), [points, radius]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <mesh geometry={g} renderOrder={3} raycast={() => null}>
      <meshStandardMaterial color={colour} roughness={0.4} emissive={colour} emissiveIntensity={emissive} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
    </mesh>
  );
}
function Ball({ at, r, colour, opacity = 1, emissive = 0, scale }: { at: THREE.Vector3; r: number; colour: string; opacity?: number; emissive?: number; scale?: [number, number, number] }) {
  return (
    <mesh position={at} scale={scale ?? [1, 1, 1]} renderOrder={opacity < 1 ? 4 : 3} raycast={() => null}>
      <sphereGeometry args={[r, 28, 20]} />
      <meshPhysicalMaterial color={colour} roughness={0.35} clearcoat={0.6} emissive={colour} emissiveIntensity={emissive} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} side={opacity < 1 ? THREE.DoubleSide : THREE.FrontSide} />
    </mesh>
  );
}
/** Instanced cells (spheres or other shapes) with their own colours. */
function Cells({ items, geometry, opacity = 1 }: { items: { p: THREE.Vector3; s: number | [number, number, number]; c: string; q?: THREE.Quaternion }[]; geometry: THREE.BufferGeometry; opacity?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.5, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }), [opacity]);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const tmp = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, i) => {
      tmp.position.copy(it.p);
      if (typeof it.s === 'number') tmp.scale.setScalar(it.s); else tmp.scale.set(...it.s);
      tmp.quaternion.copy(it.q ?? new THREE.Quaternion()); tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix); m.setColorAt(i, c.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={mesh} args={[geometry, mat, Math.max(1, items.length)]} raycast={() => null} />;
}
/** Particles running along curves. */
function Particles({ curves, colour, radius, speed, playing, perCurve = 10 }: { curves: THREE.CatmullRomCurve3[]; colour: string; radius: number; speed: number; playing: boolean; perCurve?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const t = useRef(0);
  const geo = useMemo(() => new THREE.SphereGeometry(radius, 8, 6), [radius]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: colour, toneMapped: false, transparent: true, opacity: 0.95 }), [colour]);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    if (playing) t.current += Math.min(dt, 0.25) * speed;
    let i = 0;
    for (const c of curves) for (let k = 0; k < perCurve; k++, i++) {
      c.getPointAt((((k / perCurve + t.current) % 1) + 1) % 1, p);
      tmp.position.copy(p); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[geo, mat, Math.max(1, curves.length * perCurve)]} frustumCulled={false} renderOrder={7} />;
}
const SPHERE = new THREE.SphereGeometry(1, 14, 10);
const BOX = new THREE.BoxGeometry(1, 1, 1);
/** Points on the back half of a sphere (z ≤ 0), so the near half is cut away like a section. */
const backHalf = (n: number, r: number) => Array.from({ length: n }, (_, i) => fib(n, i)).filter((d) => d.z <= 0.05).map((d) => d.multiplyScalar(r));

// ── A mature (Graafian) follicle, cut in half ─────────────────────────────
function FollicleScene() {
  const d = useMemo(() => {
    const r = rng(3);
    const gran = backHalf(900, 7.6).map((p) => ({ p, s: 0.32 + r() * 0.1, c: r() > 0.5 ? '#f0cf9c' : '#e8c48c' }));
    const theca = backHalf(500, 8.6).map((p) => ({ p, s: [0.55, 0.2, 0.55] as [number, number, number], c: '#d89a7e', q: new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), p.clone().normalize()) }));
    const cumulusC = v3(0, -4.6, -1.5);
    const cumulus = Array.from({ length: 90 }, (_, i) => ({ p: cumulusC.clone().add(fib(90, i).multiplyScalar(2.2 + r() * 0.6)).setZ(Math.min(cumulusC.z + 1.6, cumulusC.z + fib(90, i).z * 2.2)), s: 0.34, c: '#f2d4a6' }));
    const egg = v3(0, -3.1, -0.6);
    const corona = Array.from({ length: 40 }, (_, i) => ({ p: egg.clone().add(fib(40, i).multiplyScalar(2.15)), s: 0.3, c: '#f6dcb0' }));
    const caps = [0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * Math.PI * 2; return Array.from({ length: 9 }, (_, j) => { const b = (j / 8) * Math.PI * 0.95 + 0.1; return v3(Math.cos(a + j * 0.08) * Math.sin(b) * 8.15, Math.cos(b) * 8.15, -Math.abs(Math.sin(a + j * 0.08) * Math.sin(b) * 8.15)); }); });
    return { gran, theca, cumulus, egg, corona, caps };
  }, []);
  return (
    <group>
      <Cells items={d.theca} geometry={SPHERE} />
      {d.caps.map((c, i) => <Tube key={i} points={c} radius={0.12} colour="#c02838" />)}
      <Cells items={d.gran} geometry={SPHERE} />
      <Cells items={d.cumulus} geometry={SPHERE} />
      <Ball at={v3(0, 0, -0.5)} r={7.3} colour="#fbf3dc" opacity={0.16} />
      <Ball at={d.egg} r={1.35} colour="#fff3e0" emissive={0.1} />
      <Ball at={d.egg} r={1.75} colour="#e6efff" opacity={0.35} />
      <Ball at={d.egg.clone().add(v3(0.3, 0.2, 0.4))} r={0.45} colour="#c8a888" />
      <Cells items={d.corona} geometry={SPHERE} />
      <Label at={[0, 9.8, -1]}>Theca externa (connective tissue)</Label>
      <Label at={[-9.5, 2, -1]}>Theca interna: androgens (under LH), capillaries</Label>
      <Label at={[8.6, -1.5, -1]}>Granulosa cells: oestradiol (under FSH), inhibin</Label>
      <Label at={[0, 3, 0]}>Antrum: follicular fluid</Label>
      <Label at={[-4.5, -6.4, 0]}>Cumulus oophorus</Label>
      <Label at={[3.6, -3.3, 1]}>Oocyte, arrested in meiosis I until the LH surge</Label>
      <Label at={[3.4, -5.4, 1]}>Zona pellucida and corona radiata</Label>
    </group>
  );
}

// ── Fertilisation ─────────────────────────────────────────────────────────
function FertilisationScene({ playing }: { playing: boolean }) {
  const d = useMemo(() => {
    const r = rng(5);
    const corona = backHalf(160, 6).concat(backHalf(60, 6.6)).map((p) => ({ p, s: 0.42 + r() * 0.12, c: '#f4d8ae' }));
    const paths = Array.from({ length: 26 }, (_, i) => {
      const d0 = fib(26, i); d0.z = -Math.abs(d0.z) * 0.6 + 0.3; d0.normalize();
      const end = d0.clone().multiplyScalar(i === 0 ? 0.8 : 4.9 + r() * 0.3), start = d0.clone().multiplyScalar(14 + r() * 3);
      const side = new THREE.Vector3().crossVectors(d0, v3(0, 0, 1)).normalize();
      return curve([start, start.clone().lerp(end, 0.35).addScaledVector(side, 1.2 * (r() - 0.5)), start.clone().lerp(end, 0.7).addScaledVector(side, 0.8 * (r() - 0.5)), end]);
    });
    return { corona, paths };
  }, []);
  return (
    <group>
      <Ball at={v3(0, 0, 0)} r={4} colour="#fff0d8" emissive={0.08} />
      <Ball at={v3(0, 0, 0)} r={4.9} colour="#e2ecff" opacity={0.3} />
      <Ball at={v3(3.2, 2.7, 1.4)} r={0.6} colour="#f2dcc0" />
      <Ball at={v3(-0.9, 0.3, 3.3)} r={0.75} colour="#d0a0d8" emissive={0.2} />
      <Ball at={v3(0.8, -0.2, 3.3)} r={0.7} colour="#90b8f0" emissive={0.2} />
      <Cells items={d.corona} geometry={SPHERE} />
      <Particles curves={d.paths} colour="#f8faff" radius={0.28} speed={0.12} playing={playing} perCurve={3} />
      <Label at={[0, 7.6, -1]}>Corona radiata: granulosa cells around the egg</Label>
      <Label at={[-7.3, -3, 0]}>Zona pellucida: sperm bind (ZP3) and the acrosome releases its enzymes</Label>
      <Label at={[5.5, 3.8, 1.5]}>Second polar body</Label>
      <Label at={[0, -1.8, 4.5]}>Pronuclei: 23 chromosomes from each parent</Label>
      <Label at={[8, -6, 0]}>Capacitated sperm (one gets in; the cortical reaction blocks the rest)</Label>
    </group>
  );
}

// ── Cleavage, blastocyst and implantation ─────────────────────────────────
function EmbryoScene({ day }: { day: number }) {
  const st = stageAt(day);
  const d = useMemo(() => {
    const cells = (n: number, R: number, r: number, c = '#f6e4cc') => Array.from({ length: n }, (_, i) => ({ p: n === 1 ? v3(0, 0, 0) : fib(n, i).multiplyScalar(R), s: r, c }));
    const tropho = Array.from({ length: 140 }, (_, i) => ({ p: fib(140, i).multiplyScalar(4.2), s: [0.9, 0.35, 0.9] as [number, number, number], c: '#e8c8a8', q: new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), fib(140, i)) }));
    const icm = Array.from({ length: 30 }, (_, i) => ({ p: v3(0, 2.6, 0).add(fib(30, i).multiplyScalar(1.3)), s: 0.55, c: '#f2d0b8' }));
    return {
      one: cells(1, 0, 3.2), two: cells(2, 1.6, 2.4), four: cells(4, 1.9, 1.9), eight: cells(8, 2.1, 1.45), morula: cells(24, 2.6, 1.05), tropho, icm,
    };
  }, []);
  const stage = st.id;
  const zona = !['hatching', 'implanted'].includes(stage);
  const body = stage === 'fertilisation' ? d.one : stage === 'two-cell' ? d.two : stage === 'eight-cell' ? (day < 2.2 ? d.four : d.eight) : stage === 'morula' ? d.morula : null;
  const implant = stage === 'implanted' || stage === 'hatching';
  const sink = stage === 'implanted' ? -3.6 : stage === 'hatching' ? -1 : 0;
  return (
    <group>
      {body && <Cells items={body} geometry={SPHERE} />}
      {!body && (
        <group position={[0, sink, 0]} rotation={[Math.PI, 0, 0]}>
          <Cells items={d.tropho.filter((t) => t.p.z <= 0.6)} geometry={SPHERE} />
          <Cells items={d.icm} geometry={SPHERE} />
          <Ball at={v3(0, 0, 0)} r={3.9} colour="#fdf6ea" opacity={0.15} />
        </group>
      )}
      {zona && <Ball at={v3(0, 0, 0)} r={body ? 4.6 : 5} colour="#e2ecff" opacity={0.28} />}
      {implant && (
        <group>
          <mesh position={[0, -8.5, -1]} renderOrder={2} raycast={() => null}><boxGeometry args={[22, 7, 8]} /><meshStandardMaterial color="#b0344a" roughness={0.6} transparent opacity={stage === 'implanted' ? 0.55 : 0.85} /></mesh>
          {[-8, -4, 4, 8].map((x) => <Tube key={x} points={[v3(x, -5.2, -1), v3(x + 0.6, -8, -1), v3(x - 0.4, -11.5, -1)]} radius={0.45} colour="#f0d0c0" />)}
          {[-6, 2, 6].map((x) => <Tube key={`c${x}`} points={[v3(x, -11.5, 1), v3(x + 1, -8.5, 2), v3(x - 1, -6, 2)]} radius={0.22} colour="#d02030" />)}
          {stage === 'implanted' && <Ball at={v3(0, -6.6, 0)} r={5} colour="#7a2440" opacity={0.35} scale={[1.2, 0.6, 1]} />}
        </group>
      )}
      <Label at={[0, 7.2, 0]}>{st.name}: {st.cells}</Label>
      {zona && <Label at={[6.6, 2.5, 0]}>Zona pellucida</Label>}
      {!body && <Label at={[0, implant ? 3 + sink + 2 : -4.5, 2]}>Inner cell mass (the embryo)</Label>}
      {!body && <Label at={[-6.8, sink, 1]}>Trophoblast (the placenta)</Label>}
      {implant && <Label at={[7.5, -10.5, 3]}>Endometrium (decidua): glands and capillaries</Label>}
      {stage === 'implanted' && <Label at={[-8, -5.8, 3]}>Syncytiotrophoblast invades, makes hCG</Label>}
    </group>
  );
}

// ── Placental villi ───────────────────────────────────────────────────────
function VilliScene({ playing }: { playing: boolean }) {
  const d = useMemo(() => {
    const r = rng(9);
    const trees: THREE.Vector3[][] = [];
    const caps: { pts: THREE.Vector3[]; c: string }[] = [];
    for (const x0 of [-6, 0, 6]) {
      const stem = [v3(x0, 7.5, 0), v3(x0 + 0.5, 3, 0.3), v3(x0 - 0.3, -1, 0)];
      trees.push(stem);
      for (let k = 0; k < 6; k++) {
        const s = stem[1]!.clone().lerp(stem[2]!, k / 6);
        const dir = v3(r() - 0.5, -0.6 - r() * 0.5, (r() - 0.5) * 0.8).normalize();
        const b = [s, s.clone().addScaledVector(dir, 2), s.clone().addScaledVector(dir, 3.6).add(v3(r() - 0.5, -0.8, 0))];
        trees.push(b);
        caps.push({ pts: b.map((p) => p.clone().add(v3(0.12, 0, 0.12))), c: '#c03040' }, { pts: b.map((p) => p.clone().add(v3(-0.12, 0, -0.12))), c: '#4060b0' });
      }
    }
    const blood = Array.from({ length: 16 }, (_, i) => { const x = -9 + (i % 8) * 2.4 + r(), z = (r() - 0.5) * 4; return curve([v3(x, -7.5, z), v3(x + r() - 0.5, -3, z + 1), v3(x + 1.5 * (r() - 0.5), 2, z), v3(x + 2, -1, z - 1), v3(x + 3, -7.5, z)]); });
    const oxygen = trees.slice(1).map((b) => curve([b[2]!.clone().add(v3(1.2, -0.6, 0.6)), b[2]!.clone().lerp(b[1]!, 0.3), b[1]!, b[0]!]));
    return { trees, caps, blood, oxygen };
  }, []);
  return (
    <group>
      <mesh position={[0, 8.4, 0]} renderOrder={2} raycast={() => null}><boxGeometry args={[22, 1.6, 8]} /><meshStandardMaterial color="#b45468" roughness={0.3} /></mesh>
      <mesh position={[0, -8.4, 0]} renderOrder={2} raycast={() => null}><boxGeometry args={[22, 1.6, 8]} /><meshStandardMaterial color="#7a1e2c" roughness={0.55} /></mesh>
      {d.trees.map((t, i) => <Tube key={i} points={t} radius={i % 7 === 0 ? 0.75 : 0.5} colour="#d48a90" />)}
      {d.caps.map((c, i) => <Tube key={`c${i}`} points={c.pts} radius={0.1} colour={c.c} emissive={0.3} />)}
      {[-7, 1, 7].map((x) => <Tube key={`s${x}`} points={[v3(x, -11, 0), v3(x + 0.6, -9.5, 0), v3(x, -7.6, 0)]} radius={0.5} colour="#c02030" />)}
      <Particles curves={d.blood} colour="#e03040" radius={0.22} speed={0.06} playing={playing} perCurve={9} />
      <Particles curves={d.oxygen} colour="#ffffff" radius={0.13} speed={0.12} playing={playing} perCurve={4} />
      <Label at={[0, 10.3, 0]}>Chorionic plate (fetal side), umbilical vessels above</Label>
      <Label at={[-9.8, 3, 1]}>Villus: syncytiotrophoblast over fetal capillaries</Label>
      <Label at={[9.5, 0, 2]}>Intervillous space: the mother’s blood</Label>
      <Label at={[0, -1.5, 4]}>Oxygen and glucose into the villi; CO₂ and urea out</Label>
      <Label at={[0, -10.4, 1]}>Basal plate and spiral arteries (maternal side)</Label>
    </group>
  );
}

// ── A seminiferous tubule in cross-section ────────────────────────────────
function TubuleScene({ playing }: { playing: boolean }) {
  const d = useMemo(() => {
    const r = rng(13);
    const ring = (n: number, R: number, s: number, c: string, jitter = 0.3) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + r() * 0.1; const rr = R + (r() - 0.5) * jitter; return { p: v3(Math.cos(a) * rr, Math.sin(a) * rr, (r() - 0.5) * 0.6), s, c }; });
    const sertoli = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return { p: v3(Math.cos(a) * 5.6, Math.sin(a) * 5.6, -0.5), s: [0.7, 4.6, 0.7] as [number, number, number], c: '#e8e0d4', q: new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), v3(Math.cos(a), Math.sin(a), 0)) }; });
    const tails = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return curve([v3(Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0), v3(Math.cos(a + 0.2) * 2.2, Math.sin(a + 0.2) * 2.2, 0.3), v3(Math.cos(a - 0.1) * 0.9, Math.sin(a - 0.1) * 0.9, 0)]); });
    const leydig = [[-9.6, 9.2], [9.8, -8.6], [9.4, 9.6], [-9.8, -9]].flatMap(([x, y]) => Array.from({ length: 9 }, () => ({ p: v3(x! + (r() - 0.5) * 2.6, y! + (r() - 0.5) * 2.6, 0), s: 0.62, c: '#e0a050' })));
    return { gonia: ring(26, 7.4, 0.5, '#7a5a9a'), cytes: ring(22, 6.1, 0.85, '#b088c0', 0.6), tids: ring(34, 4.4, 0.45, '#d8c0e0', 0.5), sertoli, tails, leydig };
  }, []);
  const membrane = useMemo(() => Array.from({ length: 65 }, (_, i) => { const a = (i / 64) * Math.PI * 2; return v3(Math.cos(a) * 8.1, Math.sin(a) * 8.1, 0); }), []);
  return (
    <group>
      <Tube points={membrane} radius={0.22} colour="#c8a888" />
      <Cells items={d.sertoli} geometry={SPHERE} opacity={0.75} />
      <Cells items={d.gonia} geometry={SPHERE} />
      <Cells items={d.cytes} geometry={SPHERE} />
      <Cells items={d.tids} geometry={SPHERE} />
      <Cells items={d.leydig} geometry={BOX} />
      <Particles curves={d.tails} colour="#f4f4ff" radius={0.14} speed={0.05} playing={playing} perCurve={5} />
      {[[-10, 5, 10, 6], [5, -11, 7, 11]].map(([x0, y0, x1, y1], i) => <Tube key={i} points={[v3(x0!, y0!, -1), v3((x0! + x1!) / 2, (y0! + y1!) / 2 + 1.5, -1), v3(x1!, y1!, -1)]} radius={0.3} colour="#c02838" />)}
      <Label at={[0, 9.5, 0]}>Basement membrane and myoid cells</Label>
      <Label at={[-9.8, 0, 0]}>Spermatogonia (2n): mitosis</Label>
      <Label at={[7.6, 4.8, 1]}>Primary spermatocytes: meiosis I</Label>
      <Label at={[5.6, -4.4, 1]}>Spermatids (n): spermiogenesis</Label>
      <Label at={[0, 0.2, 1]}>Lumen: sperm released</Label>
      <Label at={[-6.5, -6.3, 1]}>Sertoli cells: the blood–testis barrier, inhibin B</Label>
      <Label at={[9.5, 11.6, 0]}>Leydig cells: testosterone (under LH)</Label>
    </group>
  );
}

// ── A breast alveolus ─────────────────────────────────────────────────────
function AlveolusScene({ playing, letDown }: { playing: boolean; letDown: number }) {
  const d = useMemo(() => {
    const r = rng(17);
    const cells = backHalf(420, 5.8).map((p) => ({ p, s: [0.62, 0.42, 0.62] as [number, number, number], c: '#f0d4c2', q: new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), p.clone().normalize()) }));
    const drops = Array.from({ length: 40 }, () => ({ p: v3((r() - 0.5) * 7, (r() - 0.5) * 7, -r() * 3.5), s: 0.25 + r() * 0.3, c: '#fffaf0' }));
    const bands = [0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI; return Array.from({ length: 14 }, (_, j) => { const b = (j / 13) * Math.PI; return v3(Math.cos(a) * Math.sin(b) * 6.6, Math.cos(b) * 6.6, -Math.abs(Math.sin(a) * Math.sin(b)) * 6.6); }); });
    const out = [curve([v3(0, 1, -1), v3(0, 5, -0.5), v3(0.5, 9, 0), v3(1, 12, 0)])];
    return { cells, drops, bands, out };
  }, []);
  const g = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => { if (playing) t.current += dt; const k = 1 - 0.05 * letDown * (0.5 + 0.5 * Math.sin(t.current * 2)); g.current?.scale.setScalar(k); });
  return (
    <group>
      <group ref={g}>
        <Cells items={d.cells} geometry={SPHERE} />
        {d.bands.map((b, i) => <Tube key={i} points={b} radius={0.16} colour="#c86a6a" emissive={0.25 * letDown} />)}
      </group>
      <Cells items={d.drops} geometry={SPHERE} />
      <Tube points={[v3(0, 5.6, -0.5), v3(0.5, 9, 0), v3(1, 12, 0)]} radius={1} colour="#f0e2d6" opacity={0.6} />
      {letDown > 0 && <Particles curves={d.out} colour="#fffaf0" radius={0.35} speed={0.3} playing={playing} perCurve={10} />}
      {[-1, 1].map((s) => <Tube key={s} points={[v3(s * 8.5, -6, -2), v3(s * 7.6, 0, -3), v3(s * 8.5, 6, -2)]} radius={0.3} colour="#c02838" />)}
      <Label at={[0, -7.6, 0]}>Secretory cells: make milk under prolactin</Label>
      <Label at={[-9.2, 3, 0]}>Myoepithelial cells: contract under oxytocin (let-down)</Label>
      <Label at={[0, 0, 1.5]}>Lumen: milk (fat droplets, proteins, lactose, IgA)</Label>
      <Label at={[4.5, 11, 0]}>To the lactiferous duct and nipple</Label>
    </group>
  );
}

/** The close-up in its frame: magnified scenes scaled to the frame's radius. */
export function CloseUps({ def, which, playing, reducedMotion, fertDay, letDown }: { def: SimulationDefinition; which: CloseUp; playing: boolean; reducedMotion: boolean; fertDay: number; letDown: number }) {
  const fr = closeUpFrame(def, which);
  const k = fr.radius / 11;
  const play = playing && !reducedMotion;
  return (
    <group position={fr.centre} scale={k}>
      <hemisphereLight args={['#ffffff', '#806060', 0.6]} />
      {which === 'follicle' && <FollicleScene />}
      {which === 'fertilisation' && <FertilisationScene playing={play} />}
      {which === 'embryo' && <EmbryoScene day={fertDay} />}
      {which === 'villi' && <VilliScene playing={play} />}
      {which === 'tubule' && <TubuleScene playing={play} />}
      {which === 'alveolus' && <AlveolusScene playing={play} letDown={letDown} />}
    </group>
  );
}
