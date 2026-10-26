import { describe, expect, it } from 'vitest';
import { CYCLE_REF, cycleAt, simulateCycle } from '../../src/repro/cycle';
import { SPERM_BARRIERS, STAGES, WILCOX, conceptionChance, embryoWhere, hcgAfterFertilisation, stageAt } from '../../src/repro/fertilisation';
import { crownRumpMm, fetalWeightG, fundalHeightCm, placentaDiameterCm, pregnancyHormones, uterusGrowth, maternalChanges, placentalProgesteroneShare } from '../../src/repro/pregnancy';
import { LABOUR_END_H, contractionTrace, dilationAt, labourAt, lactationAt } from '../../src/repro/labour';
import { MALE_REF, SPERM_STAGES, WHO_2021, readSemen, semenDiagnosis, spermScenario } from '../../src/repro/spermatogenesis';
import { METHODS, methodById, pct } from '../../src/repro/contraception';
import { DISORDERS, readAmh, readFshLh, readHcg, readProgesterone, readPsa } from '../../src/repro/disorders';

const max = (xs: number[]) => Math.max(...xs);

describe('menstrual cycle', () => {
  const r = simulateCycle({ scenario: 'normal', lengthDays: 28 });
  it('has its LH surge on day 12–14 and ovulates about 36 hours later', () => {
    expect(r.surgeDay!).toBeGreaterThanOrEqual(12);
    expect(r.surgeDay!).toBeLessThanOrEqual(14);
    expect(r.ovulationDay! - r.surgeDay!).toBeCloseTo(1.5, 1);
    expect(r.nextPeriodDay! - 1).toBeCloseTo(28, 0);
  });
  it('rises to textbook peaks: LH surge, oestradiol, luteal progesterone', () => {
    const lhPeak = max(r.points.map((p) => p.lh));
    expect(lhPeak).toBeGreaterThan(CYCLE_REF.lhSurge[0]);
    expect(lhPeak).toBeLessThan(CYCLE_REF.lhSurge[1]);
    const e2Peak = max(r.points.filter((p) => p.day < r.ovulationDay!).map((p) => p.oestradiol));
    expect(e2Peak).toBeGreaterThan(CYCLE_REF.oestradiolPeak[0]);
    expect(cycleAt(r, 21).progesterone).toBeGreaterThan(CYCLE_REF.lutealProgesterone[0]);
    expect(cycleAt(r, 7).progesterone).toBeLessThan(CYCLE_REF.progesterone[1]);
  });
  it('bleeds on days 1–5, thickens the lining to about 10 mm and makes it secretory after ovulation', () => {
    expect(cycleAt(r, 2).bleeding).toBe(true);
    expect(cycleAt(r, 8).bleeding).toBe(false);
    expect(cycleAt(r, 4).endometriumMm).toBeLessThan(4);
    expect(cycleAt(r, 25).endometriumMm).toBeGreaterThan(CYCLE_REF.endometriumLate[0]);
    expect(cycleAt(r, 21).uterine).toBe('secretory');
    expect(cycleAt(r, 10).uterine).toBe('proliferative');
  });
  it('selects one follicle that grows to about 18–24 mm, then a corpus luteum', () => {
    const f = max(r.points.map((p) => p.follicleMm));
    expect(f).toBeGreaterThan(17);
    expect(f).toBeLessThan(25);
    expect(cycleAt(r, 21).corpusLuteum).toBeGreaterThan(0.6);
    expect(cycleAt(r, 7).follicleMm).toBeGreaterThan(9);
  });
  it('keeps the luteal phase about 14 days whatever the cycle length', () => {
    for (const L of [24, 32]) {
      const c = simulateCycle({ scenario: 'normal', lengthDays: L });
      expect(c.ovulationDay!).toBeGreaterThan(L - 15.5);
      expect(c.ovulationDay!).toBeLessThan(L - 12);
    }
  });
  it('the pill removes the surge and ovulation, with a withdrawal bleed in the break', () => {
    const p = simulateCycle({ scenario: 'pill', lengthDays: 28 });
    expect(p.ovulationDay).toBeNull();
    expect(max(p.points.filter((x) => x.day < 22).map((x) => x.lh))).toBeLessThan(10);
    expect(cycleAt(p, 25).bleeding).toBe(true);
    expect(cycleAt(p, 14).fsh).toBeLessThan(3);
  });
  it('PCOS: high LH to FSH and no ovulation', () => {
    const p = simulateCycle({ scenario: 'pcos', lengthDays: 28 });
    expect(p.ovulationDay).toBeNull();
    const d = cycleAt(p, 10);
    expect(d.lh / d.fsh).toBeGreaterThan(2);
  });
  it('pregnancy: hCG rescues the corpus luteum, so progesterone stays high and there is no period', () => {
    const p = simulateCycle({ scenario: 'pregnant', lengthDays: 28 });
    expect(p.nextPeriodDay).toBeNull();
    expect(cycleAt(p, 32).progesterone).toBeGreaterThan(40);
    expect(cycleAt(p, 28).hcg).toBeGreaterThan(10);
  });
});

describe('fertilisation and the first week', () => {
  it('loses sperm at every barrier: about 250 million to a few hundred', () => {
    for (let i = 1; i < SPERM_BARRIERS.length; i++) expect(SPERM_BARRIERS[i]!.count).toBeLessThan(SPERM_BARRIERS[i - 1]!.count);
    expect(SPERM_BARRIERS[0]!.count).toBeGreaterThan(1e8);
    expect(SPERM_BARRIERS[SPERM_BARRIERS.length - 1]!.count).toBeLessThan(1000);
  });
  it('uses the Wilcox day-specific probabilities: highest on the day before and of ovulation, none after', () => {
    expect(conceptionChance(0)).toBeCloseTo(0.33);
    expect(conceptionChance(-1)).toBeCloseTo(0.31);
    expect(conceptionChance(1)).toBe(0);
    expect(conceptionChance(-6)).toBe(0);
    expect(WILCOX.filter((w) => w.p > 0)).toHaveLength(6);
  });
  it('orders the stages and moves the embryo from the ampulla to the uterus', () => {
    for (let i = 1; i < STAGES.length; i++) { expect(STAGES[i]!.day).toBeGreaterThan(STAGES[i - 1]!.day); expect(STAGES[i]!.where).toBeGreaterThanOrEqual(STAGES[i - 1]!.where); }
    expect(stageAt(3.5).id).toBe('eight-cell');
    expect(stageAt(5.2).id).toBe('blastocyst');
    expect(embryoWhere(0)).toBe(0);
    expect(embryoWhere(9)).toBe(1);
    expect(hcgAfterFertilisation(6)).toBe(0);
    expect(hcgAfterFertilisation(14)).toBeGreaterThan(25);
  });
});

describe('pregnancy', () => {
  it('sizes the embryo by Robinson and weighs the fetus by Hadlock', () => {
    expect(crownRumpMm(8)).toBeGreaterThan(12);
    expect(crownRumpMm(8)).toBeLessThan(20);
    expect(crownRumpMm(12)).toBeGreaterThan(45);
    expect(crownRumpMm(12)).toBeLessThan(65);
    expect(fetalWeightG(20)).toBeGreaterThan(280);
    expect(fetalWeightG(20)).toBeLessThan(400);
    expect(fetalWeightG(40)).toBeGreaterThan(3300);
    expect(fetalWeightG(40)).toBeLessThan(3800);
  });
  it('raises the fundus to the umbilicus at 20 weeks and about the week in cm to 36', () => {
    expect(fundalHeightCm(20)).toBeCloseTo(20, 0);
    expect(fundalHeightCm(28)).toBeCloseTo(28, 0);
    expect(fundalHeightCm(40)).toBeLessThan(fundalHeightCm(36));
    expect(uterusGrowth(6)).toBe(0);
    expect(uterusGrowth(36)).toBeCloseTo(1, 1);
    expect(placentaDiameterCm(40)).toBeCloseTo(22, 0);
  });
  it('peaks hCG at 9–11 weeks, shifts progesterone to the placenta and raises the blood volume', () => {
    const peak = [6, 8, 10, 12, 16, 20].map((w) => [w, pregnancyHormones(w).hcg] as const).sort((a, b) => b[1] - a[1])[0]![0];
    expect(peak).toBe(10);
    expect(pregnancyHormones(40).progesterone).toBeGreaterThan(pregnancyHormones(12).progesterone * 3);
    expect(placentalProgesteroneShare(6)).toBe(0);
    expect(placentalProgesteroneShare(10)).toBe(1);
    expect(maternalChanges(34).bloodVolumePct).toBeCloseTo(45, 0);
  });
});

describe('labour and lactation', () => {
  it('opens the cervix slowly to 6 cm, then about a centimetre every half hour to 10', () => {
    expect(dilationAt(0)).toBe(1);
    expect(dilationAt(8.8)).toBeCloseTo(6, 1);
    expect(dilationAt(11.2)).toBeCloseTo(10, 1);
    expect(labourAt(5).stage).toBe('latent');
    expect(labourAt(10).stage).toBe('first');
    expect(labourAt(11.7).stage).toBe('second');
    expect(labourAt(LABOUR_END_H + 0.1).placentaOut).toBe(true);
  });
  it('strengthens contractions and oxytocin as labour goes on (the Ferguson reflex)', () => {
    const early = labourAt(2), late = labourAt(11);
    expect(late.intervalMin).toBeLessThan(early.intervalMin);
    expect(late.peakMmHg).toBeGreaterThan(early.peakMmHg);
    expect(late.montevideo).toBeGreaterThan(200);
    expect(labourAt(11.7).oxytocin).toBeGreaterThan(early.oxytocin);
    expect(Math.max(...contractionTrace(10))).toBeGreaterThan(50);
  });
  it('makes colostrum first and raises prolactin about eightfold with suckling', () => {
    expect(lactationAt(1, false).kind).toMatch(/Colostrum/);
    expect(lactationAt(30, false).milkMlPerDay).toBeGreaterThan(600);
    expect(lactationAt(10, true).prolactin / lactationAt(10, false).prolactin).toBeCloseTo(8);
  });
});

describe('the testis', () => {
  it('keeps healthy hormones and semen within the reference ranges', () => {
    const n = spermScenario('normal');
    expect(n.axis.testosterone).toBeGreaterThan(MALE_REF.testosterone[0]);
    expect(readSemen(n.semen).every((r) => !r.low)).toBe(true);
    expect(semenDiagnosis(n.semen)).toMatch(/Normozoospermia/);
  });
  it('steroids suppress LH and FSH; Klinefelter raises them; vasectomy leaves them alone but blocks the route', () => {
    expect(spermScenario('steroids').axis.lh).toBeLessThan(MALE_REF.lh[0]);
    expect(spermScenario('klinefelter').axis.fsh).toBeGreaterThan(MALE_REF.fsh[1]);
    const v = spermScenario('vasectomy');
    expect(v.axis.lh).toBe(spermScenario('normal').axis.lh);
    expect(v.semen.total).toBe(0);
    expect(v.blockedAt).toBe('deferent-duct');
    expect(semenDiagnosis(v.semen)).toMatch(/Azoospermia/);
    expect(semenDiagnosis(spermScenario('varicocele').semen)).toMatch(/oligo/i);
  });
  it('takes about 64–74 days from spermatogonium to sperm, with meiosis in the middle', () => {
    expect(SPERM_STAGES[0]!.day).toBe(0);
    expect(SPERM_STAGES.find((s) => s.cell.startsWith('Spermatozoon'))!.day).toBeGreaterThanOrEqual(64);
    expect(SPERM_STAGES.find((s) => s.cell.startsWith('Secondary'))!.ploidy).toMatch(/23/);
    expect(WHO_2021.concentration).toBe(16);
  });
});

describe('contraception, disorders and the test reader', () => {
  it('ranks long-acting methods far above barriers and behaviour (typical use)', () => {
    expect(methodById('implant')!.typical[1]).toBeLessThan(1);
    expect(methodById('combined-pill')!.typical[0]).toBe(7);
    expect(methodById('male-condom')!.typical[0]).toBe(13);
    expect(methodById('none')!.typical[0]).toBe(85);
    for (const m of METHODS) expect(m.perfect[0]).toBeLessThanOrEqual(m.typical[1]);
    expect(pct([2, 23])).toBe('2–23 %');
    expect(METHODS.filter((m) => m.cycle === 'pill').map((m) => m.id)).toContain('combined-pill');
  });
  it('reads the fertility and pregnancy tests at their published thresholds', () => {
    expect(readProgesterone(35).level).toBe('ok');
    expect(readProgesterone(10).level).toBe('warn');
    expect(readHcg(2).text).toMatch(/Negative/);
    expect(readHcg(3000).text).toMatch(/ultrasound/);
    expect(readAmh(4).text).toMatch(/Low/);
    expect(readAmh(30).text).toMatch(/High/);
    expect(readFshLh(45, 30, 'female').text).toMatch(/menopause/);
    expect(readFshLh(5, 14, 'female').text).toMatch(/PCOS/);
    expect(readFshLh(30, 20, 'male').text).toMatch(/testicular failure/);
    expect(readPsa(3.5, 60).level).toBe('warn');
    expect(readPsa(3.5, 72).level).toBe('ok');
  });
  it('gives every disorder organs, signs, tests and treatment', () => {
    for (const d of DISORDERS) {
      expect(d.organs.length).toBeGreaterThan(0);
      for (const k of ['what', 'signs', 'tests', 'treatment'] as const) expect(d[k].length).toBeGreaterThan(30);
    }
  });
});
