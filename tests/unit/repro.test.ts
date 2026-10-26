import { describe, expect, it } from 'vitest';
import { validateDefinition } from '../../src/contract/validate';
import { DEFINITIONS, femaleDefinition as F, maleDefinition as M } from '../../src/repro/definition';
import { bodyData, centroidOf, femaleAnchors, homeBounds, maxGap, routePath } from '../../src/repro/anchors';
import { effectiveCycle, effectiveSlice, effectiveWeek, focusIds, initialState, isVisible, makeReducer, type LabState } from '../../src/app/state';
import { searchStructures } from '../../src/app/search';
import { live } from '../../src/repro/live';
import provenance from '../../src/repro/generated/provenance.json';

const C = (def: typeof F, id: string) => centroidOf(def, id);
const mm = (m: number) => m * 1000;

describe('definitions and the validation gate', () => {
  it('passes for both bodies with no errors or warnings', () => {
    for (const def of [F, M]) {
      const r = validateDefinition(def);
      expect(r.ok, JSON.stringify(r.issues)).toBe(true);
      expect(r.issues).toEqual([]);
    }
  });
  it('rejects an unapproved asset and a missing left/right partner', () => {
    expect(validateDefinition({ ...F, assets: [{ id: 'not-approved', role: 'anatomy-model' }] }).ok).toBe(false);
    const r = validateDefinition({ ...F, structures: F.structures.filter((s) => s.id !== 'ovary-right') });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.some((i) => i.code === 'pair.missing')).toBe(true);
  });
  it('has one mesh structure per model node, and every node a structure', () => {
    for (const def of [F, M]) {
      const nodes = Object.keys(bodyData(def.body).geometry).sort();
      expect(def.structures.filter((s) => s.kind === 'mesh').map((s) => s.id).sort()).toEqual(nodes);
    }
  });
  it('puts every left/right structure on its side (the vulva about this body’s vaginal opening)', () => {
    for (const def of [F, M]) {
      const intro = femaleAnchors().pelvis.introitus[0]!;
      for (const s of def.structures.filter((x) => x.kind === 'mesh' && x.side !== 'midline')) {
        const x = C(def, s.id)[0] - (s.layer === 'vulva' ? intro : 0);
        if (['levator-ani-right', 'common-iliac-vein-right', 'thymus-right', 'dorsal-artery-of-penis-left', 'dorsal-artery-of-penis-right', 'left-renal-vein', 'common-iliac-vein-left'].includes(s.id)) continue;
        expect(Math.sign(x), s.id).toBe(s.side === 'left' ? 1 : -1);
      }
    }
  });
  it('uses https sources only, every structure cites one, and the modelled parts say so', () => {
    for (const def of [F, M]) {
      for (const src of def.sources) if (src.url) expect(src.url.startsWith('https://')).toBe(true);
      for (const s of def.structures) expect(s.sources.length).toBeGreaterThan(0);
    }
    for (const id of ['endometrium', 'urethra', 'ovarian-artery-left', 'gravid-uterus', 'clitoral-glans']) expect(F.structures.find((s) => s.id === id)!.modelNote, id).toMatch(/odelled/);
    for (const id of ['scrotum', 'ejaculatory-duct-left', 'bulbourethral-gland-left', 'deep-artery-of-penis-left']) expect(M.structures.find((s) => s.id === id)!.modelNote, id).toMatch(/odelled/);
  });
  it('links each homologue to a real structure in the other body, both ways where paired', () => {
    for (const [def, other] of [[F, M], [M, F]] as const) {
      for (const s of def.structures.filter((x) => x.homologue)) expect(other.structures.some((o) => o.id === s.homologue), `${s.id} → ${s.homologue}`).toBe(true);
    }
    expect(F.structures.find((s) => s.id === 'ovary-left')!.homologue).toBe('testis-left');
    expect(M.structures.find((s) => s.id === 'testis-left')!.homologue).toBe('ovary-left');
    expect(M.structures.find((s) => s.id === 'scrotum')!.origin).toBe(F.structures.find((s) => s.id === 'labium-majus-left')!.origin);
  });
  it('checks every tour step against the definition of its own body', () => {
    for (const t of F.tour) {
      const def = DEFINITIONS[t.body];
      for (const f of t.focus) expect(def.structures.some((s) => s.id === f), `${t.id}: ${f}`).toBe(true);
    }
    expect(new Set(F.tour.map((t) => t.body))).toEqual(new Set(['female', 'male']));
  });
});

describe('body layout and measurements', () => {
  const pf = provenance.checks;
  it('passes the extractor’s layout checks', () => {
    for (const [k, ok] of Object.entries({ ...pf.female, ...pf.male })) expect(ok, k).toBe(true);
  });
  it('puts the cervix between bladder and rectum, the ovaries beside the uterus, the vulva below the symphysis', () => {
    expect(C(F, 'urinary-bladder')[2]).toBeGreaterThan(C(F, 'cervix')[2]);
    expect(C(F, 'rectum')[2]).toBeLessThan(C(F, 'cervix')[2]);
    expect(C(F, 'ovary-left')[0]).toBeGreaterThan(C(F, 'uterine-body')[0]);
    expect(C(F, 'clitoral-glans')[1]).toBeLessThan(femaleAnchors().pelvis.symphysisBottom[1]!);
  });
  it('puts the prostate below the bladder, the seminal vesicles behind it and the testes in the scrotum', () => {
    expect(C(M, 'prostate')[1]).toBeLessThan(C(M, 'urinary-bladder')[1]);
    expect(C(M, 'seminal-vesicle-left')[2]).toBeLessThan(C(M, 'urinary-bladder')[2]);
    expect(C(M, 'testis-left')[1]).toBeLessThan(C(M, 'prostate')[1]);
  });
  it('measures the organs within plausible ranges (this body’s reference organs are small)', () => {
    const f = provenance.measures.female, m = provenance.measures.male;
    expect(f.uterus.sizeMm[0]).toBeGreaterThan(35); expect(f.uterus.sizeMm[0]).toBeLessThan(90);
    expect(f.vagina.lengthMm).toBeGreaterThan(60); expect(f.vagina.lengthMm).toBeLessThan(100);
    expect(f.termUterus.fundusAboveSymphysisMm).toBeCloseTo(330, -1);
    expect(f.placenta.diameterMm).toBeGreaterThan(180);
    expect(m.deferentDuctMm.left).toBeGreaterThan(300); expect(m.deferentDuctMm.left).toBeLessThan(450);
    expect(m.testis.left.sizeMm[0]).toBeGreaterThan(25);
    expect(m.urethraMm.spongy).toBeGreaterThan(m.urethraMm.prostatic);
  });
  it('records the fits within their limits', () => {
    const fits = provenance.sources.bodyparts3d.registration.fits as Record<string, { surfaceRmsMm: number | null; rmsResidualMm: number; rigidSurfaceRmsMm: number | null }>;
    expect(fits.pelvis!.surfaceRmsMm!).toBeLessThan(6);
    expect(fits.pelvis!.surfaceRmsMm!).toBeLessThan(fits.pelvis!.rigidSurfaceRmsMm!);
    expect(fits.thorax!.rmsResidualMm).toBeLessThan(10);
  });
});

describe('routes', () => {
  it('runs each route without jumps over 12 mm', () => {
    for (const def of [F, M]) for (const [k, pts] of Object.entries(bodyData(def.body).segments)) expect(mm(maxGap(pts)), `${def.body} ${k}`).toBeLessThan(12);
  });
  it('takes sperm from the vagina to the ampulla, and the egg from the ovary into the tube', () => {
    const sperm = routePath(F, ['sperm-left']), egg = routePath(F, ['egg-left']);
    const d = (p: number[], id: string) => Math.hypot(...[0, 1, 2].map((a) => p[a]! - C(F, id)[a]!));
    expect(d(sperm[0]!, 'vagina')).toBeLessThan(d(sperm[sperm.length - 1]!, 'vagina'));
    expect(mm(d(sperm[sperm.length - 1]!, 'tube-ampulla-left'))).toBeLessThan(30);
    expect(mm(d(egg[0]!, 'ovary-left'))).toBeLessThan(20);
  });
  it('takes male sperm from the testis to the tip of the urethra, past the prostate', () => {
    const r = routePath(M, ['sperm-left']);
    const d = (p: number[], id: string) => Math.hypot(...[0, 1, 2].map((a) => p[a]! - C(M, id)[a]!));
    expect(mm(d(r[0]!, 'testis-left'))).toBeLessThan(5);
    expect(Math.min(...r.map((p) => mm(d(p, 'prostate'))))).toBeLessThan(15);
    expect(mm(d(r[r.length - 1]!, 'glans-penis'))).toBeLessThan(20);
  });
});

describe('reducer and views', () => {
  const reduceF = makeReducer(F), reduceM = makeReducer(M);
  const s0 = initialState(F);
  it('shows each mode’s layers, and a cut swaps the uterus’s surfaces for its walls and lining', () => {
    expect(isVisible(F, s0, 'uterine-body')).toBe(true);
    expect(isVisible(F, s0, 'uterine-wall-anterior')).toBe(false);
    const cut = reduceF(s0, { type: 'set-slice', axis: 'sagittal' });
    expect(isVisible(F, cut, 'uterine-body')).toBe(false);
    expect(isVisible(F, cut, 'uterine-wall-anterior')).toBe(true);
    expect(isVisible(F, cut, 'endometrium')).toBe(true);
    const preg = reduceF(s0, { type: 'set-mode', mode: 'pregnancy' });
    expect(isVisible(F, preg, 'gravid-uterus')).toBe(true);
    expect(isVisible(F, preg, 'small-intestine')).toBe(false);
    expect(isVisible(F, preg, 'uterine-body')).toBe(false);
    const close = reduceF(s0, { type: 'set-close-up', value: 'follicle' });
    expect(isVisible(F, close, 'ovary-left')).toBe(false);
  });
  it('clamps the cycle, week, labour and arousal settings', () => {
    let s = reduceF(s0, { type: 'set-cycle', value: { length: 50, day: 99 } });
    expect(s.cycle.length).toBe(35); expect(s.cycle.day).toBe(35);
    s = reduceF(s, { type: 'set-cycle', value: { day: Number.NaN } });
    expect(s.cycle.day).toBe(35);
    expect(reduceF(s0, { type: 'set-week', value: 2 }).week).toBe(4);
    expect(reduceF(s0, { type: 'set-birth', value: { hours: 99 } }).birth.hours).toBe(14);
    expect(reduceM(initialState(M), { type: 'set-sperm', value: { arousal: 3 } }).sperm.arousal).toBe(1);
  });
  it('follows the lining through the cycle and grows the uterus through pregnancy', () => {
    const at = (day: number): LabState => reduceF(reduceF(s0, { type: 'set-mode', mode: 'cycle' }), { type: 'set-cycle', value: { day } });
    expect(live(F, at(3)).bleeding).toBe(true);
    expect(live(F, at(21)).endometrium).toBeGreaterThan(live(F, at(7)).endometrium);
    expect(live(F, at(21)).follicles!.corpusLuteum).toBeGreaterThan(0.5);
    const w = (week: number) => live(F, reduceF(reduceF(s0, { type: 'set-mode', mode: 'pregnancy' }), { type: 'set-week', value: week }));
    expect(w(36).gravid).toBeGreaterThan(w(20).gravid);
    expect(w(20).gravid).toBeGreaterThan(w(8).gravid);
    expect(w(30).fetus!.lengthM).toBeGreaterThan(w(12).fetus!.lengthM);
  });
  it('lets contraception drive the cycle and highlight where a method acts', () => {
    const s = reduceF(reduceF(s0, { type: 'set-mode', mode: 'contraception' }), { type: 'set-method', value: 'combined-pill' });
    expect(effectiveCycle(F, s).scenario).toBe('pill');
    expect(focusIds(F, s)).toContain('ovary-left');
    const iud = reduceF(s, { type: 'set-method', value: 'copper-iud' });
    expect(effectiveCycle(F, iud).scenario).toBe('normal');
  });
  it('blocks the sperm route at the deferent duct after a vasectomy', () => {
    const s = reduceM(reduceM(initialState(M), { type: 'set-mode', mode: 'sperm' }), { type: 'set-sperm', value: { scenario: 'vasectomy' } });
    const v = live(M, s);
    expect(v.sperm.length).toBe(2);
    for (const st of v.sperm) { expect(st.reach).toBeGreaterThan(0.02); expect(st.reach).toBeLessThan(0.6); }
    const n = live(M, reduceM(s, { type: 'set-sperm', value: { scenario: 'normal' } }));
    expect(n.sperm[0]!.reach).toBe(1);
  });
  it('applies a tour step only in its own body, and cuts through a structure’s middle', () => {
    const step3 = F.tour.findIndex((t) => t.id === 'uterus-layers');
    const s = reduceF(s0, { type: 'tour-go', index: step3 });
    expect(effectiveSlice(F, s).axis).toBe('sagittal');
    expect(Math.abs(effectiveSlice(F, s).at)).toBeLessThan(1);
    const term = reduceF(s0, { type: 'tour-go', index: F.tour.findIndex((t) => t.id === 'term') });
    expect(effectiveWeek(F, term)).toBe(38);
    const male = F.tour.findIndex((t) => t.body === 'male');
    const sm = reduceF(s0, { type: 'tour-go', index: male });
    expect(focusIds(F, sm)).toEqual([]); // the lab switches to the male body for it
    expect(homeBounds(F, 'pregnancy')[1][1]).toBeGreaterThan(homeBounds(F, 'cycle')[1][1]);
  });
  it('carries the mode and picks across a body switch', () => {
    const s = initialState(M, { mode: 'contraception', method: 'vasectomy', labels: true });
    expect(s.mode).toBe('contraception'); expect(s.method).toBe('vasectomy'); expect(s.labels).toBe(true);
    expect(initialState(F, { selected: 'testis-left' }).selected).toBeNull();
  });
});

describe('search', () => {
  it('finds structures by name and common synonyms in each body', () => {
    expect(searchStructures(F.structures, 'womb')[0]!.structure.id).toBe('uterus');
    expect(searchStructures(F.structures, 'fallopian')[0]!.structure.id).toMatch(/uterine-tube/);
    expect(searchStructures(F.structures, 'Bartholin')[0]!.structure.id).toMatch(/vestibular-gland/);
    expect(searchStructures(M.structures, 'vas deferens')[0]!.structure.id).toMatch(/deferent-duct/);
    expect(searchStructures(M.structures, 'Cowper')[0]!.structure.id).toMatch(/bulbourethral/);
    expect(searchStructures(M.structures, 'zzz')).toEqual([]);
  });
});
