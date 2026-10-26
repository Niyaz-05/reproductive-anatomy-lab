import { useEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SimulationDefinition } from '../contract/schema';
import { femaleAnchors, geometryOf, pointAlong, routePath } from '../repro/anchors';
import type { Live } from '../repro/live';

const V = (p: readonly number[]) => new THREE.Vector3(p[0] ?? 0, p[1] ?? 0, p[2] ?? 0);

/**
 * Follicles and the corpus luteum of the cycle model, in the left ovary at their real sizes: a ripe
 * follicle (about 2 cm) bulges from the ovary on the side facing the fimbriae, as a real one does;
 * the rest of the cohort are small spheres inside it (both ovaries).
 */
export function Follicles({ def, f }: { def: SimulationDefinition; f: NonNullable<Live['follicles']> }) {
  const frame = useMemo(() => {
    const g = geometryOf(def);
    const site = V(femaleAnchors()['follicle-left']);
    const make = (id: string) => { const o = g[id]!; return { c: V(o.centroid), axes: (o.axes ?? [[1, 0, 0], [0, 1, 0], [0, 0, 1]]).map(V), ext: (o.extentsMm ?? [20, 10, 8]).map((e) => e / 2000) }; };
    return { left: make('ovary-left'), right: make('ovary-right'), site };
  }, [def]);
  const { left, right, site } = frame;
  const out = site.clone().sub(left.c).normalize();
  const domR = f.dominantMm / 2000, clR = 0.0085 * Math.sqrt(Math.min(1.3, f.corpusLuteum));
  const cohort = (o: typeof left, k: number) => o.c.clone().addScaledVector(o.axes[0]!, o.ext[0]! * 0.55 * Math.cos(k * 1.9)).addScaledVector(o.axes[1]!, o.ext[1]! * 0.45 * Math.sin(k * 2.3)).addScaledVector(o.axes[2]!, o.ext[2]! * 0.3 * Math.cos(k * 3.1));
  const cr = Math.max(0.0008, f.cohortMm / 2000) * 0.8;
  return (
    <group>
      {f.dominantMm > 0.5 && (
        <group position={site.clone().addScaledVector(out, -domR * 0.35)}>
          <mesh renderOrder={4} raycast={() => null}><sphereGeometry args={[domR, 28, 20]} /><meshPhysicalMaterial color="#f3e6c4" roughness={0.15} clearcoat={1} transparent opacity={0.72} depthWrite={false} /></mesh>
          <mesh position={out.clone().multiplyScalar(-domR * 0.55)} renderOrder={5} raycast={() => null}><sphereGeometry args={[Math.max(0.0007, domR * 0.12), 14, 10]} /><meshStandardMaterial color="#fff2d0" emissive="#ffd890" emissiveIntensity={0.5} /></mesh>
        </group>
      )}
      {f.corpusLuteum > 0.02 && (
        <mesh position={site.clone().addScaledVector(out, -clR * 0.4)} renderOrder={4} raycast={() => null}><sphereGeometry args={[clR, 28, 20]} /><meshStandardMaterial color="#e2a628" roughness={0.45} emissive="#b06a10" emissiveIntensity={0.25} /></mesh>
      )}
      {[0, 1, 2, 3, 4].map((k) => <mesh key={`l${k}`} position={cohort(left, k)} renderOrder={4} raycast={() => null}><sphereGeometry args={[cr, 14, 10]} /><meshStandardMaterial color="#f4ecd2" roughness={0.3} transparent opacity={0.8} /></mesh>)}
      {[0, 1, 2, 3, 4].map((k) => <mesh key={`r${k}`} position={cohort(right, k + 7)} renderOrder={4} raycast={() => null}><sphereGeometry args={[cr * 0.9, 14, 10]} /><meshStandardMaterial color="#f4ecd2" roughness={0.3} transparent opacity={0.8} /></mesh>)}
    </group>
  );
}

/** A stylised fetus of length `L` (m), built along +y (head up), curled in the fetal position. */
function useFetusGeometry() {
  return useMemo(() => {
    const parts: { geo: THREE.BufferGeometry; pos: [number, number, number]; scale?: [number, number, number]; rot?: [number, number, number] }[] = [];
    const sphere = new THREE.SphereGeometry(1, 28, 20);
    const limb = (a: THREE.Vector3, b: THREE.Vector3, r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0, 0.02)), b]), 12, r, 10, false);
    // Units: fractions of the fetus's length; the head is set separately (its share falls with age).
    // The back curves (a C): chest, belly and buttocks along an arc, the face towards +z.
    parts.push({ geo: sphere, pos: [0, -0.1, 0.035], scale: [0.14, 0.13, 0.12] }); // neck and chest
    parts.push({ geo: sphere, pos: [0, -0.24, 0.0], scale: [0.16, 0.15, 0.135] }); // chest and belly
    parts.push({ geo: sphere, pos: [0, -0.38, -0.03], scale: [0.15, 0.14, 0.13] }); // abdomen and buttocks
    parts.push({ geo: limb(new THREE.Vector3(0.12, -0.11, 0.05), new THREE.Vector3(0.05, 0.03, 0.16), 0.042), pos: [0, 0, 0] }); // arms folded to the face
    parts.push({ geo: limb(new THREE.Vector3(-0.12, -0.11, 0.05), new THREE.Vector3(-0.05, 0.03, 0.16), 0.042), pos: [0, 0, 0] });
    parts.push({ geo: limb(new THREE.Vector3(0.09, -0.42, 0.02), new THREE.Vector3(0.1, -0.24, 0.2), 0.062), pos: [0, 0, 0] }); // thighs flexed up
    parts.push({ geo: limb(new THREE.Vector3(-0.09, -0.42, 0.02), new THREE.Vector3(-0.1, -0.24, 0.2), 0.062), pos: [0, 0, 0] });
    parts.push({ geo: limb(new THREE.Vector3(0.1, -0.24, 0.2), new THREE.Vector3(0.05, -0.5, 0.17), 0.05), pos: [0, 0, 0] }); // shins folded down
    parts.push({ geo: limb(new THREE.Vector3(-0.1, -0.24, 0.2), new THREE.Vector3(-0.05, -0.5, 0.17), 0.05), pos: [0, 0, 0] });
    return { sphere, parts };
  }, []);
}

/**
 * The fetus (an illustration sized by crown–rump length, then crown–heel length) lying head down in
 * the growing uterus, joined to the placenta by its cord; in labour its head follows the birth canal.
 */
export function Fetus({ def, week, fetus, gravid, placentaScale }: { def: SimulationDefinition; week: number; fetus: NonNullable<Live['fetus']>; gravid: number; placentaScale: number }) {
  const { sphere, parts } = useFetusGeometry();
  useEffect(() => () => { sphere.dispose(); parts.forEach((p) => p.geo !== sphere && p.geo.dispose()); }, [sphere, parts]);
  const pf = femaleAnchors().pregnancy;
  const birth = useMemo(() => { try { return routePath(def, ['birth']); } catch { return null; } }, [def]);
  const g = gravid;
  // The placenta's pose, as the model places it: p' = anchor + s (p − term).
  const term = V(pf.termAnchor), offset = V(pf.baseAnchor).lerp(term, g).addScaledVector(term, -placentaScale);
  const L = fetus.lengthM;
  const headR = L * Math.max(0.16, Math.min(0.3, 0.3 - (week - 10) * 0.0045));
  const axis = V(pf.termAxis).normalize();
  // Head towards the lower pole: the body's +y points along −axis.
  let headPos: THREE.Vector3, up: THREE.Vector3;
  if (fetus.birthU !== null && birth) {
    headPos = V(pointAlong(birth, fetus.birthU));
    const back = V(pointAlong(birth, Math.max(0, fetus.birthU - 0.08)));
    up = headPos.clone().sub(back).normalize();
  } else {
    const centre = V(pf.baseCentre).lerp(V(pf.termCentre), g);
    up = axis.clone().negate();
    const halfLen = (pf.termHalfLengthMm / 1000) * Math.max(0.05, g);
    headPos = centre.clone().addScaledVector(up, Math.min(halfLen * 0.55, L * 0.45));
  }
  // The face turned towards the mother's right side (the back of the head to her left and front, as in
  // the commonest lie), so the curled profile shows from the front.
  const face = new THREE.Vector3(-1, 0, -0.25).addScaledVector(up, -new THREE.Vector3(-1, 0, -0.25).dot(up)).normalize();
  const side = new THREE.Vector3().crossVectors(up, face).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, face));
  const skin = week < 12 ? '#d98a82' : '#e8b29c';
  const navel = headPos.clone().addScaledVector(up, -L * 0.33).add(new THREE.Vector3(0, 0, 0.0001));
  const cordEnd = V(pf.cordFreeEnd).multiplyScalar(placentaScale).add(offset);
  const showCord = fetus.birthU === null && placentaScale > 0.08;
  const cord = useMemo(() => {
    if (!showCord) return null;
    const mid = cordEnd.clone().lerp(navel, 0.5).add(new THREE.Vector3(0.01 * L * 10, -0.004, 0.006));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([cordEnd, mid, navel]), 32, Math.max(0.0012, 0.0075 * placentaScale), 10, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCord, cordEnd.x, cordEnd.y, cordEnd.z, navel.x, navel.y, navel.z, L]);
  useEffect(() => () => cord?.dispose(), [cord]);
  if (fetus.born || L < 0.002) return null;
  return (
    <group>
      <group position={headPos} quaternion={q}>
        <mesh renderOrder={3} raycast={() => null} scale={headR}><primitive object={sphere} attach="geometry" /><meshPhysicalMaterial color={skin} roughness={0.45} sheen={0.6} sheenColor="#ffe0d8" clearcoat={0.3} /></mesh>
        <group position={[0, -headR * 0.8, -headR * 0.15]} scale={L}>
          {parts.map((p, i) => (
            <mesh key={i} geometry={p.geo} position={p.pos} scale={p.scale ?? [1, 1, 1]} renderOrder={3} raycast={() => null}>
              <meshPhysicalMaterial color={skin} roughness={0.45} sheen={0.6} sheenColor="#ffe0d8" clearcoat={0.3} />
            </mesh>
          ))}
        </group>
        {week >= 8 && <Html position={[0, headR * 1.8, 0]} center className="closeup-label small-label" pointerEvents="none" zIndexRange={[3, 0]}>Fetus (illustration)</Html>}
      </group>
      {cord && <mesh geometry={cord} renderOrder={3} raycast={() => null}><meshPhysicalMaterial color="#ece0d6" roughness={0.2} clearcoat={1} /></mesh>}
    </group>
  );
}
