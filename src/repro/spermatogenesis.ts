/**
 * The testis (pure): the male hormone loop, sperm production and the semen it gives.
 * - The loop: GnRH pulses → LH → Leydig cells → testosterone; FSH → Sertoli cells (with testosterone)
 *   → spermatogenesis and inhibin B. Testosterone (and oestradiol made from it) feeds back on LH;
 *   inhibin B on FSH. Steady states for each scenario, with reference ranges from the European
 *   Association of Urology male hypogonadism guideline and Guyton & Hall ch. 81.
 * - Timeline: spermatogonia to spermatozoa in about 64–74 days (Heller & Clermont 1963: mitosis about
 *   16 days, meiosis 24, spermiogenesis 24), then 2–12 days in the epididymis. About 100–200
 *   million sperm are made a day.
 * - Semen: WHO laboratory manual, 6th edition (2021), lower reference limits (5th centiles).
 */
export type SpermScenario = 'normal' | 'steroids' | 'vasectomy' | 'varicocele' | 'klinefelter';
export interface MaleAxis { lh: number; fsh: number; testosterone: number; inhibinB: number; testisMl: number }
export interface Semen { volumeMl: number; concentration: number; total: number; progressivePct: number; totalMotilityPct: number; normalFormsPct: number; vitalityPct: number }
export interface SpermResult { scenario: SpermScenario; axis: MaleAxis; semen: Semen; spermInRoute: number; blockedAt: string | null; text: string }

/** Reference ranges: LH and FSH IU/L, testosterone nmol/L (morning), inhibin B ng/L, testis mL. */
export const MALE_REF = { lh: [1.5, 9], fsh: [1.5, 12], testosterone: [10, 30], inhibinB: [100, 300], testisMl: [15, 25] } as const;
/** WHO 2021 lower reference limits. */
export const WHO_2021 = { volumeMl: 1.4, concentration: 16, total: 39, progressivePct: 30, totalMotilityPct: 42, normalFormsPct: 4, vitalityPct: 54 } as const;

const NORMAL_SEMEN: Semen = { volumeMl: 3, concentration: 64, total: 192, progressivePct: 50, totalMotilityPct: 61, normalFormsPct: 14, vitalityPct: 79 };

export const SPERM_SCENARIOS: { id: SpermScenario; label: string }[] = [
  { id: 'normal', label: 'Healthy' },
  { id: 'steroids', label: 'Anabolic steroids' },
  { id: 'vasectomy', label: 'Vasectomy' },
  { id: 'varicocele', label: 'Varicocele' },
  { id: 'klinefelter', label: 'Klinefelter (47,XXY)' },
];

export function spermScenario(id: SpermScenario): SpermResult {
  switch (id) {
    case 'steroids':
      return {
        scenario: id, axis: { lh: 0.2, fsh: 0.2, testosterone: 45, inhibinB: 20, testisMl: 11 },
        semen: { ...NORMAL_SEMEN, volumeMl: 2.2, concentration: 0.5, total: 1.1, progressivePct: 20, totalMotilityPct: 30, normalFormsPct: 3 }, spermInRoute: 0.02, blockedAt: null,
        text: 'Injected testosterone or other androgens feed back on the hypothalamus and pituitary, so LH and FSH fall almost to nothing. Without LH the Leydig cells stop, and testosterone inside the testis (normally about 100 times the blood level) collapses: spermatogenesis stops and the testes shrink. Recovery after stopping can take a year or more.',
      };
    case 'vasectomy':
      return {
        scenario: id, axis: { lh: 4, fsh: 5, testosterone: 18, inhibinB: 170, testisMl: 20 },
        semen: { ...NORMAL_SEMEN, volumeMl: 2.8, concentration: 0, total: 0, progressivePct: 0, totalMotilityPct: 0, normalFormsPct: 0, vitalityPct: 0 }, spermInRoute: 1, blockedAt: 'deferent-duct',
        text: 'Each deferent duct is cut and sealed in the scrotum. Sperm are still made but cannot pass; they are broken down in the epididymis. The semen volume barely changes (most comes from the seminal vesicles and prostate). Hormones are unchanged. It takes about 3 months (about 20 ejaculations) to clear sperm already beyond the cut; a semen test confirms it (failure about 1 in 2000).',
      };
    case 'varicocele':
      return {
        scenario: id, axis: { lh: 5, fsh: 9, testosterone: 15, inhibinB: 110, testisMl: 16 },
        semen: { ...NORMAL_SEMEN, concentration: 14, total: 40, progressivePct: 24, totalMotilityPct: 35, normalFormsPct: 3 }, spermInRoute: 0.6, blockedAt: null,
        text: 'The pampiniform plexus of the testicular vein is dilated, usually on the left (the left testicular vein drains at a right angle into the left renal vein). Pooled warm blood raises the testis’s temperature, which harms spermatogenesis: lower count and motility, a softer, smaller testis.',
      };
    case 'klinefelter':
      return {
        scenario: id, axis: { lh: 25, fsh: 40, testosterone: 6, inhibinB: 10, testisMl: 3 },
        semen: { ...NORMAL_SEMEN, volumeMl: 1.5, concentration: 0, total: 0, progressivePct: 0, totalMotilityPct: 0, normalFormsPct: 0, vitalityPct: 0 }, spermInRoute: 0, blockedAt: null,
        text: 'An extra X chromosome (about 1 in 600 males). The seminiferous tubules scar and the testes stay small and firm (under 4 mL): no sperm (azoospermia) and low testosterone. With little negative feedback, LH and FSH are high (hypergonadotropic hypogonadism). Sperm can sometimes be retrieved surgically for IVF with ICSI.',
      };
    default:
      return { scenario: 'normal', axis: { lh: 4, fsh: 5, testosterone: 18, inhibinB: 180, testisMl: 20 }, semen: NORMAL_SEMEN, spermInRoute: 1, blockedAt: null, text: 'Pulses of GnRH release LH and FSH. LH makes the Leydig cells between the tubules produce testosterone; FSH and testosterone together let the Sertoli cells support spermatogenesis, and the Sertoli cells release inhibin B, which damps FSH.' };
  }
}

/** Semen results flagged against the WHO 2021 limits. */
export function readSemen(s: Semen): { key: keyof Semen; label: string; value: number; low: boolean; limit: number; unit: string }[] {
  const rows: [keyof Semen, string, string][] = [
    ['volumeMl', 'Volume', 'mL'], ['concentration', 'Concentration', 'million/mL'], ['total', 'Total sperm', 'million'],
    ['progressivePct', 'Progressive motility', '%'], ['totalMotilityPct', 'Total motility', '%'], ['normalFormsPct', 'Normal forms', '%'], ['vitalityPct', 'Vitality', '%'],
  ];
  return rows.map(([key, label, unit]) => ({ key, label, unit, value: s[key], limit: WHO_2021[key], low: s[key] < WHO_2021[key] }));
}
/** Name of the semen picture (WHO terms). */
export function semenDiagnosis(s: Semen): string {
  if (s.total === 0) return 'Azoospermia: no sperm in the ejaculate';
  const oligo = s.concentration < WHO_2021.concentration, astheno = s.progressivePct < WHO_2021.progressivePct, terato = s.normalFormsPct < WHO_2021.normalFormsPct;
  if (!oligo && !astheno && !terato) return 'Normozoospermia: within the WHO reference limits';
  return [oligo ? 'oligo' : '', astheno ? 'astheno' : '', terato ? 'terato' : ''].join('').replace(/^./, (c) => c.toUpperCase()) + 'zoospermia (' + [oligo && 'low count', astheno && 'poor motility', terato && 'few normal forms'].filter(Boolean).join(', ') + ')';
}

export interface SpermStage { day: number; cell: string; ploidy: string; where: string; text: string }
/** Spermatogenesis from a spermatogonium (day 0): about 74 days, then the epididymis. */
export const SPERM_STAGES: SpermStage[] = [
  { day: 0, cell: 'Spermatogonium (type A → B)', ploidy: '46 chromosomes (2n)', where: 'Basal compartment, on the basement membrane', text: 'Stem cells divide by mitosis: some stay stem cells, others commit and divide several more times, joined by bridges of cytoplasm.' },
  { day: 16, cell: 'Primary spermatocyte', ploidy: '2n, DNA copied (4c)', where: 'Moved through the blood–testis barrier into the adluminal compartment', text: 'The tight junctions between Sertoli cells form the blood–testis barrier, which keeps the new, genetically different cells away from the immune system. Meiosis I begins: a long prophase with crossing over.' },
  { day: 38, cell: 'Secondary spermatocyte', ploidy: '23 chromosomes (n, 2c)', where: 'Adluminal compartment', text: 'Meiosis I separates the homologous chromosomes; meiosis II follows within hours.' },
  { day: 40, cell: 'Spermatid', ploidy: 'n, 1c', where: 'Near the lumen, embedded in Sertoli cells', text: 'Four spermatids from each primary spermatocyte. Spermiogenesis begins: the acrosome forms from the Golgi, the nucleus condenses, the tail grows and mitochondria wrap its middle piece.' },
  { day: 64, cell: 'Spermatozoon', ploidy: 'n, 1c', where: 'Released into the lumen (spermiation)', text: 'The Sertoli cells take back the leftover cytoplasm. The sperm cannot yet swim; fluid and peristalsis carry it through the rete testis and efferent ducts.' },
  { day: 74, cell: 'Maturing in the epididymis', ploidy: 'n, 1c', where: 'Head → body → tail of the epididymis (about 6 m of coiled duct)', text: 'Over 2–12 days sperm gain the ability to swim forwards and to bind an egg; the tail of the epididymis stores them. Capacitation in the female tract completes their maturation.' },
];
export const spermStageAt = (day: number) => SPERM_STAGES.filter((s) => s.day <= day).pop() ?? SPERM_STAGES[0]!;

/** Where semen comes from (share of volume, Guyton & Hall). */
export const SEMEN_PARTS = [
  { from: 'Seminal vesicles', share: 0.65, what: 'Fructose (the sperm’s fuel), prostaglandins, fibrinogen (clotting), alkaline fluid' },
  { from: 'Prostate', share: 0.3, what: 'Citrate, zinc, acid phosphatase, PSA (liquefies the clot), slightly acidic' },
  { from: 'Testes and epididymides', share: 0.04, what: 'The sperm themselves' },
  { from: 'Bulbourethral glands', share: 0.01, what: 'Mucus that lubricates and neutralises the urethra before ejaculation' },
];

/**
 * Erection, emission and ejaculation (text and the vessel animation only).
 * `t` 0 … 1: how far the erection has gone (filling of the corpora).
 */
export const AROUSAL_STEPS = [
  { id: 'nerves', title: 'Parasympathetic nerves (S2–S4)', text: 'Cavernous nerves release nitric oxide (NO) in the corpora cavernosa; endothelium adds more.' },
  { id: 'cgmp', title: 'NO → cGMP → smooth muscle relaxes', text: 'NO activates guanylate cyclase; cGMP relaxes the smooth muscle of the helicine arteries and the trabeculae. PDE5 breaks cGMP down; PDE5 inhibitors (sildenafil, tadalafil) slow that and treat erectile dysfunction.' },
  { id: 'fill', title: 'The sinusoids fill', text: 'Blood from the deep arteries fills the cavernous spaces; the expanding corpora press the subtunical veins against the tough tunica albuginea, trapping the blood (veno-occlusion). The corpus spongiosum fills less, so the urethra stays open.' },
  { id: 'emission', title: 'Emission (sympathetic, T10–L2)', text: 'The deferent ducts, seminal vesicles and prostate contract and move sperm and fluids into the prostatic urethra; the internal urethral sphincter closes so semen cannot enter the bladder.' },
  { id: 'expulsion', title: 'Expulsion (somatic, pudendal nerve)', text: 'Rhythmic contractions of the bulbospongiosus and ischiocavernosus muscles expel the semen. Sympathetic activity then constricts the arteries and the erection subsides (detumescence).' },
] as const;
