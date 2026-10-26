/**
 * Pregnancy week by week (pure). Weeks are gestational weeks from the first day of the last period
 * (fertilisation is about 2 weeks later).
 * - Crown–rump length to 14 weeks: Robinson & Fleming 1975 (Br J Obstet Gynaecol 82:702), GA (days)
 *   = 8.052 √CRL(mm) + 23.73. Crown–heel length after that: Haase’s rule (month² cm to 5 months,
 *   then month × 5 cm).
 * - Fetal weight: Hadlock et al. 1991 (Radiology 181:129), ln W(g) = 0.578 + 0.332 GA − 0.00354 GA².
 * - Fundal height: palpable above the symphysis from 12 weeks, at the umbilicus at about 20 weeks,
 *   then about the week number in cm (McDonald’s rule) to 36 weeks at the xiphoid; it then drops as the
 *   head engages (NICE NG201).
 * - Hormones (typical medians): hCG peaks at about 100,000 IU/L at 9–11 weeks then falls to a
 *   plateau of about 20,000; progesterone from the corpus luteum, then the placenta (the
 *   luteo-placental shift at 7–9 weeks), rising to about 500 nmol/L; oestriol and hPL rise with the
 *   placenta (Williams Obstetrics 26th ed.; Guyton & Hall ch. 83).
 */
export const WEEK_MIN = 4, WEEK_MAX = 40;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Crown–rump length (mm), from about 6 to 14 weeks. */
export const crownRumpMm = (week: number) => (week < 6 ? Math.max(0, (week - 5) * 3) : ((week * 7 - 23.73) / 8.052) ** 2);
/** Crown–heel length (cm) by Haase’s rule. */
export function crownHeelCm(week: number): number {
  const month = (week - 2) / 4.33; // months since fertilisation
  return month <= 5 ? month ** 2 : month * 5;
}
/** Estimated fetal weight (g), Hadlock 1991 (from about 10 weeks; smaller before). */
export const fetalWeightG = (week: number) => (week < 10 ? Math.max(1, Math.exp(0.578 + 0.332 * week - 0.00354 * week * week) * ((week - 5) / 5) ** 2) : Math.exp(0.578 + 0.332 * week - 0.00354 * week * week));
/** The fetus’s size in the 3D view: its length (m) from crown to rump before 14 weeks, then crown to heel. */
export const fetusLengthM = (week: number) => (week < 14 ? crownRumpMm(week) / 1000 : (crownHeelCm(week) / 100) * 0.68);

/**
 * Fundal height above the symphysis (cm). `symphysisToXiphoid`: the body’s distance (cm), so 36
 * weeks reaches the xiphoid.
 */
export function fundalHeightCm(week: number, symphysisToXiphoid = 36): number {
  if (week < 12) return Math.max(0, (week - 8) * 0.8);
  if (week < 20) return 3 + ((week - 12) / 8) * 17; // to the umbilicus (about 20 cm)
  if (week <= 36) return 20 + ((week - 20) / 16) * (symphysisToXiphoid - 20);
  return symphysisToXiphoid - ((week - 36) / 4) * 3; // lightening as the head engages
}
/** Where the fundus is, in words. */
export function fundusLandmark(week: number): string {
  if (week < 12) return 'within the pelvis (not palpable)';
  if (week < 16) return 'just above the symphysis';
  if (week < 19) return 'halfway between symphysis and umbilicus';
  if (week < 22) return 'at the umbilicus';
  if (week < 35) return 'between the umbilicus and the xiphoid';
  if (week < 38) return 'at the xiphoid';
  return 'just below the xiphoid (the head has engaged)';
}
/**
 * How far the 3D uterus has grown towards its term shape (the morph weight, 0 … 1), from its length:
 * about 7.5 cm before pregnancy and about 34 cm at term, following the fundal height after 12 weeks.
 */
export function uterusGrowth(week: number): number {
  if (week <= 6) return 0;
  if (week < 12) return ((week - 6) / 6) * 0.12;
  return clamp(0.12 + ((fundalHeightCm(week) - 3) / (fundalHeightCm(36) - 3)) * 0.88, 0, 1);
}
/** Placenta diameter (cm) and thickness (mm), growing to about 22 cm and 25–35 mm at term. */
export const placentaDiameterCm = (week: number) => (week < 8 ? 0 : clamp(22 * ((week - 6) / 34) ** 0.75, 0, 22));
export const placentaThicknessMm = (week: number) => clamp(week, 0, 35);

export interface PregnancyHormones { hcg: number; progesterone: number; oestriol: number; hpl: number; prolactin: number }
/** Typical serum levels: hCG IU/L, progesterone nmol/L, oestriol nmol/L, hPL mg/L, prolactin µg/L. */
export function pregnancyHormones(week: number): PregnancyHormones {
  const w = clamp(week, 0, 42);
  const hcg = w < 4 ? 0 : w <= 10 ? 100000 * Math.exp(-((w - 10) ** 2) / 8) : 20000 + 80000 * Math.exp(-((w - 10) ** 2) / 10);
  const progesterone = w < 4 ? 50 : 50 + 450 * ((w - 4) / 36) ** 1.6;
  const oestriol = w < 8 ? 1 : 2 + 70 * ((w - 8) / 32) ** 2.2;
  const hpl = w < 6 ? 0 : 7 * ((w - 6) / 32) ** 1.3;
  const prolactin = 10 + 190 * (w / 40) ** 1.8;
  return { hcg, progesterone, oestriol, hpl: Math.min(8, hpl), prolactin };
}
/** Who makes the progesterone: the corpus luteum until 7–9 weeks, then the placenta (0 … 1 placental share). */
export const placentalProgesteroneShare = (week: number) => clamp((week - 6) / 4, 0, 1);

export interface Maternal { bloodVolumePct: number; cardiacOutputPct: number; heartRateBpm: number; gfrPct: number; tidalVolumePct: number }
/** Changes from before pregnancy (Williams Obstetrics ch. 4). */
export function maternalChanges(week: number): Maternal {
  const w = clamp(week, 0, 40);
  const ramp = (peakWeek: number) => clamp(w / peakWeek, 0, 1);
  return { bloodVolumePct: 45 * ramp(32), cardiacOutputPct: 40 * ramp(24), heartRateBpm: 15 * ramp(32), gfrPct: 50 * ramp(16), tidalVolumePct: 40 * ramp(36) };
}

export interface Milestone { week: number; text: string }
export const MILESTONES: Milestone[] = [
  { week: 4, text: 'Implantation is complete; hCG makes the test positive around the missed period.' },
  { week: 5, text: 'The neural tube forms; the heart tube starts to beat (about day 22 after fertilisation).' },
  { week: 6, text: 'The heartbeat is seen on ultrasound; limb buds; the embryo is about 5 mm.' },
  { week: 8, text: 'All the major organs have begun to form (organogenesis, weeks 3–8: the most sensitive time for teratogens).' },
  { week: 10, text: 'The embryo becomes a fetus; the placenta takes over progesterone (the luteo-placental shift).' },
  { week: 12, text: 'The uterus rises out of the pelvis; the dating scan measures crown–rump length; nuchal translucency.' },
  { week: 16, text: 'The fetus moves its limbs; sex organs are distinct.' },
  { week: 20, text: 'The anomaly scan; first movements felt (quickening, 18–20 weeks); the fundus at the umbilicus.' },
  { week: 24, text: 'Viability begins with intensive care; surfactant starts to be made.' },
  { week: 28, text: 'The third trimester; eyes open; fat is laid down.' },
  { week: 32, text: 'Most babies lie head down; the mother’s blood volume is nearly 50 % above normal.' },
  { week: 36, text: 'The fundus reaches the xiphoid; the lungs are nearly mature.' },
  { week: 37, text: 'Term (37–42 weeks).' },
  { week: 40, text: 'The expected date of delivery; the head engages and the fundus drops (lightening).' },
];
export const milestoneAt = (week: number) => MILESTONES.filter((m) => m.week <= week).pop() ?? MILESTONES[0]!;
export const trimester = (week: number) => (week < 14 ? 1 : week < 28 ? 2 : 3);

/** What crosses the placenta and how (Guyton & Hall ch. 83; BNF on drugs in pregnancy). */
export const ACROSS: { what: string; crosses: boolean; how: string }[] = [
  { what: 'Oxygen and carbon dioxide', crosses: true, how: 'Diffusion; fetal haemoglobin binds oxygen more tightly than adult haemoglobin.' },
  { what: 'Glucose', crosses: true, how: 'Facilitated diffusion (GLUT1); the fetus uses it as its main fuel.' },
  { what: 'Amino acids, calcium, iron', crosses: true, how: 'Active transport, so fetal levels are higher than the mother’s.' },
  { what: 'IgG antibodies', crosses: true, how: 'Receptor-mediated transcytosis (FcRn), giving the newborn months of passive immunity.' },
  { what: 'Urea and bilirubin', crosses: true, how: 'From fetus to mother, for her kidneys and liver to clear.' },
  { what: 'Alcohol, nicotine, many drugs', crosses: true, how: 'Small, fat-soluble molecules diffuse freely (fetal alcohol spectrum disorder; warfarin, isotretinoin and valproate are teratogens).' },
  { what: 'Some viruses and parasites', crosses: true, how: 'Rubella, CMV, HIV, Zika, Toxoplasma, syphilis (Treponema).' },
  { what: 'IgM, most proteins and insulin', crosses: false, how: 'Too large: the mother’s and fetus’s insulin are separate.' },
  { what: 'Maternal red blood cells', crosses: false, how: 'The two circulations stay separate (except small bleeds at birth, which matter in rhesus disease).' },
  { what: 'Heparin', crosses: false, how: 'Too large and charged, which is why it is the anticoagulant of choice in pregnancy.' },
];
