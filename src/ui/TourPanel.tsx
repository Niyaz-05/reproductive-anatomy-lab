import { useLab } from '../app/LabContext';

/** Guided tour: one step at a time, with progress and navigation. */
export function TourPanel() {
  const { def, state, dispatch, switchBody } = useLab();
  const step = def.tour[state.tourIndex];
  if (!step) return null;
  const n = def.tour.length;
  // A step in the other body switches the lab to it.
  const go = (index: number) => { const t = def.tour[index]; if (t && t.body !== def.body) switchBody(t.body, { mode: 'tour', tourIndex: index }); else dispatch({ type: 'tour-go', index }); };
  return (
    <section className="sheet tour-panel" aria-labelledby="tour-title">
      <p className="eyebrow">Guided tour · step {state.tourIndex + 1} of {n} · {step.body}</p>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={n} aria-valuenow={state.tourIndex + 1} aria-label="Tour progress">
        <span style={{ inlineSize: `${((state.tourIndex + 1) / n) * 100}%` }} />
      </div>
      <h2 id="tour-title" className="panel-title" aria-live="polite">{step.title}</h2>
      <p>{step.text}</p>
      <ul className="chips">
        {step.focus.map((f) => {
          const s = def.structures.find((x) => x.id === f);
          return s ? <li key={f}><span className="chip-static">{s.label}</span></li> : null;
        })}
      </ul>
      <div className="row tour-nav">
        <button type="button" className="secondary" onClick={() => go(state.tourIndex - 1)} disabled={state.tourIndex === 0}>← Back</button>
        {state.tourIndex < n - 1 ? (
          <button type="button" className="primary" onClick={() => go(state.tourIndex + 1)}>Next →</button>
        ) : (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'set-mode', mode: 'explore' })}>Finish</button>
        )}
      </div>
      <ol className="tour-index small">
        {def.tour.map((t, i) => (
          <li key={t.id}>
            <button type="button" className="link" aria-current={i === state.tourIndex ? 'step' : undefined} onClick={() => go(i)}>{t.title}{t.body !== def.body ? ' ↗' : ''}</button>
          </li>
        ))}
      </ol>
    </section>
  );
}
