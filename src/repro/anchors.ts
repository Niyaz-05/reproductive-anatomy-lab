/**
 * Geometry facts written by the extractor, for each body: structure bounds and centroids, the routes
 * (sperm, egg, embryo, milk, hormones, the birth canal), measurements and anchors (the uterine frame,
 * the placenta's term pose, pelvic landmarks). Every function takes the definition, whose body says
 * which model's facts to use.
 */
import femaleJson from './generated/female.json';
import maleJson from './generated/male.json';
import type { Body, CloseUp, Mode, SimulationDefinition } from '../contract/schema';
import { MODE_LAYERS } from '../app/modes';

export type Vec3 = [number, number, number];
export interface G { centroid: number[]; bounds: number[][]; surfaceAnchor?: number[]; axes?: number[][]; extentsMm?: number[]; side: string; layer: string; morph?: string }
interface BodyData { geometry: Record<string, G>; segments: Record<string, number[][]>; offModel: Record<string, string>; measures: Record<string, unknown>; anchors: Record<string, unknown> }

function parse(json: { structures: Record<string, unknown> }): BodyData {
  const raw = json.structures;
  const R = raw.$routes as { segments: Record<string, number[][]>; offModel: Record<string, string> };
  return {
    geometry: Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('$'))) as Record<string, G>,
    segments: R.segments, offModel: R.offModel,
    measures: raw.$measures as Record<string, unknown>, anchors: raw.$anchors as Record<string, unknown>,
  };
}
const DATA: Record<Body, BodyData> = { female: parse(femaleJson), male: parse(maleJson) };
export const bodyData = (body: Body) => DATA[body];
export const geometryOf = (def: SimulationDefinition) => DATA[def.body].geometry;

export const vec = (p: readonly number[]): Vec3 => [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);

/** One continuous path from a list of route segments (each starts where the last ended). */
export function routePath(def: SimulationDefinition, names: readonly string[]): number[][] {
  const out: number[][] = [];
  for (const n of names) {
    const s = DATA[def.body].segments[n];
    if (!s) throw new Error(`unknown route segment "${n}"`);
    const start = out.length && dist(out[out.length - 1]!, s[0]!) < 1e-4 ? 1 : 0;
    out.push(...s.slice(start));
  }
  return out;
}
export const hasRoute = (def: SimulationDefinition, name: string) => !!DATA[def.body].segments[name];
/** The largest jump between consecutive points of a path, in metres. */
export const maxGap = (pts: readonly (readonly number[])[]) => pts.slice(1).reduce((m, p, i) => Math.max(m, dist(p, pts[i]!)), 0);
/** The point a fraction `u` (0 … 1) of the way along a path, by length. */
export function pointAlong(pts: readonly (readonly number[])[], u: number): Vec3 {
  if (pts.length < 2) return vec(pts[0] ?? [0, 0, 0]);
  const lens = pts.slice(1).map((p, i) => dist(p, pts[i]!));
  const total = lens.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i]! || i === lens.length - 1) {
      const t = lens[i]! > 0 ? Math.min(1, left / lens[i]!) : 0, a = pts[i]!, b = pts[i + 1]!;
      return [a[0]! + (b[0]! - a[0]!) * t, a[1]! + (b[1]! - a[1]!) * t, a[2]! + (b[2]! - a[2]!) * t];
    }
    left -= lens[i]!;
  }
  return vec(pts[pts.length - 1]!);
}

/** A point to hang a label on: on the structure's surface, or the middle of a group. */
export function anchorOf(def: SimulationDefinition, id: string): Vec3 | null {
  const g = geometryOf(def)[id];
  if (g) return vec(g.surfaceAnchor ?? g.centroid);
  const s = def.structures.find((x) => x.id === id);
  if (s?.kind === 'group' && s.members) {
    const pts = s.members.map((m) => anchorOf(def, m)).filter((p): p is Vec3 => p !== null);
    if (!pts.length) return null;
    return [0, 1, 2].map((a) => pts.reduce((n, p) => n + p[a]!, 0) / pts.length) as Vec3;
  }
  return null;
}
/** The centroid of a mesh structure (or the middle of a group's members). */
export function centroidOf(def: SimulationDefinition, id: string): Vec3 {
  const g = geometryOf(def)[id];
  if (g) return vec(g.centroid);
  const b = boundsOfIds(def, [id]);
  return b ? [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2, (b[0][2] + b[1][2]) / 2] : [0, 0, 0];
}

/** Axis-aligned bounds of a set of structures (groups expand to their members). */
export function boundsOfIds(def: SimulationDefinition, ids: readonly string[]): [Vec3, Vec3] | null {
  const lo: Vec3 = [Infinity, Infinity, Infinity];
  const hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  const geo = geometryOf(def);
  const visit = (id: string) => {
    const g = geo[id];
    if (g) {
      for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a]!, g.bounds[0]![a]!); hi[a] = Math.max(hi[a]!, g.bounds[1]![a]!); }
      return;
    }
    def.structures.find((x) => x.id === id)?.members?.forEach(visit);
  };
  ids.forEach(visit);
  return Number.isFinite(lo[0]) ? [lo, hi] : null;
}

/** The parts each mode frames by default. */
const HOME: Record<Body, Partial<Record<Mode, readonly string[]>>> = {
  female: {
    explore: ['uterus', 'ovary-left', 'ovary-right', 'uterine-tube-left', 'uterine-tube-right', 'vagina', 'hip-bone-left', 'hip-bone-right', 'labium-majus-left'],
    cycle: ['uterus', 'ovary-left', 'ovary-right', 'uterine-tube-left', 'uterine-tube-right'],
    fertilisation: ['uterus', 'ovary-left', 'ovary-right', 'uterine-tube-left', 'uterine-tube-right', 'vagina'],
    pregnancy: ['gravid-uterus', 'hip-bone-left', 'hip-bone-right', 'sternum'],
    birth: ['gravid-uterus', 'hip-bone-left', 'hip-bone-right', 'vagina'],
    contraception: ['uterus', 'ovary-left', 'ovary-right', 'uterine-tube-left', 'uterine-tube-right', 'vagina'],
    disorders: ['uterus', 'ovary-left', 'ovary-right', 'uterine-tube-left', 'uterine-tube-right', 'vagina', 'hip-bone-left', 'hip-bone-right'],
  },
  male: {
    explore: ['testis-left', 'testis-right', 'prostate', 'urinary-bladder', 'penis', 'seminal-vesicle-left', 'deferent-duct-left', 'deferent-duct-right'],
    sperm: ['testis-left', 'testis-right', 'prostate', 'urinary-bladder', 'penis', 'deferent-duct-left', 'deferent-duct-right'],
    contraception: ['testis-left', 'testis-right', 'prostate', 'urinary-bladder', 'penis', 'deferent-duct-left', 'deferent-duct-right'],
    disorders: ['testis-left', 'testis-right', 'prostate', 'urinary-bladder', 'penis', 'deferent-duct-left'],
  },
};
/** Bounds of the default view for a mode. */
export function homeBounds(def: SimulationDefinition, mode: Mode = 'explore'): [Vec3, Vec3] {
  const ids = HOME[def.body][mode] ?? HOME[def.body].explore!;
  return boundsOfIds(def, ids) ?? [[-0.12, -0.12, -0.1], [0.12, 0.12, 0.1]];
}
/** Bounds of everything shown in a mode (used to place the cut). */
export function modeBounds(def: SimulationDefinition, mode: Mode): [Vec3, Vec3] {
  const layers = mode === 'explore' || mode === 'tour' ? null : MODE_LAYERS[def.body][mode] ?? null;
  const skip = ['neighbours', 'skeleton', 'breasts', 'breast-fat', 'pregnancy'];
  const ids = def.structures.filter((s) => s.kind === 'mesh' && (layers ? layers.includes(s.layer) && !skip.includes(s.layer) : !skip.includes(s.layer))).map((s) => s.id);
  return boundsOfIds(def, ids) ?? homeBounds(def, mode);
}
/** Slice position (−1 … 1 across `bounds` on an axis) for a world coordinate. */
export function sliceAt(bounds: [Vec3, Vec3], axis: 0 | 1 | 2, world: number): number {
  const mid = (bounds[0][axis] + bounds[1][axis]) / 2, half = (bounds[1][axis] - bounds[0][axis]) / 2;
  return half > 0 ? Math.max(-1, Math.min(1, (world - mid) / half)) : 0;
}
/** The world coordinate of a slice position. */
export function sliceWorld(bounds: [Vec3, Vec3], axis: 0 | 1 | 2, at: number): number {
  const mid = (bounds[0][axis] + bounds[1][axis]) / 2, half = (bounds[1][axis] - bounds[0][axis]) / 2;
  return mid + at * half;
}

/** Female anchors written by the extractor. */
export interface UterusFrame { io: number[]; u: number[]; v: number[]; w: number[]; ostiumLeft: number[]; ostiumRight: number[]; cavityLengthMm: number; cavityHalfWidthMm: number }
export interface PregnancyFrame {
  termAnchor: number[]; baseAnchor: number[]; inward: number[]; cordFreeEnd: number[]; termCentre: number[]; termAxis: number[]; termLateral: number[]; termAnterior: number[];
  termHalfLengthMm: number; termRadiiMm: number[]; baseCentre: number[]; cornuShiftLeft: number[]; cornuShiftRight: number[]; fundusTerm: number[]; xiphoid: number[];
}
export interface PelvisFrame { symphysisTop: number[]; symphysisBottom: number[]; promontory: number[]; introitus: number[]; inlet: number[]; midPelvis: number[] }
export const femaleAnchors = () => DATA.female.anchors as { uterus: UterusFrame; pregnancy: PregnancyFrame; pelvis: PelvisFrame; 'follicle-left': number[]; 'follicle-right': number[]; implantation: number[] };
export const maleAnchors = () => DATA.male.anchors as { colliculus: number[]; scrotum: { centre: number[] } };
export const offModelNotes = (def: SimulationDefinition) => DATA[def.body].offModel;

/**
 * Where each magnified close-up sits and how large it is (radius, metres): drawn where its tissue is
 * while the body is hidden.
 */
export function closeUpFrame(def: SimulationDefinition, id: CloseUp): { centre: Vec3; radius: number; magnified: number } {
  const c = (sid: string) => centroidOf(def, sid);
  switch (id) {
    case 'follicle': return { centre: c('ovary-left'), radius: 0.016, magnified: 15 };
    case 'fertilisation': return { centre: c('tube-ampulla-left'), radius: 0.014, magnified: 120 };
    case 'embryo': return { centre: c('uterine-body'), radius: 0.016, magnified: 100 };
    case 'villi': return { centre: def.body === 'female' ? c('placenta-basal-plate') : [0, 0, 0], radius: 0.018, magnified: 60 };
    case 'tubule': return { centre: def.body === 'male' ? c('testis-left') : [0, 0, 0], radius: 0.016, magnified: 120 };
    case 'alveolus': return { centre: def.body === 'female' ? c('mammary-lobes-left') : [0, 0, 0], radius: 0.016, magnified: 150 };
  }
}
/** Close-ups belong to a body. */
export const CLOSE_UP_BODY: Record<CloseUp, Body> = { follicle: 'female', fertilisation: 'female', embryo: 'female', villi: 'female', tubule: 'male', alveolus: 'female' };
