/**
 * The menstrual cycle as a feedback model (pure). Hourly steps of:
 * - the pituitary: FSH and LH held down by oestradiol, progesterone and inhibins (negative feedback);
 *   a surge of LH (and FSH) once oestradiol has stayed high for about 36 hours with progesterone low
 *   (positive feedback), lasting about 48 hours (Hoff et al. 1983);
 * - the follicles: a cohort grows while FSH is above its threshold; the first to reach about 10 mm is
 *   selected and grows on (about 1.5–2 mm a day) while FSH falls and the others regress; it makes
 *   oestradiol in proportion to its granulosa mass; it ruptures about 36 hours after the surge starts;
 * - the corpus luteum: grows for about a week, making progesterone, oestradiol and inhibin A, and
 *   fails after about 14 days unless hCG from an implanted embryo rescues it;
 * - the endometrium: shed when progesterone falls (menses), thickened by oestradiol (proliferative),
 *   made secretory by progesterone.
 * The dominant follicle's growth rate is set so the cycle has the length asked for (the luteal phase
 * stays about 14 days, as in real cycles). Ranges follow Guyton & Hall (14th ed.) ch. 82 and the
 * Speroff textbook; it is a teaching model, not a fertility predictor.
 */
export type CycleScenario = 'normal' | 'pill' | 'pcos' | 'pregnant';
export interface CycleInput { scenario: CycleScenario; lengthDays: number }
export const CYCLE_NORMAL: CycleInput = { scenario: 'normal', lengthDays: 28 };

export type OvarianPhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'pregnancy' | 'suppressed';
export type UterinePhase = 'menstrual' | 'proliferative' | 'secretory' | 'decidua' | 'thin';
export interface CyclePoint {
  /** Day of the cycle, from 1 (the first day of bleeding). */
  day: number;
  lh: number; fsh: number; oestradiol: number; progesterone: number; inhibinA: number; inhibinB: number; hcg: number;
  /** Diameter of the leading follicle (mm) and of the rest of the cohort. */
  follicleMm: number; cohortMm: number;
  /** Size of the corpus luteum, 0 … 1. */
  corpusLuteum: number;
  /** Total endometrial thickness (both layers, as on ultrasound), mm. */
  endometriumMm: number;
  bleeding: boolean;
  ovarian: OvarianPhase; uterine: UterinePhase;
}
export interface CycleResult {
  points: CyclePoint[];
  /** Days (cycle day, fractional) of the surge onset, ovulation and the next period, or null. */
  surgeDay: number | null; ovulationDay: number | null; nextPeriodDay: number | null;
  lengthDays: number;
}

/** Reference ranges (Guyton & Hall; NICE CKS): follicular phase unless stated. */
export const CYCLE_REF = {
  lh: [2, 10], fsh: [3, 10], oestradiol: [100, 600], progesterone: [0.5, 3],
  lhSurge: [20, 80], oestradiolPeak: [700, 1800], lutealProgesterone: [30, 90], endometriumLate: [8, 16],
} as const;

const SURGE_RISE = 0.6, SURGE_PLATEAU = 0.6, SURGE_FALL = 0.8; // days (about 14, 14 and 20 hours)
function surgeShape(tau: number): number {
  if (tau < 0) return 0;
  if (tau < SURGE_RISE) return tau / SURGE_RISE;
  if (tau < SURGE_RISE + SURGE_PLATEAU) return 1;
  const f = tau - SURGE_RISE - SURGE_PLATEAU;
  return f < SURGE_FALL ? 1 - f / SURGE_FALL : 0;
}

/** One run of the model for a dominant-follicle growth rate (mm/day); `days` simulated from day 1. */
function run(input: CycleInput, growth: number, days: number): CycleResult {
  const dt = 1 / 24;
  const pill = input.scenario === 'pill', pcos = input.scenario === 'pcos', pregnant = input.scenario === 'pregnant';
  // Day 1: the last corpus luteum has just failed, so FSH is rising and the lining is being shed.
  let fsh = 6.5, lh = 4.5, e2 = 110, p4 = 1.2, inhA = 8, inhB = 70, hcg = 0;
  let coh = 4, dom = 0, cl = 0, clAge = -1, endo = 9;
  let highE = 0, surgeAt: number | null = null, ovAt: number | null = null, implantAt: number | null = null, nextPeriod: number | null = null;
  let bleedUntil = 5, rescued = false;
  const points: CyclePoint[] = [];
  for (let k = 0; k <= Math.round(days / dt); k++) {
    const t = k * dt; // days since the start of day 1
    // The pill: 21 active days, then 7 without (Guyton & Hall; FSRH guidance).
    const active = pill && (t % 28) < 21;
    const exoE = active ? 650 : 0, exoP = active ? 22 : 0;
    // ── Pituitary ──
    const effE = e2 + exoE, effP = p4 + exoP;
    const negE = 1 / (1 + (effE / (pcos ? 520 : 330)) ** 2);
    const negP = 1 / (1 + (effP / 20) ** 1.5);
    const negInh = 1 / (1 + inhB / 180 + inhA / 35);
    const fshT = 13 * negE ** 0.85 * negInh * Math.sqrt(negP);
    const lhT = (pcos ? 15 : 9.5) * negE ** (pcos ? 0.15 : 0.35) * negP;
    // Positive feedback: oestradiol high for about 36 hours, with progesterone still low.
    if (surgeAt === null && !pcos && effE > 650 && effP < 4 && exoE === 0) highE += dt; else if (surgeAt === null) highE = Math.max(0, highE - dt);
    if (surgeAt === null && highE >= 1.5) surgeAt = t;
    const s = surgeAt !== null ? surgeShape(t - surgeAt) : 0;
    fsh += (fshT + 13 * s - fsh) * (1 - Math.exp(-dt / 0.35));
    lh += (lhT + 52 * s - lh) * (1 - Math.exp(-dt / 0.08));
    // ── Follicles ──
    if (ovAt === null && !(pregnant && clAge >= 0)) {
      const drive = Math.min(1.5, Math.max(0, (fsh - 4.2) / 3));
      if (dom === 0) {
        coh += (1.6 * drive - (fsh < 3.5 ? 0.3 : 0)) * dt;
        coh = Math.max(2, Math.min(pcos ? 7.5 : 10.5, coh));
        if (coh >= 10 && !pcos) { dom = coh; coh = 8; }
      } else {
        // The dominant follicle has LH receptors and needs little FSH; the others regress.
        if (surgeAt === null) dom += growth * dt;
        coh += (-0.5 + 0.6 * drive) * dt;
        coh = Math.max(3, Math.min(9, coh));
      }
    }
    if (surgeAt !== null && ovAt === null && t - surgeAt >= 1.5) { ovAt = t; dom = 0; cl = 0.05; clAge = 0; coh = 3; }
    // ── Corpus luteum ──
    if (clAge >= 0) {
      clAge += dt;
      if (pregnant && ovAt !== null && implantAt === null && t - ovAt >= 7) implantAt = t;
      if (implantAt !== null) hcg = Math.min(100000, 5 * 2 ** ((t - implantAt) / 2));
      rescued = hcg > 10;
      const grow = Math.min(1, clAge / 7);
      const fail = rescued ? 1 : clAge < 10 ? 1 : Math.max(0, 1 - (clAge - 10) / 4);
      cl = Math.max(0, grow * fail * (rescued ? 1 + Math.min(0.6, hcg / 2000) : 1));
      if (!rescued && clAge > 14.2 && nextPeriod === null) { nextPeriod = t; clAge = -1; bleedUntil = t + 5; }
    }
    // ── Steroids and inhibins ──
    const preOv = surgeAt !== null ? Math.exp(-(t - surgeAt) / 0.9) : 1; // the follicle luteinises after the surge
    const follE = dom > 0 ? 1050 * (dom / 20) ** 3 * preOv : 0;
    const cohE = 55 * (coh / 8) ** 3 * (pcos ? 4 : 1);
    e2 += (40 + follE + cohE + 420 * cl - e2) * (1 - Math.exp(-dt / 0.3));
    p4 += (0.9 + (surgeAt !== null && ovAt === null ? 3 * (t - surgeAt) : 0) + 52 * cl - p4) * (1 - Math.exp(-dt / 0.4));
    inhA += (4 + (dom > 0 ? 25 * (dom / 20) ** 2 : 0) + 55 * cl - inhA) * (1 - Math.exp(-dt / 0.5));
    inhB += (25 + 150 * Math.max(0, coh - 3) / 7 * (pcos ? 1.4 : 1) - inhB) * (1 - Math.exp(-dt / 0.5));
    // ── Endometrium ──
    const bleeding = t < bleedUntil && (!pregnant || ovAt === null);
    if (bleeding) endo += (1.5 - endo) * (1 - Math.exp(-dt / 1.2));
    else if (effP > 8) endo += (Math.min(pregnant && rescued ? 16 : 13.5, endo + 0.25) - endo) * (1 - Math.exp(-dt / 2));
    else endo += Math.max(0, Math.min(11.5, 1.5 + 9.5 * Math.min(1, effE / 700)) - endo) * (1 - Math.exp(-dt / 3.5));
    if (pill && !active && !bleeding && (t % 28) >= 22.5 && (t % 28) < 23) bleedUntil = t + 4; // withdrawal bleed
    // ── Phases ──
    const ovarian: OvarianPhase = pill ? 'suppressed' : rescued ? 'pregnancy' : bleeding && dom === 0 && cl < 0.05 ? 'menstrual' : surgeAt !== null && ovAt === null ? 'ovulation' : clAge >= 0 ? 'luteal' : 'follicular';
    const uterine: UterinePhase = bleeding ? 'menstrual' : rescued ? 'decidua' : pill ? 'thin' : effP > 8 ? 'secretory' : 'proliferative';
    if (k % 6 === 0) points.push({ day: 1 + t, lh, fsh, oestradiol: e2, progesterone: p4, inhibinA: inhA, inhibinB: inhB, hcg, follicleMm: dom, cohortMm: coh, corpusLuteum: Math.min(1.6, cl), endometriumMm: endo, bleeding, ovarian, uterine });
  }
  const day = (x: number | null) => (x === null ? null : 1 + x);
  return { points, surgeDay: day(surgeAt), ovulationDay: day(ovAt), nextPeriodDay: day(nextPeriod), lengthDays: nextPeriod !== null ? nextPeriod : input.lengthDays };
}

const memo = new Map<string, CycleResult>();
const growthMemo = new Map<number, number>();
/** The dominant follicle's growth rate (mm/day) that gives a normal cycle of length L (bisection). */
function growthFor(L: number): number {
  const hit = growthMemo.get(L);
  if (hit !== undefined) return hit;
  let lo = 0.4, hi = 5;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const r = run({ scenario: 'normal', lengthDays: L }, mid, L + 10);
    const len = r.nextPeriodDay !== null ? r.nextPeriodDay - 1 : Infinity;
    if (len > L) lo = mid; else hi = mid;
  }
  growthMemo.set(L, (lo + hi) / 2);
  return (lo + hi) / 2;
}
/** The cycle for a scenario and length (21–35 days). The pill shows a 28-day pack; pregnancy and PCOS 35 days. */
export function simulateCycle(input: CycleInput = CYCLE_NORMAL): CycleResult {
  const L = Math.max(21, Math.min(35, Math.round(input.lengthDays)));
  const key = `${input.scenario}:${L}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const shown = input.scenario === 'normal' ? L : input.scenario === 'pill' ? 28 : 35;
  const res = run({ ...input, lengthDays: L }, growthFor(input.scenario === 'normal' ? L : 28), shown);
  memo.set(key, res);
  return res;
}
/** The point nearest a cycle day. */
export function cycleAt(r: CycleResult, day: number): CyclePoint {
  const pts = r.points;
  const i = Math.max(0, Math.min(pts.length - 1, Math.round((day - 1) * 4)));
  return pts[i]!;
}
export const PHASE_TEXT: Record<OvarianPhase, string> = {
  menstrual: 'Menstrual phase', follicular: 'Follicular phase', ovulation: 'Ovulation', luteal: 'Luteal phase', pregnancy: 'Early pregnancy (corpus luteum rescued)', suppressed: 'Ovulation suppressed',
};
export const UTERINE_TEXT: Record<UterinePhase, string> = {
  menstrual: 'Menstruation: the functional layer is shed', proliferative: 'Proliferative: oestradiol rebuilds the lining', secretory: 'Secretory: progesterone readies the lining for an embryo', decidua: 'Decidua: the lining is kept for the pregnancy', thin: 'Thin lining under the pill’s progestogen',
};
