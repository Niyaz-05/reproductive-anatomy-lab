/**
 * Labour and breastfeeding (pure).
 * - Dilation over time: the latent phase (to about 6 cm) is slow and variable; the active phase follows
 *   the median times per centimetre of Zhang et al. 2010 (Obstet Gynecol 116:1281) for a first labour
 *   (5→6 cm 0.8 h, 6→7 0.6 h, 7→8 0.5 h, 8→9 0.5 h, 9→10 0.5 h). Second stage about 1 hour, third
 *   stage (the placenta) under 30 minutes (NICE NG235).
 * - Contractions: every 5–10 minutes early, every 2–3 minutes in active labour, 45–90 s, peaking
 *   25–50 mmHg above a tone of about 10 mmHg; adequate labour above about 200 Montevideo units.
 * - The Ferguson reflex: stretch of the cervix and vagina drives oxytocin release from the posterior
 *   pituitary, which strengthens contractions, which stretch more: positive feedback ended by the birth.
 * - Lactation: prolactin makes milk once progesterone falls at delivery (lactogenesis II about day
 *   2–4); suckling raises prolactin about tenfold and releases oxytocin, which contracts the
 *   myoepithelial cells (the let-down reflex) within about a minute (Guyton & Hall ch. 83).
 */
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Time (h) at each centimetre, from the start of regular contractions: latent then Zhang medians. */
const DILATION: [number, number][] = [[0, 1], [4, 3], [7.5, 5], [8.8, 6], [9.6, 7], [10.2, 8], [10.7, 9], [11.2, 10]];
export const STAGE2_H = 1, STAGE3_H = 0.25;
export const LABOUR_END_H = DILATION[DILATION.length - 1]![0] + STAGE2_H + STAGE3_H;

export type LabourStage = 'latent' | 'first' | 'second' | 'third' | 'after';
export interface LabourState {
  hours: number; stage: LabourStage; dilationCm: number; effacementPct: number;
  /** Fetal head station: −3 (high) to +3 (crowning), 5 at birth. */
  station: number;
  intervalMin: number; durationS: number; peakMmHg: number; montevideo: number;
  /** Oxytocin relative to the start of labour. */
  oxytocin: number; born: boolean; placentaOut: boolean;
}
export function dilationAt(h: number): number {
  if (h <= 0) return 1;
  for (let i = 1; i < DILATION.length; i++) {
    const [t0, d0] = DILATION[i - 1]!, [t1, d1] = DILATION[i]!;
    if (h <= t1) return d0 + ((d1 - d0) * (h - t0)) / (t1 - t0);
  }
  return 10;
}
const FULL = DILATION[DILATION.length - 1]![0];
export function labourAt(hours: number): LabourState {
  const h = clamp(hours, 0, LABOUR_END_H + 1);
  const d = dilationAt(h);
  const stage: LabourStage = h < FULL ? (d < 6 ? 'latent' : 'first') : h < FULL + STAGE2_H ? 'second' : h < LABOUR_END_H ? 'third' : 'after';
  const active = clamp((d - 4) / 6, 0, 1);
  const pushing = stage === 'second' ? 1 : 0;
  const station = stage === 'second' ? -0.5 + 3.5 * ((h - FULL) / STAGE2_H) : stage === 'third' || stage === 'after' ? 5 : -3 + 2.5 * clamp((d - 1) / 9, 0, 1);
  const intervalMin = stage === 'third' || stage === 'after' ? 4 : 8 - 5.8 * active - pushing * 0.4;
  const durationS = 45 + 35 * active + 10 * pushing;
  const peakMmHg = stage === 'after' ? 0 : 28 + 28 * active + 12 * pushing;
  const montevideo = stage === 'after' ? 0 : Math.round((peakMmHg * 10) / intervalMin);
  // Oxytocin rises with stretch of the cervix and vagina (Ferguson reflex), highest as the head is born.
  const oxytocin = 1 + 2.5 * active + 3 * pushing + (stage === 'third' ? 2 : 0);
  return { hours: h, stage, dilationCm: d, effacementPct: clamp(30 + 70 * clamp((d - 1) / 5, 0, 1), 0, 100), station, intervalMin, durationS, peakMmHg, montevideo, oxytocin, born: h >= FULL + STAGE2_H, placentaOut: h >= LABOUR_END_H };
}
/** Uterine pressure (mmHg) over the 30 minutes before `hours`, one sample every 10 seconds. */
export function contractionTrace(hours: number, minutes = 30): number[] {
  const out: number[] = [];
  for (let s = -minutes * 60; s <= 0; s += 10) {
    const t = hours + s / 3600;
    if (t < 0) { out.push(10); continue; }
    const st = labourAt(t);
    const period = st.intervalMin * 60, phase = ((t * 3600) % period) / period;
    const w = st.durationS / period;
    const p = phase < w ? Math.sin((phase / w) * Math.PI) ** 2 : 0;
    out.push(10 + st.peakMmHg * p);
  }
  return out;
}
export const STAGE_TEXT: Record<LabourStage, string> = {
  latent: 'First stage, latent phase: the cervix softens, thins (effaces) and opens to about 6 cm; contractions become regular.',
  first: 'First stage, active phase: the cervix opens about 1 cm an hour or faster to full dilation (10 cm).',
  second: 'Second stage: from full dilation to the birth. The head turns and descends through the pelvis; the mother pushes with the contractions.',
  third: 'Third stage: the uterus contracts down, the placenta separates and is delivered; the muscle fibres clamp the vessels (the “living ligatures”).',
  after: 'After the birth: the uterus stays firmly contracted; oxytocin from suckling keeps it so.',
};

export interface Lactation { day: number; prolactin: number; milkMlPerDay: number; kind: string; letDown: number }
/** Days after the birth; `suckling` true during a feed. Prolactin µg/L. */
export function lactationAt(day: number, suckling: boolean): Lactation {
  const d = clamp(day, 0, 180);
  const base = d < 1 ? 150 : 80 * Math.exp(-d / 40) + 25;
  const prolactin = base * (suckling ? 8 : 1);
  const milkMlPerDay = d < 2 ? 40 + 40 * d : d < 5 ? 120 + 130 * (d - 2) : Math.min(800, 510 + 9 * (d - 5));
  const kind = d < 2.5 ? 'Colostrum: thick and yellow, rich in protein and IgA antibodies' : d < 14 ? 'Transitional milk' : 'Mature milk: foremilk then fat-rich hindmilk';
  return { day: d, prolactin, milkMlPerDay, kind, letDown: suckling ? 1 : 0 };
}
