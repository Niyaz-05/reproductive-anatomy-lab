/**
 * What the simulations show at this moment (pure): which structures glow, the particle streams the 3D
 * view draws along the routes (hormones, blood, sperm, milk), and the shape changes (the endometrium's
 * thickness, the growing uterus and placenta, follicles and corpus luteum, the egg and embryo, the
 * fetus's descent in labour, the filling corpora).
 */
import type { SimulationDefinition } from '../contract/schema';
import type { LabState } from '../app/state';
import { effectiveBirth, effectiveCycle, effectiveDisorder, effectiveFert, effectiveMethod, effectiveMode, effectiveSperm, effectiveWeek, focusIds } from '../app/state';
import { cycleAt, simulateCycle, type CycleResult, type CycleScenario } from './cycle';
import { SPERM_BARRIERS, embryoWhere, stageAt } from './fertilisation';
import { fetusLengthM, placentaDiameterCm, uterusGrowth } from './pregnancy';
import { labourAt, lactationAt } from './labour';
import { spermScenario } from './spermatogenesis';
import { methodById } from './contraception';
import { disorderById } from './disorders';
import { bodyData, hasRoute, routePath, type Vec3 } from './anchors';

export const COLOUR: Record<string, string> = {
  lh: '#6aa0ff', fsh: '#8ac0ff', oestradiol: '#ff7ab8', progesterone: '#f0a040', inhibin: '#b0e070', hcg: '#c070f0', testosterone: '#f08a2a',
  blood: '#e0303a', menses: '#a01828', sperm: '#f4f4ff', semen: '#f0ecd8', milk: '#fffaf0', oxytocin: '#40d0c0', prolactin: '#e0c040', egg: '#ffe9a8',
};

export interface Flow { id: string; label: string; colour: string; paths: string[][]; level: number; size?: number; speed?: number }
export interface SpermStream { route: string; /** How far the sperm can go (0 … 1), e.g. blocked by a vasectomy. */ reach: number; /** Share of sperm left at a point along the route (0 … 1). */ survival: (u: number) => number; level: number }
export interface Live {
  activity: Record<string, number>;
  flows: Flow[];
  sperm: SpermStream[];
  /** Endometrium thickness as the morph weight (0 = 1 mm, 1 = 14 mm), and bleeding. */
  endometrium: number; bleeding: boolean;
  /** The pregnant uterus's growth (morph weight) and the placenta's scale (1 = its term size). */
  gravid: number; placentaScale: number;
  fetus: { lengthM: number; birthU: number | null; born: boolean } | null;
  follicles: { dominantMm: number; cohortMm: number; corpusLuteum: number } | null;
  egg: { route: string; u: number } | null;
  embryo: { route: string; u: number; sizeM: number; label: string } | null;
  /** Filling of the corpora (0 … 1). */
  erection: number;
}

const lvl = (x: number) => Math.max(0, Math.min(2.5, x));
const set = (a: Record<string, number>, ids: readonly string[], v: number) => ids.forEach((id) => { a[id] = Math.max(a[id] ?? 0, v); });
const both = (route: string) => [[`${route}-left`], [`${route}-right`]];
const cycleOf = (c: { scenario: CycleScenario; length: number }): CycleResult => simulateCycle({ scenario: c.scenario, lengthDays: c.length });

/** Share of sperm left along the female route (log-scaled so the thinning stays visible). */
function femaleSurvival(u: number): number {
  let count = SPERM_BARRIERS[0]!.count;
  for (const b of SPERM_BARRIERS) if (u >= b.route) count = b.count;
  return (count / SPERM_BARRIERS[0]!.count) ** 0.2;
}

/** Fraction along a male sperm route of the vasectomy site (the deferent duct above the epididymis). */
function vasectomyAt(def: SimulationDefinition, side: 'left' | 'right'): number {
  const d = bodyData(def.body);
  const pts = routePath(def, [`sperm-${side}`]);
  const epi = d.geometry[`epididymis-${side}`]!;
  const site: Vec3 = [epi.centroid[0]!, epi.bounds[1]![1]! + 0.03, epi.centroid[2]!];
  let best = 0, bd = Infinity;
  pts.forEach((p, i) => { const dd = Math.hypot(p[0]! - site[0], p[1]! - site[1], p[2]! - site[2]); if (dd < bd) { bd = dd; best = i; } });
  return best / Math.max(1, pts.length - 1);
}

export function live(def: SimulationDefinition, state: LabState): Live {
  const mode = effectiveMode(def, state);
  const out: Live = { activity: {}, flows: [], sperm: [], endometrium: 0.6, bleeding: false, gravid: 0, placentaScale: 0, fetus: null, follicles: null, egg: null, embryo: null, erection: 0 };
  const a = out.activity;
  for (const id of focusIds(def, state)) set(a, [id], 0); // focus is tinted, not glowing

  if (def.body === 'female') {
    // The cycle drives the ovary and the lining in every female view outside pregnancy.
    if (mode !== 'pregnancy' && mode !== 'birth') {
      const c = effectiveCycle(def, state);
      const r = cycleOf(c);
      const day = mode === 'fertilisation' ? (r.ovulationDay ?? 14) + 1 + effectiveFert(def, state).day : c.day;
      const p = cycleAt(r, day);
      out.endometrium = Math.max(0, Math.min(1, (p.endometriumMm - 1) / 13));
      out.bleeding = p.bleeding;
      out.follicles = { dominantMm: p.follicleMm, cohortMm: p.cohortMm, corpusLuteum: p.corpusLuteum };
      if (mode === 'cycle' || mode === 'contraception' || (mode === 'disorders' && !!disorderById(effectiveDisorder(def, state) ?? '')?.cycle)) {
        set(a, ['ovary-left'], lvl(p.oestradiol / 500 + p.progesterone / 40));
        set(a, ['ovary-right'], lvl(p.oestradiol / 1500));
        set(a, ['endometrium'], p.bleeding ? 1.2 : lvl(p.progesterone / 40));
        out.flows.push({ id: 'lh', label: 'LH and FSH (from the pituitary)', colour: COLOUR.lh!, paths: both('ovarian-artery'), level: lvl((p.lh + p.fsh) / 14) });
        out.flows.push({ id: 'oestradiol', label: 'Oestradiol', colour: COLOUR.oestradiol!, paths: [['ovarian-vein-left'], ['ovarian-vein-right']], level: lvl(p.oestradiol / 400) });
        out.flows.push({ id: 'progesterone', label: 'Progesterone', colour: COLOUR.progesterone!, paths: [['ovarian-vein-left']], level: lvl(p.progesterone / 25) });
        if (p.bleeding) out.flows.push({ id: 'menses', label: 'Menstrual blood', colour: COLOUR.menses!, paths: [['menses']], level: 1.4, size: 1.3, speed: 0.6 });
      }
    }
    if (mode === 'fertilisation') {
      const f = effectiveFert(def, state);
      const side = 'left';
      if (f.day < 0.3) {
        out.sperm.push({ route: `sperm-${side}`, reach: 1, survival: femaleSurvival, level: 1 });
        out.sperm.push({ route: 'sperm-right', reach: 1, survival: femaleSurvival, level: 0.5 });
        out.egg = { route: `egg-${side}`, u: Math.min(1, 0.6 + f.day * 2) };
      }
      const st = stageAt(f.day);
      const u = f.ectopic ? Math.min(0.05, embryoWhere(f.day)) : embryoWhere(f.day);
      if (f.day >= 0.3 || st.id !== 'fertilisation') out.embryo = { route: `embryo-${side}`, u, sizeM: 0.0006 + 0.0004 * Math.min(1, f.day / 6), label: f.ectopic && f.day > 6 ? 'Ectopic: implanting in the tube' : st.name };
      set(a, [`tube-ampulla-${side}`], f.day < 3 ? 0.9 : 0);
      if (f.day >= 6) set(a, ['endometrium'], f.ectopic ? 0 : 1.2);
      if (f.ectopic && f.day >= 6) set(a, [`tube-ampulla-${side}`], 1.6);
    }
    if (mode === 'pregnancy' || mode === 'birth') {
      const week = effectiveWeek(def, state);
      out.gravid = uterusGrowth(week);
      out.placentaScale = Math.max(0.001, placentaDiameterCm(week) / 22);
      out.fetus = { lengthM: fetusLengthM(week), birthU: null, born: false };
      out.flows.push({ id: 'uterine-blood', label: 'Uterine blood flow', colour: COLOUR.blood!, paths: both('uterine-artery'), level: lvl(0.3 + (week / 40) * 1.5) });
      if (mode === 'birth') {
        const b = effectiveBirth(def, state);
        const l = labourAt(b.hours);
        // The head descends along the birth canal by station (−3 high … +3 crowning, 5 born).
        const birthU = Math.max(0, Math.min(1, (l.station + 3) / 8));
        out.fetus = { lengthM: fetusLengthM(40), birthU: l.station > -2.6 ? birthU : null, born: l.born };
        if (l.born) out.gravid = l.placentaOut ? 0.42 : 0.55; // the uterus contracts down to the umbilicus
        if (l.placentaOut) out.placentaScale = 0;
        set(a, ['gravid-uterus'], lvl(l.peakMmHg / 40));
        set(a, ['cervix'], lvl(l.dilationCm / 6));
        if (b.feeding) {
          // After the birth: no fetus or placenta; the uterus shrinks back into the pelvis over about 6 weeks.
          out.fetus = null; out.placentaScale = 0;
          out.gravid = Math.max(0.02, 0.45 * Math.exp(-b.hours / 6));
          const lac = lactationAt(b.hours, true);
          out.flows = [{ id: 'milk', label: 'Milk', colour: COLOUR.milk!, paths: Array.from({ length: 10 }, (_, k) => [`milk-left-${k}`]).concat(Array.from({ length: 10 }, (_, k) => [`milk-right-${k}`])), level: lvl(lac.letDown * 1.4), size: 0.8, speed: 0.4 }];
          set(a, ['mammary-lobes-left', 'mammary-lobes-right'], 1.2);
          set(a, ['nipple-left', 'nipple-right'], 0.8);
        }
      }
    }
    if (mode === 'contraception') { const m = methodById(effectiveMethod(def, state)); if (m && m.body === 'female') set(a, m.actsOn, 1.1); }
  } else {
    const sp = effectiveSperm(def, state);
    const sc = spermScenario(sp.scenario);
    if (mode === 'sperm' || (mode === 'disorders' && !!disorderById(effectiveDisorder(def, state) ?? '')?.sperm) || mode === 'contraception') {
      const vas = (mode === 'contraception' && effectiveMethod(def, state) === 'vasectomy') || sc.blockedAt === 'deferent-duct';
      for (const side of ['left', 'right'] as const) {
        if (sc.spermInRoute <= 0) continue;
        out.sperm.push({ route: `sperm-${side}`, reach: vas ? vasectomyAt(def, side) : 1, survival: () => Math.sqrt(sc.spermInRoute), level: 1 });
      }
      set(a, ['testis-left', 'testis-right'], lvl(sc.axis.testosterone / 18) * Math.min(1, sc.axis.testisMl / 20));
      if (mode === 'sperm') {
        out.flows.push({ id: 'lh', label: 'LH and FSH (from the pituitary)', colour: COLOUR.lh!, paths: both('testicular-artery'), level: lvl((sc.axis.lh + sc.axis.fsh) / 9) });
        out.flows.push({ id: 'testosterone', label: 'Testosterone', colour: COLOUR.testosterone!, paths: both('testicular-vein'), level: lvl(sc.axis.testosterone / 18) });
      }
      out.erection = mode === 'sperm' ? sp.arousal : 0;
      if (out.erection > 0.02) out.flows.push({ id: 'blood', label: 'Blood into the corpora', colour: COLOUR.blood!, paths: both('penile-artery'), level: lvl(out.erection * 1.6), size: 1.1 });
      if (out.erection > 0.85 && hasRoute(def, 'seminal-left')) out.flows.push({ id: 'semen', label: 'Seminal fluid (emission)', colour: COLOUR.semen!, paths: both('seminal'), level: 1.2, size: 0.9 });
      if (out.erection > 0.02) set(a, ['corpus-cavernosum-left', 'corpus-cavernosum-right'], lvl(out.erection * 1.2));
    }
    if (mode === 'contraception') { const m = methodById(effectiveMethod(def, state)); if (m && m.body === 'male') set(a, m.actsOn, 1.1); }
  }
  if (mode === 'disorders') { const d = disorderById(effectiveDisorder(def, state) ?? ''); if (d && d.body === def.body) set(a, d.organs, 1.2); }
  for (const k of Object.keys(a)) if (a[k] === 0) delete a[k];
  return out;
}
