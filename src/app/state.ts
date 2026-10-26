/**
 * UI and simulation state as a pure reducer (one per body), so every learner action is unit-testable
 * without rendering. The 3D scene only reads this state; it never owns selection or visibility.
 * Switching body remounts the lab with the other body's definition; `LabInit` carries the mode,
 * tour step and picks across.
 */
import type { CloseUp, Mode, SimulationDefinition, SliceAxis, TourStep } from '../contract/schema';
import { CUT_HIDE, CUT_SHOW, MODE_CAMERA, MODE_EXTRA, MODE_HIDE, MODE_LAYERS } from './modes';
import { boundsOfIds, centroidOf, modeBounds, sliceAt } from '../repro/anchors';
import type { CycleScenario } from '../repro/cycle';
import type { SpermScenario } from '../repro/spermatogenesis';
import { methodById } from '../repro/contraception';
import { disorderById } from '../repro/disorders';

export type { Mode } from '../contract/schema';
export type ColourBy = 'real' | 'layer' | 'origin';

export interface Slice {
  axis: SliceAxis;
  /** Position across what the mode shows, -1 … 1. */
  at: number;
  /** Keep the other side of the cut. */
  flip: boolean;
}
export interface CycleSettings { scenario: CycleScenario; length: number; day: number }
export interface FertSettings { day: number; ectopic: boolean }
export interface BirthSettings { hours: number; feeding: boolean }
export interface SpermSettings { scenario: SpermScenario; arousal: number }

export interface LabState {
  mode: Mode;
  selected: string | null;
  hovered: string | null;
  visibleLayers: ReadonlySet<string>;
  isolate: boolean;
  labels: boolean;
  colourBy: ColourBy;
  slice: Slice;
  /** Animations (particles, the cycle and labour clocks) running. */
  playing: boolean;
  closeUp: CloseUp | null;
  cycle: CycleSettings;
  fert: FertSettings;
  week: number;
  birth: BirthSettings;
  sperm: SpermSettings;
  method: string;
  disorder: string | null;
  tourIndex: number;
  /** A camera move the scene should perform; the nonce makes repeat requests distinct. */
  camera: { preset: string; focus: readonly string[]; nonce: number };
}
/** What carries over when the body switches. */
export type LabInit = Partial<Pick<LabState, 'mode' | 'tourIndex' | 'method' | 'disorder' | 'labels' | 'colourBy' | 'selected'>>;

export type LabAction =
  | { type: 'select'; id: string | null }
  | { type: 'hover'; id: string | null }
  | { type: 'toggle-layer'; layer: string }
  | { type: 'set-isolate'; value: boolean }
  | { type: 'set-labels'; value: boolean }
  | { type: 'set-colour-by'; value: ColourBy }
  | { type: 'set-slice'; axis?: SliceAxis; at?: number; flip?: boolean }
  | { type: 'set-mode'; mode: Mode }
  | { type: 'set-playing'; value: boolean }
  | { type: 'set-close-up'; value: CloseUp | null }
  | { type: 'set-cycle'; value: Partial<CycleSettings> }
  | { type: 'set-fert'; value: Partial<FertSettings> }
  | { type: 'set-week'; value: number }
  | { type: 'set-birth'; value: Partial<BirthSettings> }
  | { type: 'set-sperm'; value: Partial<SpermSettings> }
  | { type: 'set-method'; value: string }
  | { type: 'set-disorder'; value: string | null }
  | { type: 'tour-go'; index: number }
  | { type: 'camera'; preset: string; focus?: readonly string[] }
  | { type: 'reset' };

const NO_SLICE: Slice = { axis: 'off', at: 0, flip: false };
export const DEFAULT_CYCLE: CycleSettings = { scenario: 'normal', length: 28, day: 1 };
export const DEFAULT_FERT: FertSettings = { day: 0, ectopic: false };
export const DEFAULT_BIRTH: BirthSettings = { hours: 0, feeding: false };
export const DEFAULT_SPERM: SpermSettings = { scenario: 'normal', arousal: 0 };

export function initialState(def: SimulationDefinition, init: LabInit = {}): LabState {
  const fresh: LabState = {
    mode: 'explore',
    selected: null,
    hovered: null,
    visibleLayers: new Set(def.layers.filter((l) => l.visibleByDefault).map((l) => l.id)),
    isolate: false,
    labels: false,
    colourBy: 'real',
    slice: NO_SLICE,
    playing: true,
    closeUp: null,
    cycle: DEFAULT_CYCLE,
    fert: DEFAULT_FERT,
    week: 12,
    birth: DEFAULT_BIRTH,
    sperm: DEFAULT_SPERM,
    method: def.body === 'male' ? 'male-condom' : 'combined-pill',
    disorder: null,
    tourIndex: 0,
    camera: { preset: def.defaultCamera, focus: [], nonce: 0 },
  };
  const s = { ...fresh, ...init };
  if (s.selected && !def.structures.some((x) => x.id === s.selected)) s.selected = null;
  const step = s.mode === 'tour' ? def.tour[s.tourIndex] : undefined;
  const preset = step?.camera ?? MODE_CAMERA[step?.mode ?? s.mode] ?? def.defaultCamera;
  return { ...s, camera: { preset, focus: step && step.frame !== 'mode' && !step.closeUp ? step.focus : s.selected ? [s.selected] : [], nonce: 1 } };
}

/** Ids that a selection or tour step highlights: a group stands for its members. */
export function highlightedIds(def: SimulationDefinition, ids: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const id of ids) {
    const s = def.structures.find((x) => x.id === id);
    if (!s) continue;
    if (s.kind === 'group') s.members?.forEach((m) => out.add(m));
    else out.add(id);
  }
  return out;
}

export const currentStep = (def: SimulationDefinition, state: LabState): TourStep | undefined => (state.mode === 'tour' ? def.tour[state.tourIndex] : undefined);
/** The step only applies when it is for this body (otherwise the lab is about to switch). */
const step = (def: SimulationDefinition, state: LabState) => { const s = currentStep(def, state); return s && s.body === def.body ? s : undefined; };

/** The mode in effect: in a tour, the step's (Anatomy if it names none). */
export function effectiveMode(def: SimulationDefinition, state: LabState): Exclude<Mode, 'tour'> {
  if (state.mode === 'tour') return step(def, state)?.mode ?? 'explore';
  return state.mode;
}
export function effectiveMethod(def: SimulationDefinition, state: LabState): string {
  return step(def, state)?.method ?? state.method;
}
export function effectiveDisorder(def: SimulationDefinition, state: LabState): string | null {
  const s = step(def, state);
  if (s) return s.disorder ?? null;
  return state.disorder;
}
/** The cycle in effect: the tour step's day, the contraceptive method's effect, or the learner's. */
export function effectiveCycle(def: SimulationDefinition, state: LabState): CycleSettings {
  const s = step(def, state);
  const mode = effectiveMode(def, state);
  const base = s ? { scenario: s.cycle ?? 'normal', length: 28, day: s.day ?? 14 } : state.cycle;
  if (mode === 'contraception') return { ...base, scenario: methodById(effectiveMethod(def, state))?.cycle ?? 'normal', length: 28 };
  if (mode === 'disorders') { const d = disorderById(effectiveDisorder(def, state) ?? ''); if (d?.cycle) return { ...base, scenario: d.cycle, length: 28 }; }
  return base;
}
export function effectiveFert(def: SimulationDefinition, state: LabState): FertSettings {
  const s = step(def, state);
  return s ? { day: s.fertDay ?? 0, ectopic: !!s.ectopic } : state.fert;
}
export function effectiveWeek(def: SimulationDefinition, state: LabState): number {
  const s = step(def, state);
  if (effectiveMode(def, state) === 'birth') return 40;
  return s?.week ?? state.week;
}
export function effectiveBirth(def: SimulationDefinition, state: LabState): BirthSettings {
  const s = step(def, state);
  return s ? { hours: s.labourH ?? 0, feeding: !!s.feeding } : state.birth;
}
export function effectiveSperm(def: SimulationDefinition, state: LabState): SpermSettings {
  const s = step(def, state);
  if (effectiveMode(def, state) === 'disorders') { const d = disorderById(effectiveDisorder(def, state) ?? ''); if (d?.sperm) return { scenario: d.sperm, arousal: 0 }; }
  return s ? { scenario: s.sperm ?? 'normal', arousal: s.arousal ?? 0 } : state.sperm;
}

/** The structures currently in focus: the selection, a disorder's or method's organs, or the tour step's. */
export function focusIds(def: SimulationDefinition, state: LabState): string[] {
  if (state.mode === 'tour') return [...(step(def, state)?.focus ?? [])];
  if (state.selected) return [state.selected];
  const known = (ids: readonly string[]) => ids.filter((id) => def.structures.some((x) => x.id === id));
  if (state.mode === 'disorders' && state.disorder) { const d = disorderById(state.disorder); return d && d.body === def.body ? known(d.organs) : []; }
  if (state.mode === 'contraception') { const m = methodById(state.method); return m && m.body === def.body ? known(m.actsOn) : []; }
  return [];
}

export function effectiveCloseUp(def: SimulationDefinition, state: LabState): CloseUp | null {
  if (state.mode === 'tour') return step(def, state)?.closeUp ?? null;
  return state.closeUp;
}
/** Whether highlighted structures are tinted: a tour step can turn it off (cut views). */
export function effectiveTint(def: SimulationDefinition, state: LabState): boolean {
  return state.mode === 'tour' ? step(def, state)?.tint !== false : true;
}
export function effectiveColourBy(def: SimulationDefinition, state: LabState): ColourBy {
  if (state.mode === 'tour') return step(def, state)?.colourBy ?? 'real';
  return state.colourBy;
}
const AXES: Record<Exclude<SliceAxis, 'off'>, 0 | 1 | 2> = { sagittal: 0, axial: 1, coronal: 2 };
/** The cut in effect: a tour step's (through the middle of a structure, if it names one); otherwise the learner's. */
export function effectiveSlice(def: SimulationDefinition, state: LabState): Slice {
  if (state.mode === 'tour') {
    const s = step(def, state);
    if (!s?.slice || s.slice.axis === 'off') return NO_SLICE;
    const ax = AXES[s.slice.axis];
    const through = s.slice.through ? (boundsOfIds(def, [s.slice.through]) ? centroidOf(def, s.slice.through)[ax] : null) : null;
    const at = through !== null ? sliceAt(modeBounds(def, s.mode ?? 'explore'), ax, through) : s.slice.at ?? 0;
    return { axis: s.slice.axis, at, flip: false };
  }
  return state.slice;
}

/**
 * Whether a mesh structure is drawn. In Anatomy mode the learner's layers decide; the other modes
 * show their own layers. A highlighted structure is always shown; with isolate on, only those. A
 * magnified close-up hides the body. A cut through the uterus shows its walls and lining instead of
 * its region surfaces.
 */
export function isVisible(def: SimulationDefinition, state: LabState, id: string): boolean {
  const s = def.structures.find((x) => x.id === id);
  if (!s) return false;
  if (effectiveCloseUp(def, state)) return false;
  const mode = effectiveMode(def, state);
  const cut = effectiveSlice(def, state).axis !== 'off' && def.body === 'female';
  const uterusShown = mode === 'explore' ? state.visibleLayers.has('uterus') : (MODE_LAYERS[def.body][mode] ?? []).includes('uterus');
  // The cut shows the uterus's walls and lining instead of its region surfaces.
  const swap = cut && uterusShown;
  if (swap && CUT_HIDE.includes(id)) return false;
  const lit = highlightedIds(def, focusIds(def, state));
  if (lit.has(id)) return true;
  const isolate = state.mode === 'tour' ? !!step(def, state)?.isolate : state.isolate;
  if (isolate && lit.size > 0) return swap && CUT_SHOW.includes(id) && [...lit].some((x) => CUT_HIDE.includes(x) || CUT_SHOW.includes(x));
  if (swap && CUT_SHOW.includes(id)) return true;
  if (mode === 'explore') return state.visibleLayers.has(s.layer);
  if ((MODE_HIDE[def.body][mode] ?? []).includes(id)) return false;
  return (MODE_LAYERS[def.body][mode] ?? []).includes(s.layer) || (MODE_EXTRA[def.body][mode] ?? []).includes(id);
}

/**
 * The camera preset that looks at the cut face. The cut keeps the side below the plane on its axis
 * (x: the patient's right, z: the back, y: the lower part), or the side above it when flipped, so
 * the camera looks from the removed side.
 */
export function facingPreset(slice: Slice): string | null {
  switch (slice.axis) {
    case 'sagittal': return slice.flip ? 'right' : 'left';
    case 'coronal': return slice.flip ? 'posterior' : 'anterior';
    case 'axial': return slice.flip ? 'inferior' : 'superior';
    default: return null;
  }
}
/** What the cut leaves in view, for the panel's hint (+x is the patient's left). */
export function keptHalf(slice: Slice): string | null {
  switch (slice.axis) {
    case 'sagittal': return slice.flip ? 'the left side of the body' : 'the right side of the body';
    case 'coronal': return slice.flip ? 'the front half' : 'the back half';
    case 'axial': return slice.flip ? 'the upper part' : 'the lower part';
    default: return null;
  }
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const finite = (o: Record<string, unknown>) => Object.values(o).every((v) => typeof v !== 'number' || Number.isFinite(v));

export function makeReducer(def: SimulationDefinition) {
  const known = new Set(def.structures.map((s) => s.id));
  const layers = new Set(def.layers.map((l) => l.id));
  const presets = new Set(def.cameraPresets.map((c) => c.id));
  const cam = (state: LabState, preset: string | undefined, focus: readonly string[] = []) =>
    preset && presets.has(preset) ? { preset, focus, nonce: state.camera.nonce + 1 } : state.camera;
  const stepCamera = (state: LabState, index: number) => {
    const s = def.tour[index];
    return s ? cam(state, s.camera ?? MODE_CAMERA[s.mode ?? 'explore'], s.frame === 'mode' || s.closeUp ? [] : s.focus) : state.camera;
  };

  return function reduce(state: LabState, action: LabAction): LabState {
    switch (action.type) {
      case 'select': {
        if (action.id !== null && !known.has(action.id)) return state;
        const selected = action.id === state.selected ? null : action.id;
        return { ...state, selected, isolate: selected ? state.isolate : false, closeUp: selected ? null : state.closeUp };
      }
      case 'hover':
        return action.id === state.hovered || (action.id !== null && !known.has(action.id)) ? state : { ...state, hovered: action.id };
      case 'toggle-layer': {
        if (!layers.has(action.layer)) return state;
        const next = new Set(state.visibleLayers);
        if (next.has(action.layer)) next.delete(action.layer); else next.add(action.layer);
        return { ...state, visibleLayers: next };
      }
      case 'set-isolate':
        return { ...state, isolate: action.value };
      case 'set-labels':
        return { ...state, labels: action.value };
      case 'set-colour-by':
        return action.value === state.colourBy ? state : { ...state, colourBy: action.value };
      case 'set-slice': {
        const at = action.at === undefined || !Number.isFinite(action.at) ? state.slice.at : clamp(action.at, -1, 1);
        const axis = action.axis ?? state.slice.axis;
        const fresh = action.axis !== undefined && action.axis !== state.slice.axis && action.at === undefined;
        const slice = { axis, at: fresh ? 0 : at, flip: action.flip ?? state.slice.flip };
        const turned = axis !== 'off' && (axis !== state.slice.axis || slice.flip !== state.slice.flip);
        return turned ? { ...state, slice, camera: cam(state, facingPreset(slice) ?? undefined) } : { ...state, slice };
      }
      case 'set-mode': {
        if (action.mode === state.mode) return state;
        if (action.mode === 'tour') return { ...state, mode: 'tour', tourIndex: 0, selected: null, isolate: false, playing: true, closeUp: null, camera: stepCamera(state, 0) };
        return { ...state, mode: action.mode, playing: true, selected: null, closeUp: null, slice: state.mode === 'tour' ? NO_SLICE : state.slice, camera: cam(state, MODE_CAMERA[action.mode]) };
      }
      case 'set-playing':
        return { ...state, playing: action.value };
      case 'set-close-up':
        return { ...state, closeUp: action.value, selected: action.value ? null : state.selected, camera: { ...state.camera, focus: [], nonce: state.camera.nonce + 1 } };
      case 'set-cycle': {
        const v = { ...state.cycle, ...action.value };
        if (!finite(v)) return state;
        const length = clamp(Math.round(v.length), 21, 35);
        return { ...state, cycle: { scenario: v.scenario, length, day: clamp(v.day, 1, v.scenario === 'normal' ? length : 35) } };
      }
      case 'set-fert': {
        const v = { ...state.fert, ...action.value };
        if (!finite(v)) return state;
        return { ...state, fert: { day: clamp(v.day, 0, 10), ectopic: v.ectopic } };
      }
      case 'set-week':
        return Number.isFinite(action.value) ? { ...state, week: clamp(Math.round(action.value * 2) / 2, 4, 40) } : state;
      case 'set-birth': {
        const v = { ...state.birth, ...action.value };
        if (!finite(v)) return state;
        return { ...state, birth: { hours: clamp(v.hours, 0, 14), feeding: v.feeding } };
      }
      case 'set-sperm': {
        const v = { ...state.sperm, ...action.value };
        if (!finite(v)) return state;
        return { ...state, sperm: { scenario: v.scenario, arousal: clamp(v.arousal, 0, 1) } };
      }
      case 'set-method': {
        const m = methodById(action.value);
        if (!m) return state;
        const focus = m.body === def.body ? m.actsOn.filter((id) => known.has(id)) : [];
        return { ...state, method: m.id, selected: null, camera: focus.length ? cam(state, MODE_CAMERA.contraception, focus) : state.camera };
      }
      case 'set-disorder': {
        const d = action.value ? disorderById(action.value) : null;
        if (action.value && !d) return state;
        const focus = d && d.body === def.body ? d.organs.filter((id) => known.has(id)) : [];
        return { ...state, disorder: action.value, selected: null, camera: focus.length ? cam(state, 'anterior', focus) : state.camera };
      }
      case 'tour-go': {
        const index = clamp(action.index, 0, def.tour.length - 1);
        if (!def.tour[index]) return state;
        return { ...state, mode: 'tour', tourIndex: index, closeUp: null, camera: stepCamera(state, index) };
      }
      case 'camera':
        if (!presets.has(action.preset)) return state;
        return { ...state, camera: { preset: action.preset, focus: action.focus ?? [], nonce: state.camera.nonce + 1 } };
      case 'reset': {
        const fresh = initialState(def);
        return { ...fresh, camera: { ...fresh.camera, nonce: state.camera.nonce + 1 } };
      }
    }
  };
}
