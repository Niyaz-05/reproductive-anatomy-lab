/**
 * Fertilisation and the first week (pure): how many sperm pass each barrier, the fertile window, and
 * the embryo's stages and position day by day.
 * - Sperm numbers: of about 250 million ejaculated, about 1 % pass the cervical mucus, some
 *   thousands reach the uterotubal junctions and a few hundred the ampulla (Suarez & Pacey 2006,
 *   Hum Reprod Update 12:23; OpenStax A&P 2e §28.2).
 * - Fertile window: the day-specific probabilities of conception of Wilcox, Weinberg & Baird 1995
 *   (N Engl J Med 333:1517): intercourse 5 days before ovulation to ovulation day.
 * - Survival: sperm up to about 5 days in good mucus; the egg 12–24 hours.
 * - Development: zygote, cleavage (2 cells at about 30 h), 8 cells on day 3, morula on day 4,
 *   blastocyst on day 5, hatching and attachment on days 6–7, implantation complete by days 9–10;
 *   hCG detectable in blood about 9–11 days after fertilisation (Moore, The Developing Human 11th ed.).
 */
export interface Barrier { id: string; where: string; count: number; why: string; route: number }
/** `route`: how far along the sperm route (0 … 1) the barrier sits. */
export const SPERM_BARRIERS: Barrier[] = [
  { id: 'ejaculate', where: 'Vagina (posterior fornix)', count: 250e6, why: 'About 2–5 mL of semen, 15–250 million sperm per mL. The vagina is acidic (pH about 4), which kills many; semen buffers it for a while.', route: 0 },
  { id: 'cervix', where: 'Cervical canal', count: 2.5e6, why: 'Mid-cycle oestradiol makes the cervical mucus thin and stretchy, with channels that guide motile, normally shaped sperm; most others are trapped. Crypts in the cervix store sperm and release them for days.', route: 0.3 },
  { id: 'uterus', where: 'Uterine cavity', count: 1e5, why: 'Uterine contractions carry sperm up within minutes; many are taken up by white cells.', route: 0.55 },
  { id: 'utj', where: 'Uterotubal junction', count: 3000, why: 'A narrow, folded passage into each tube; only half go to the tube with the egg.', route: 0.7 },
  { id: 'ampulla', where: 'Ampulla of the tube', count: 250, why: 'Sperm bind to the tube’s lining in the isthmus, finish capacitation and are released near ovulation. A few hundred reach the egg.', route: 1 },
];

/** Probability of conception from intercourse on a day relative to ovulation (Wilcox et al. 1995). */
export const WILCOX: { day: number; p: number }[] = [
  { day: -6, p: 0 }, { day: -5, p: 0.1 }, { day: -4, p: 0.16 }, { day: -3, p: 0.14 }, { day: -2, p: 0.27 }, { day: -1, p: 0.31 }, { day: 0, p: 0.33 }, { day: 1, p: 0 },
];
export const conceptionChance = (dayFromOvulation: number) => WILCOX.find((w) => w.day === Math.round(dayFromOvulation))?.p ?? 0;

export interface Stage { day: number; id: string; name: string; cells: string; where: number; text: string }
/**
 * The embryo by day after fertilisation. `where`: position along the embryo route from the ampulla
 * (0) through the isthmus to the implantation site (1).
 */
export const STAGES: Stage[] = [
  { day: 0, id: 'fertilisation', name: 'Fertilisation', cells: '1 cell (zygote)', where: 0, text: 'One sperm passes the corona radiata and zona pellucida (acrosome reaction) and fuses with the egg. The egg finishes meiosis II; the zona hardens so no other sperm enter (cortical reaction). The two pronuclei meet: 46 chromosomes, the sex decided by the sperm’s X or Y.' },
  { day: 1.25, id: 'two-cell', name: 'First cleavage', cells: '2 cells', where: 0.12, text: 'About 30 hours after fertilisation the zygote divides. Cleavage divisions make smaller cells (blastomeres) inside the zona: the embryo does not grow.' },
  { day: 3, id: 'eight-cell', name: 'Eight cells', cells: '8 cells', where: 0.4, text: 'Still in the tube, moved by cilia and muscle. The embryo’s own genes switch on at about this stage.' },
  { day: 4, id: 'morula', name: 'Morula', cells: '16–32 cells', where: 0.72, text: 'A solid ball like a mulberry. It enters the uterus through the uterotubal junction.' },
  { day: 5, id: 'blastocyst', name: 'Blastocyst', cells: 'about 100 cells', where: 0.86, text: 'Fluid gathers into a cavity. The outer cells (trophoblast) will make the placenta; the inner cell mass makes the embryo.' },
  { day: 6.5, id: 'hatching', name: 'Hatching and attachment', cells: 'about 200 cells', where: 0.96, text: 'The blastocyst hatches from the zona and its embryonic pole attaches to the secretory endometrium, usually on the upper back wall of the uterus.' },
  { day: 9, id: 'implanted', name: 'Implanted', cells: 'bilaminar disc', where: 1, text: 'The syncytiotrophoblast invades the endometrium, which turns into decidua, and opens maternal capillaries into lacunae: the start of the placenta. It makes hCG, which keeps the corpus luteum making progesterone.' },
];
export function stageAt(day: number): Stage {
  let s = STAGES[0]!;
  for (const x of STAGES) if (day >= x.day) s = x;
  return s;
}
/** Position (0 … 1) along the embryo route on a day, between the stages’ positions. */
export function embryoWhere(day: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    const a = STAGES[i]!, b = STAGES[i + 1];
    if (day >= a.day) return b ? a.where + ((b.where - a.where) * (day - a.day)) / (b.day - a.day) : a.where;
  }
  return 0;
}
/** Serum hCG (IU/L) on a day after fertilisation: detectable from about day 9, doubling every about 2 days. */
export const hcgAfterFertilisation = (day: number) => (day < 8 ? 0 : Math.min(100000, 5 * 2 ** ((day - 8.5) / 2)));
/** Ectopic pregnancy: about 1–2 % of pregnancies, 95 % in the tube, most in the ampulla (RCOG Green-top 21). */
export const ECTOPIC = { share: 0.011, tubalShare: 0.95, ampullaShareOfTubal: 0.7 };
