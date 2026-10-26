import { useEffect, useId, useMemo, useState } from 'react';
import { useLab } from '../app/LabContext';
import { effectiveBirth, effectiveCycle, effectiveDisorder, effectiveFert, effectiveMethod, effectiveSperm, effectiveWeek } from '../app/state';
import { CYCLE_REF, PHASE_TEXT, UTERINE_TEXT, cycleAt, simulateCycle, type CycleScenario } from '../repro/cycle';
import { SPERM_BARRIERS, WILCOX, hcgAfterFertilisation, stageAt } from '../repro/fertilisation';
import { ACROSS, crownRumpMm, crownHeelCm, fetalWeightG, fundalHeightCm, fundusLandmark, maternalChanges, milestoneAt, placentaDiameterCm, placentalProgesteroneShare, pregnancyHormones, trimester } from '../repro/pregnancy';
import { LABOUR_END_H, STAGE_TEXT, contractionTrace, labourAt, lactationAt } from '../repro/labour';
import { AROUSAL_STEPS, MALE_REF, SEMEN_PARTS, SPERM_SCENARIOS, readSemen, semenDiagnosis, spermScenario, spermStageAt, type SpermScenario } from '../repro/spermatogenesis';
import { KIND_LABEL, METHODS, methodById, pct, type Method } from '../repro/contraception';
import { DISORDERS, IVF_STEPS, disorderById, readAmh, readFshLh, readHcg, readProgesterone, readPsa, type Reading } from '../repro/disorders';
import { COLOUR, live } from '../repro/live';
import { Legend, LineChart } from './Chart';

function PlayButton() {
  const { state, dispatch } = useLab();
  return <button type="button" className="secondary" onClick={() => dispatch({ type: 'set-playing', value: !state.playing })} aria-pressed={!state.playing}>{state.playing ? 'Pause' : 'Play'}</button>;
}
function Radios<T extends string | number>({ label, options, value, onChange, disabled }: { label: string; options: readonly { id: T; label: string }[]; value: T; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="seg-toggle wrap" role="radiogroup" aria-label={label}>
      {options.map((o) => <button key={String(o.id)} type="button" role="radio" aria-checked={value === o.id} disabled={disabled} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>
  );
}
function Slider({ label, min, max, step, value, onChange, text, disabled }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; text: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="field slider-field">
      <label htmlFor={id} className="small"><span>{label}</span> <strong>{text}</strong></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} aria-valuetext={text} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
/** Advances a value four times a second while playing. */
function useTicker(on: boolean, tick: () => void) {
  useEffect(() => {
    if (!on) return;
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [on, tick]);
}
const f0 = (x: number) => Math.round(x).toLocaleString('en-GB');
const f1 = (x: number) => x.toFixed(1);
const Flag = ({ v, range }: { v: number; range: readonly [number, number] }) => { const f = v < range[0] ? 'low' : v > range[1] ? 'high' : 'normal'; return <span className={`flag is-${f}`}>{f}</span>; };
function FlowLegend() {
  const { def, state } = useLab();
  const flows = live(def, state).flows;
  return flows.length ? <Legend items={flows.map((f) => ({ label: f.label, colour: f.colour }))} /> : null;
}
function Head({ title, play = true }: { title: string; play?: boolean }) {
  const id = useId();
  return <div className="detail-head"><h2 id={id} className="panel-title">{title}</h2>{play && <PlayButton />}</div>;
}

/** Hormone charts over a cycle, with the day as a cursor. */
function CycleCharts({ scenario, length, day }: { scenario: CycleScenario; length: number; day: number }) {
  const r = simulateCycle({ scenario, lengthDays: length });
  const n = r.points.length, xMax = r.points[n - 1]!.day - 1;
  const marks = [...(r.surgeDay ? [{ at: r.surgeDay - 1, text: 'surge' }] : []), ...(r.ovulationDay ? [{ at: r.ovulationDay - 1, text: 'ovulation' }] : [])];
  const ticks = [0, 7, 14, 21, 28, 35].filter((d) => d <= xMax).map((d) => ({ at: d, text: `day ${d + 1}` }));
  return (
    <>
      <LineChart label={`Pituitary hormones over the cycle: LH peaks at ${f0(Math.max(...r.points.map((p) => p.lh)))} IU/L.`} xMax={xMax} xTicks={ticks} cursor={day - 1} marks={marks}
        series={[{ label: 'LH', colour: COLOUR.lh!, values: r.points.map((p) => p.lh) }, { label: 'FSH', colour: COLOUR.fsh!, values: r.points.map((p) => p.fsh), dashed: true }]}
        yLeft={{ min: 0, max: 70, ticks: [0, 20, 40, 60], unit: 'LH · FSH IU/L' }} height={105} />
      <LineChart label="Ovarian hormones over the cycle." xMax={xMax} xTicks={ticks} cursor={day - 1}
        series={[{ label: 'Oestradiol', colour: COLOUR.oestradiol!, values: r.points.map((p) => p.oestradiol) }, { label: 'Progesterone', colour: COLOUR.progesterone!, values: r.points.map((p) => p.progesterone), right: true }]}
        yLeft={{ min: 0, max: 1600, ticks: [0, 400, 800, 1200, 1600], unit: 'oestradiol pmol/L' }} yRight={{ min: 0, max: 80, ticks: [0, 20, 40, 60, 80], unit: 'progesterone nmol/L' }} height={105} />
      <Legend items={[{ label: 'LH', colour: COLOUR.lh! }, { label: 'FSH', colour: COLOUR.fsh! }, { label: 'Oestradiol', colour: COLOUR.oestradiol! }, { label: 'Progesterone', colour: COLOUR.progesterone! }]} />
    </>
  );
}

// ── The menstrual cycle ───────────────────────────────────────────────────
export function CyclePanel() {
  const { def, state, dispatch } = useLab();
  const touring = state.mode === 'tour';
  const c = effectiveCycle(def, state);
  const r = simulateCycle({ scenario: c.scenario, lengthDays: c.length });
  const p = cycleAt(r, c.day);
  const maxDay = c.scenario === 'normal' ? c.length : c.scenario === 'pill' ? 28 : 35;
  const tick = useMemo(() => () => dispatch({ type: 'set-cycle', value: { day: state.cycle.day + 0.25 > maxDay ? 1 : state.cycle.day + 0.25 } }), [dispatch, state.cycle.day, maxDay]);
  useTicker(state.playing && !touring && state.mode === 'cycle', tick);
  const set = (v: Partial<typeof c>) => dispatch({ type: 'set-cycle', value: v });
  const fertile: [number, number] | null = r.ovulationDay ? [r.ovulationDay - 5, r.ovulationDay] : null;
  return (
    <section className="sheet cycle-panel" aria-label="Menstrual cycle">
      <Head title="The menstrual cycle" />
      <Radios label="Scenario" options={[{ id: 'normal', label: 'Normal' }, { id: 'pill', label: 'Combined pill' }, { id: 'pcos', label: 'PCOS' }, { id: 'pregnant', label: 'Pregnant' }] as const} value={c.scenario} disabled={touring} onChange={(s) => set({ scenario: s, day: 1 })} />
      <CycleCharts scenario={c.scenario} length={c.length} day={c.day} />
      <Slider label="Day of the cycle" min={1} max={maxDay} step={0.25} value={c.day} text={`day ${Math.floor(c.day)}`} disabled={touring} onChange={(v) => set({ day: v })} />
      {c.scenario === 'normal' && <Slider label="Cycle length" min={21} max={35} step={1} value={c.length} text={`${c.length} days`} disabled={touring} onChange={(v) => set({ length: v })} />}
      <dl className="readout" aria-live="polite">
        <div><dt>Ovary</dt><dd data-phase={p.ovarian}>{PHASE_TEXT[p.ovarian]}</dd></div>
        <div><dt>Uterus</dt><dd data-uterine={p.uterine}>{UTERINE_TEXT[p.uterine]}</dd></div>
        <div><dt>LH · FSH</dt><dd data-lh={p.lh.toFixed(1)}>{f1(p.lh)} · {f1(p.fsh)} IU/L</dd></div>
        <div><dt>Oestradiol · progesterone</dt><dd data-e2={p.oestradiol.toFixed(0)}>{f0(p.oestradiol)} pmol/L · {f1(p.progesterone)} nmol/L</dd></div>
        <div><dt>Leading follicle · corpus luteum</dt><dd data-follicle={p.follicleMm.toFixed(1)}>{p.follicleMm > 0 ? `${f1(p.follicleMm)} mm` : '—'} · {p.corpusLuteum > 0.05 ? `${f0(p.corpusLuteum * 100)} %` : '—'}</dd></div>
        <div><dt>Endometrium</dt><dd data-endometrium={p.endometriumMm.toFixed(1)}>{f1(p.endometriumMm)} mm{p.bleeding ? ' · bleeding' : ''}</dd></div>
        {p.hcg > 1 && <div><dt>hCG</dt><dd>{f0(p.hcg)} IU/L</dd></div>}
      </dl>
      <p className="small" data-ovulation={r.ovulationDay?.toFixed(1) ?? 'none'}>
        {r.ovulationDay ? <>LH surge on day {f1(r.surgeDay!)}, ovulation on day {f1(r.ovulationDay)}; fertile window days {Math.floor(fertile![0])}–{Math.floor(fertile![1])}.</> : c.scenario === 'pill' ? 'No surge and no ovulation: the pill’s hormones keep FSH and LH low. The bleed in the 7-day break is a withdrawal bleed; FSH rises and follicles start to grow in the break.' : 'No ovulation in this cycle: the LH surge never comes.'}
        {' '}Reference: LH surge {CYCLE_REF.lhSurge.join('–')} IU/L; luteal progesterone over {CYCLE_REF.lutealProgesterone[0]} nmol/L.
      </p>
      <FlowLegend />
      <div className="button-row"><button type="button" className="secondary" disabled={touring} onClick={() => dispatch({ type: 'set-close-up', value: 'follicle' })}>Inside a follicle</button></div>
      <p className="muted small">A teaching model with textbook values; real cycles vary. Follicles and the corpus luteum are drawn in the left ovary at their real sizes.</p>
    </section>
  );
}

// ── Fertilisation ─────────────────────────────────────────────────────────
export function FertilisationPanel() {
  const { def, state, dispatch } = useLab();
  const touring = state.mode === 'tour';
  const f = effectiveFert(def, state);
  const st = stageAt(f.day);
  const tick = useMemo(() => () => dispatch({ type: 'set-fert', value: { day: state.fert.day + 0.05 > 10 ? 0 : state.fert.day + 0.05 } }), [dispatch, state.fert.day]);
  useTicker(state.playing && !touring && state.mode === 'fertilisation' && state.fert.day > 0, tick);
  const fmt = (n: number) => (n >= 1e6 ? `${f0(n / 1e6)} million` : f0(n));
  return (
    <section className="sheet fert-panel" aria-label="Fertilisation">
      <Head title="Fertilisation and the first week" />
      <Slider label="Days after fertilisation" min={0} max={10} step={0.05} value={f.day} text={f.day < 0.05 ? 'the sperm’s journey' : `day ${f1(f.day)}`} disabled={touring} onChange={(v) => dispatch({ type: 'set-fert', value: { day: v } })} />
      <dl className="readout" aria-live="polite">
        <div><dt>Stage</dt><dd data-stage={st.id}>{st.name}: {st.cells}</dd></div>
        <div><dt>hCG in blood</dt><dd>{hcgAfterFertilisation(f.day) < 1 ? 'not yet detectable' : `${f0(hcgAfterFertilisation(f.day))} IU/L`}</dd></div>
      </dl>
      <p className="small">{st.text}</p>
      <label className="check"><input type="checkbox" checked={f.ectopic} disabled={touring} onChange={(e) => dispatch({ type: 'set-fert', value: { ectopic: e.target.checked } })} /> Ectopic: the embryo stops in the tube</label>
      {f.ectopic && f.day >= 6 && <p className="small warn-text">The embryo implants in the ampulla, which cannot hold it: pain and bleeding at 6–8 weeks, and rupture is an emergency (RCOG Green-top 21).</p>}
      <h3 className="group-title">Sperm at each barrier</h3>
      <ol className="barriers small">{SPERM_BARRIERS.map((b) => <li key={b.id}><strong>{b.where}: {fmt(b.count)}</strong> — {b.why}</li>)}</ol>
      <h3 className="group-title">The fertile window (Wilcox 1995)</h3>
      <svg className="bars" viewBox="0 0 280 80" role="img" aria-label="Chance of conception by the day of intercourse relative to ovulation: highest on the day before and the day of ovulation (about 30 %), none after.">
        {WILCOX.map((w, i) => <g key={w.day}><rect x={12 + i * 33} y={66 - w.p * 160} width={24} height={w.p * 160} fill={COLOUR.oestradiol} /><text x={24 + i * 33} y={77} fontSize="7" textAnchor="middle" fill="currentColor">{w.day === 0 ? 'ov.' : w.day}</text><text x={24 + i * 33} y={62 - w.p * 160} fontSize="6.5" textAnchor="middle" fill="currentColor">{w.p ? `${Math.round(w.p * 100)}%` : ''}</text></g>)}
      </svg>
      <div className="button-row">
        <button type="button" className="secondary" disabled={touring} onClick={() => dispatch({ type: 'set-close-up', value: 'fertilisation' })}>Fertilisation close-up</button>
        <button type="button" className="secondary" disabled={touring} onClick={() => dispatch({ type: 'set-close-up', value: 'embryo' })}>The embryo</button>
      </div>
      <p className="muted small">Sperm and the egg are drawn far larger than life (the egg is about 0.12 mm).</p>
    </section>
  );
}

// ── Pregnancy ─────────────────────────────────────────────────────────────
export function PregnancyPanel() {
  const { def, state, dispatch } = useLab();
  const touring = state.mode === 'tour';
  const week = effectiveWeek(def, state);
  const tick = useMemo(() => () => dispatch({ type: 'set-week', value: state.week + 0.5 > 40 ? 4 : state.week + 0.5 }), [dispatch, state.week]);
  useTicker(state.playing && !touring && state.mode === 'pregnancy', tick);
  const h = pregnancyHormones(week), mat = maternalChanges(week), ms = milestoneAt(week);
  const weeks = Array.from({ length: 37 }, (_, i) => i + 4);
  return (
    <section className="sheet preg-panel" aria-label="Pregnancy">
      <Head title="Pregnancy week by week" />
      <Slider label="Gestational week" min={4} max={40} step={0.5} value={week} text={`week ${f1(week).replace('.0', '')} · trimester ${trimester(week)}`} disabled={touring} onChange={(v) => dispatch({ type: 'set-week', value: v })} />
      <dl className="readout" aria-live="polite">
        <div><dt>{week < 14 ? 'Crown–rump length' : 'Crown–heel length'}</dt><dd data-week={week}>{week < 14 ? `${f0(crownRumpMm(week))} mm` : `${f0(crownHeelCm(week))} cm`}</dd></div>
        <div><dt>Weight (Hadlock)</dt><dd data-weight={fetalWeightG(week).toFixed(0)}>{fetalWeightG(week) < 10 ? `${f1(fetalWeightG(week))} g` : `${f0(fetalWeightG(week))} g`}</dd></div>
        <div><dt>Fundus</dt><dd data-fundus={fundalHeightCm(week).toFixed(0)}>{fundusLandmark(week)}{week >= 16 ? ` (${f0(fundalHeightCm(week))} cm above the symphysis)` : ''}</dd></div>
        <div><dt>Placenta</dt><dd>{placentaDiameterCm(week) > 0 ? `${f0(placentaDiameterCm(week))} cm across` : 'forming (chorionic villi)'}; progesterone {f0(placentalProgesteroneShare(week) * 100)} % from the placenta</dd></div>
        <div><dt>Mother</dt><dd>blood volume +{f0(mat.bloodVolumePct)} %, cardiac output +{f0(mat.cardiacOutputPct)} %, kidney filtration +{f0(mat.gfrPct)} %</dd></div>
      </dl>
      <p className="small"><strong>Week {ms.week}:</strong> {ms.text}</p>
      <LineChart label={`Hormones of pregnancy: hCG ${f0(h.hcg)} IU/L and progesterone ${f0(h.progesterone)} nmol/L at week ${week}.`} xMax={36} xTicks={[4, 12, 20, 28, 36, 40].map((w) => ({ at: w - 4, text: `wk ${w}` }))} cursor={week - 4}
        series={[{ label: 'hCG', colour: COLOUR.hcg!, values: weeks.map((w) => pregnancyHormones(w).hcg / 1000) }, { label: 'Progesterone', colour: COLOUR.progesterone!, values: weeks.map((w) => pregnancyHormones(w).progesterone), right: true }, { label: 'Oestriol', colour: COLOUR.oestradiol!, values: weeks.map((w) => pregnancyHormones(w).oestriol * 7), right: true, dashed: true }]}
        yLeft={{ min: 0, max: 120, ticks: [0, 40, 80, 120], unit: 'hCG ×1000 IU/L' }} yRight={{ min: 0, max: 600, ticks: [0, 200, 400, 600], unit: 'progesterone nmol/L' }} height={115} />
      <Legend items={[{ label: 'hCG', colour: COLOUR.hcg! }, { label: 'Progesterone', colour: COLOUR.progesterone! }, { label: 'Oestriol (scaled)', colour: COLOUR.oestradiol! }]} />
      <details className="more">
        <summary>What crosses the placenta</summary>
        <ul className="small across">{ACROSS.map((a) => <li key={a.what}><span className={`flag is-${a.crosses ? 'normal' : 'high'}`}>{a.crosses ? 'crosses' : 'does not'}</span> <strong>{a.what}</strong>: {a.how}</li>)}</ul>
      </details>
      <div className="button-row"><button type="button" className="secondary" disabled={touring} onClick={() => dispatch({ type: 'set-close-up', value: 'villi' })}>Inside the placenta</button></div>
      <p className="muted small">The growing uterus and the fetus are modelled (the fetus is a stylised illustration at its real length); the placenta, amnion and cord are the HuBMAP full-term set, scaled with the weeks. The bowel is hidden: in life the uterus pushes it up and aside.</p>
    </section>
  );
}

/** The cervix seen from below: the opening grows to 10 cm. */
function CervixDial({ cm, effacement }: { cm: number; effacement: number }) {
  return (
    <svg className="dial" viewBox="0 0 120 122" role="img" aria-label={`Cervix ${f1(cm)} cm dilated, ${f0(effacement)} % effaced.`}>
      <circle cx={60} cy={56} r={50} fill="#c47a80" opacity={0.25 + 0.5 * (1 - effacement / 100)} />
      <circle cx={60} cy={56} r={50} fill="none" stroke="currentColor" strokeOpacity={0.3} />
      <circle cx={60} cy={56} r={Math.max(2, cm * 4.6)} fill="var(--panel-bg, #fff)" stroke="#a03040" strokeWidth={2} />
      <text x={60} y={116} fontSize="11" textAnchor="middle" fill="currentColor">{f1(cm)} cm open</text>
    </svg>
  );
}

// ── Labour and breastfeeding ──────────────────────────────────────────────
export function BirthPanel() {
  const { def, state, dispatch } = useLab();
  const touring = state.mode === 'tour';
  const b = effectiveBirth(def, state);
  const l = labourAt(b.hours);
  const tick = useMemo(() => () => dispatch({ type: 'set-birth', value: { hours: state.birth.feeding ? (state.birth.hours + 0.25) % 14 : state.birth.hours + 0.05 > LABOUR_END_H + 0.5 ? 0 : state.birth.hours + 0.05 } }), [dispatch, state.birth.hours, state.birth.feeding]);
  useTicker(state.playing && !touring && state.mode === 'birth', tick);
  const set = (v: Partial<typeof b>) => dispatch({ type: 'set-birth', value: v });
  const lac = lactationAt(b.hours, true);
  return (
    <section className="sheet birth-panel" aria-label="Birth and breastfeeding">
      <Head title={b.feeding ? 'Breastfeeding' : 'Labour and birth'} />
      <Radios label="Show" options={[{ id: 'labour', label: 'Labour' }, { id: 'feeding', label: 'Breastfeeding' }] as const} value={b.feeding ? 'feeding' : 'labour'} disabled={touring} onChange={(v) => { set({ feeding: v === 'feeding', hours: v === 'feeding' ? 3 : 0 }); dispatch({ type: 'camera', preset: v === 'feeding' ? 'anterior' : 'left', focus: v === 'feeding' ? ['breast-left', 'breast-right'] : [] }); }} />
      {!b.feeding ? (
        <>
          <Slider label="Time since regular contractions began" min={0} max={LABOUR_END_H + 0.5} step={0.05} value={b.hours} text={`${Math.floor(b.hours)} h ${String(Math.round((b.hours % 1) * 60)).padStart(2, '0')} min`} disabled={touring} onChange={(v) => set({ hours: v })} />
          <div className="row dial-row">
            <CervixDial cm={l.dilationCm} effacement={l.effacementPct} />
            <dl className="readout" aria-live="polite">
              <div><dt>Stage</dt><dd data-stage={l.stage}>{l.stage === 'latent' ? 'First (latent)' : l.stage === 'first' ? 'First (active)' : l.stage === 'second' ? 'Second' : l.stage === 'third' ? 'Third' : 'Delivered'}</dd></div>
              <div><dt>Dilation · effacement</dt><dd data-dilation={l.dilationCm.toFixed(1)}>{f1(l.dilationCm)} cm · {f0(l.effacementPct)} %</dd></div>
              <div><dt>Head station</dt><dd>{l.born ? 'born' : l.station > 0 ? `+${f1(l.station)}` : f1(l.station)}</dd></div>
              <div><dt>Contractions</dt><dd data-mvu={l.montevideo}>{l.stage === 'after' ? '—' : `every ${f1(l.intervalMin)} min, ${f0(l.durationS)} s, ${f0(l.peakMmHg)} mmHg (${l.montevideo} Montevideo units)`}</dd></div>
              <div><dt>Oxytocin</dt><dd>{f1(l.oxytocin)} × the start of labour</dd></div>
            </dl>
          </div>
          <LineChart label={`Uterine pressure over the last 30 minutes: contractions every ${f1(l.intervalMin)} minutes.`} series={[{ label: 'Pressure', colour: '#c04050', values: contractionTrace(b.hours) }]} xMax={30} xTicks={[0, 10, 20, 30].map((m) => ({ at: m, text: m === 30 ? 'now' : `−${30 - m} min` }))} yLeft={{ min: 0, max: 90, ticks: [0, 30, 60, 90], unit: 'mmHg' }} height={95} />
          <p className="small">{STAGE_TEXT[l.stage]}</p>
          <p className="small"><strong>The Ferguson reflex:</strong> the head stretches the cervix → nerves signal the hypothalamus → the posterior pituitary releases oxytocin → stronger contractions → more stretch. A positive feedback loop, ended by the birth.</p>
        </>
      ) : (
        <>
          <Slider label="Days after the birth" min={0} max={14} step={0.25} value={b.hours} text={`day ${f1(b.hours)}`} disabled={touring} onChange={(v) => set({ hours: v })} />
          <dl className="readout" aria-live="polite">
            <div><dt>Milk</dt><dd data-milk={lac.milkMlPerDay.toFixed(0)}>{f0(lac.milkMlPerDay)} mL a day · {lac.kind}</dd></div>
            <div><dt>Prolactin during a feed</dt><dd>{f0(lac.prolactin)} µg/L (about 8 × between feeds)</dd></div>
          </dl>
          <p className="small">Suckling stimulates nerves in the nipple. The hypothalamus releases less dopamine, so the anterior pituitary makes more prolactin, which drives milk production for the next feed; the posterior pituitary releases oxytocin, which contracts the myoepithelial cells and pushes the milk out within about a minute (the let-down reflex). High prolactin also holds back GnRH, delaying periods (lactational amenorrhoea).</p>
          <div className="button-row"><button type="button" className="secondary" disabled={touring} onClick={() => dispatch({ type: 'set-close-up', value: 'alveolus' })}>Inside an alveolus</button></div>
        </>
      )}
      <FlowLegend />
      <p className="muted small">Median times for a first labour (Zhang 2010); real labours vary widely. For learning only.</p>
    </section>
  );
}

// ── The testis ────────────────────────────────────────────────────────────
export function SpermPanel() {
  const { def, state, dispatch } = useLab();
  const touring = state.mode === 'tour';
  const sp = effectiveSperm(def, state);
  const r = spermScenario(sp.scenario);
  const [day, setDay] = useState(0);
  const stage = spermStageAt(day);
  const step = AROUSAL_STEPS[sp.arousal < 0.2 ? 0 : sp.arousal < 0.45 ? 1 : sp.arousal < 0.85 ? 2 : sp.arousal < 0.97 ? 3 : 4]!;
  return (
    <section className="sheet sperm-panel" aria-label="The testis and sperm">
      <Head title="Sperm and the male hormone loop" />
      <Radios<SpermScenario> label="Scenario" options={SPERM_SCENARIOS} value={sp.scenario} disabled={touring} onChange={(v) => dispatch({ type: 'set-sperm', value: { scenario: v } })} />
      <p className="small">{r.text}</p>
      <dl className="readout" aria-live="polite">
        <div><dt>LH · FSH</dt><dd data-lh={r.axis.lh}>{f1(r.axis.lh)} · {f1(r.axis.fsh)} IU/L <Flag v={r.axis.lh} range={MALE_REF.lh} /></dd></div>
        <div><dt>Testosterone</dt><dd>{f0(r.axis.testosterone)} nmol/L <Flag v={r.axis.testosterone} range={MALE_REF.testosterone} /></dd></div>
        <div><dt>Inhibin B · testis</dt><dd>{f0(r.axis.inhibinB)} ng/L · {f0(r.axis.testisMl)} mL</dd></div>
      </dl>
      <h3 className="group-title">Semen analysis (WHO 2021 lower limits)</h3>
      <table className="small results" data-diagnosis={semenDiagnosis(r.semen)}>
        <tbody>{readSemen(r.semen).map((x) => <tr key={x.key} className={x.low ? 'warn' : ''}><th>{x.label}</th><td>{x.value} {x.unit}</td><td className="muted">≥ {x.limit}</td></tr>)}</tbody>
      </table>
      <p className="small"><strong>{semenDiagnosis(r.semen)}</strong></p>
      <h3 className="group-title">Making a sperm</h3>
      <Slider label="Days from a spermatogonium" min={0} max={80} step={1} value={day} text={`day ${day}`} onChange={setDay} />
      <p className="small" data-sperm-stage={stage.cell}><strong>{stage.cell}</strong> ({stage.ploidy}) — {stage.where}. {stage.text}</p>
      <h3 className="group-title">Erection and emission</h3>
      <Slider label="Arousal" min={0} max={1} step={0.01} value={sp.arousal} text={`${f0(sp.arousal * 100)} %`} disabled={touring} onChange={(v) => dispatch({ type: 'set-sperm', value: { arousal: v } })} />
      <p className="small" data-arousal-step={step.id}><strong>{step.title}.</strong> {step.text}</p>
      <details className="more"><summary>Where semen comes from</summary><ul className="small">{SEMEN_PARTS.map((p) => <li key={p.from}><strong>{p.from}</strong> ({f0(p.share * 100)} %): {p.what}</li>)}</ul></details>
      <FlowLegend />
      <div className="button-row"><button type="button" className="secondary" disabled={touring} onClick={() => dispatch({ type: 'set-close-up', value: 'tubule' })}>Inside a seminiferous tubule</button></div>
      <p className="muted small">Hormone values are typical steady states for each scenario; erection is shown as physiology (blood flow into the corpora), not as a change of shape.</p>
    </section>
  );
}

// ── Contraception ─────────────────────────────────────────────────────────
export function ContraceptionPanel() {
  const { def, state, dispatch, switchBody } = useLab();
  const touring = state.mode === 'tour';
  const m = methodById(effectiveMethod(def, state)) ?? METHODS[0]!;
  const pick = (x: Method) => (x.body !== def.body ? switchBody(x.body, { mode: 'contraception', method: x.id }) : dispatch({ type: 'set-method', value: x.id }));
  const kinds = [...new Set(METHODS.map((x) => x.kind))];
  const scale = (v: number) => (Math.log10(Math.max(0.05, v)) + 1.4) / (Math.log10(85) + 1.4);
  return (
    <section className="sheet contra-panel" aria-label="Contraception">
      <Head title="Contraception" play={false} />
      {kinds.map((k) => (
        <div key={k} className="method-group">
          <h3 className="group-title">{KIND_LABEL[k]}</h3>
          <ul className="chips">{METHODS.filter((x) => x.kind === k).map((x) => <li key={x.id}><button type="button" aria-pressed={x.id === m.id} disabled={touring} onClick={() => pick(x)}>{x.name}</button></li>)}</ul>
        </div>
      ))}
      <h3 className="group-title" data-method={m.id}>{m.name}</h3>
      <p className="small">{m.how}</p>
      <dl className="readout">
        <div><dt>Pregnancies in the first year</dt><dd data-typical={m.typical[0]}>{pct(m.typical)} typical use · {pct(m.perfect)} perfect use</dd></div>
        {m.lasts && <div><dt>Lasts</dt><dd>{m.lasts}</dd></div>}
        <div><dt>Acts on</dt><dd>{m.body === def.body ? `${m.actsOn.length} highlighted structure${m.actsOn.length === 1 ? '' : 's'}` : `the ${m.body} body`}</dd></div>
      </dl>
      <svg className="bars" viewBox="0 0 280 210" role="img" aria-label="Typical-use failure in the first year, on a log scale, for every method.">
        {METHODS.map((x, i) => <g key={x.id}><text x={0} y={10 + i * 11.4} fontSize="6.5" fill="currentColor">{x.name.replace(/ \(.*\)/, '').slice(0, 26)}</text><rect x={112} y={4 + i * 11.4} width={Math.max(1, scale(x.typical[1]) * 150)} height={8} fill={x.id === m.id ? '#ffb020' : '#7a8aa0'} /><text x={115 + scale(x.typical[1]) * 150} y={10.5 + i * 11.4} fontSize="6" fill="currentColor">{pct(x.typical)}</text></g>)}
      </svg>
      {m.cycle === 'pill' && def.body === 'female' && <CycleCharts scenario="pill" length={28} day={state.cycle.day} />}
      <p className="muted small">Trussell 2011 (perfect use), CDC chart (typical use), FSRH guidance on emergency contraception. Not advice: a sexual health service can help choose.</p>
    </section>
  );
}

// ── Disorders, tests and IVF ──────────────────────────────────────────────
function ReadingLine({ r }: { r: Reading }) { return <p className={`small reading is-${r.level}`} data-reading={r.level} aria-live="polite">{r.text}</p>; }
function TestReader() {
  const { def } = useLab();
  const [tab, setTab] = useState(def.body === 'male' ? 'psa' : 'hcg');
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const n = (x: string) => (x.trim() === '' ? NaN : Number(x));
  const tabs = [{ id: 'hcg', label: 'hCG' }, { id: 'p4', label: 'Day-21 progesterone' }, { id: 'amh', label: 'AMH' }, { id: 'fshlh', label: 'FSH and LH' }, { id: 'psa', label: 'PSA' }];
  const fields: Record<string, [string, string?]> = { hcg: ['hCG (IU/L)'], p4: ['Progesterone (nmol/L)'], amh: ['AMH (pmol/L)'], fshlh: ['FSH (IU/L)', 'LH (IU/L)'], psa: ['PSA (ng/mL)', 'Age (years)'] };
  const read = (): Reading | null => {
    if (a.trim() === '') return null;
    switch (tab) {
      case 'hcg': return readHcg(n(a));
      case 'p4': return readProgesterone(n(a));
      case 'amh': return readAmh(n(a));
      case 'fshlh': return b.trim() === '' ? null : readFshLh(n(a), n(b), def.body);
      default: return b.trim() === '' ? null : readPsa(n(a), n(b));
    }
  };
  const r = read();
  const [fa, fb] = fields[tab]!;
  return (
    <div className="test-reader">
      <Radios label="Test" options={tabs} value={tab} onChange={(v) => { setTab(v); setA(''); setB(''); }} />
      <div className="test-form">
        <label className="small">{fa}<input type="number" inputMode="decimal" min={0} step="any" value={a} onChange={(e) => setA(e.target.value)} /></label>
        {fb && <label className="small">{fb}<input type="number" inputMode="decimal" min={0} step="any" value={b} onChange={(e) => setB(e.target.value)} /></label>}
      </div>
      {r && <ReadingLine r={r} />}
    </div>
  );
}
export function DisordersPanel() {
  const { def, state, dispatch, switchBody } = useLab();
  const touring = state.mode === 'tour';
  const d = disorderById(effectiveDisorder(def, state) ?? '');
  const pick = (id: string) => { const x = disorderById(id)!; if (x.body !== def.body) switchBody(x.body, { mode: 'disorders', disorder: id }); else dispatch({ type: 'set-disorder', value: id === state.disorder ? null : id }); };
  return (
    <section className="sheet disorders-panel" aria-label="Disorders">
      <Head title="Disorders, tests and IVF" play={false} />
      <ul className="chips">{DISORDERS.map((x) => <li key={x.id}><button type="button" aria-pressed={x.id === d?.id} disabled={touring} onClick={() => pick(x.id)}>{x.name.replace(/ \(.*\)/, '')}{x.body !== def.body ? ' ↗' : ''}</button></li>)}</ul>
      {d ? (
        <div data-disorder={d.id}>
          <h3 className="group-title">{d.name}</h3>
          <p className="small">{d.what}</p>
          <dl className="closeup-parts small">
            <div><dt>Signs</dt><dd>{d.signs}</dd></div>
            <div><dt>Tests</dt><dd>{d.tests}</dd></div>
            <div><dt>Treatment</dt><dd>{d.treatment}</dd></div>
          </dl>
          {d.cycle && d.cycle !== 'normal' && <CycleCharts scenario={d.cycle} length={28} day={14} />}
          {d.sperm && <p className="small"><strong>Semen:</strong> {semenDiagnosis(spermScenario(d.sperm).semen)}.</p>}
        </div>
      ) : <p className="muted small">Pick a disorder to see where it is and its pattern. ↗ switches to the other body.</p>}
      <h3 className="group-title">Test reader</h3>
      <TestReader />
      <details className="more"><summary>IVF step by step</summary><ol className="small">{IVF_STEPS.map((s) => <li key={s.title}><strong>{s.title}:</strong> {s.text}</li>)}</ol></details>
      <p className="muted small">For learning only: thresholds from NICE, RCOG, the 2023 PCOS guideline, WHO 2021 and the NHS PSA programme. Not for diagnosis.</p>
    </section>
  );
}
