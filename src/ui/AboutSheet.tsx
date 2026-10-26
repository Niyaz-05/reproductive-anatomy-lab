import { useEffect, useRef } from 'react';
import { useLab } from '../app/LabContext';
import { LAYER_COLOUR, ORIGIN_COLOUR, ORIGIN_LABEL } from '../viewer/palette';
import { COLOUR } from '../repro/live';

/**
 * Source, scope and credits, kept off the main screen. The HuBMAP and BodyParts3D attribution
 * required by CC BY 4.0 lives here and is reachable from the ⓘ button and the "Source & credits" link.
 */
export function AboutSheet({ onClose }: { onClose: () => void }) {
  const { def } = useLab();
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const streams: [string, string][] = [['LH and FSH', 'lh'], ['Oestradiol', 'oestradiol'], ['Progesterone', 'progesterone'], ['Testosterone', 'testosterone'], ['Blood', 'blood'], ['Menstrual blood', 'menses'], ['Sperm', 'sperm'], ['Milk', 'milk'], ['Egg', 'egg']];
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="about-sheet glass" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ghost sheet-close" onClick={onClose} aria-label="Close">✕</button>
        <p className="eyebrow">Source &amp; scope</p>
        <h2 id="about-title" className="sheet-title" tabIndex={-1} ref={title}>About this lab</h2>
        <p>An interactive 3D lab of the human reproductive system for university anatomy and physiology, with a female and a male body. {def.summary}</p>

        <h3 className="group-title">You will learn to</h3>
        <ul className="objectives">{def.learningObjectives.map((o) => <li key={o.id}>{o.text}</li>)}</ul>

        <h3 className="group-title">Colours</h3>
        <p className="small muted">
          “Real” shows the organs as they look in a fresh specimen: a pink-tan uterus over a deep pink muscle wall, a velvety red
          endometrium, pale bumpy ovaries, pink tubes and fimbriae, red-purple erectile tissue, the bluish-white capsule of the
          testes, a tan prostate; a maroon placenta under the translucent amnion, the cord’s two arteries blue and its vein red;
          red arteries, blue-purple veins and ivory bone. “Layers” gives each layer its own colour; “Origin” colours each part by
          the embryonic tissue it grows from, so each part matches its homologue in the other body.
        </p>
        <p className="legend-row">{def.layers.map((l) => <span key={l.id}><span className="dot" style={{ background: LAYER_COLOUR[l.id] }} aria-hidden="true" /> {l.label}</span>)}</p>
        <p className="legend-row">{Object.entries(ORIGIN_LABEL).map(([k, label]) => <span key={k}><span className="dot" style={{ background: ORIGIN_COLOUR[k] }} aria-hidden="true" /> {label}</span>)}</p>
        <p className="legend-row">{streams.map(([label, k]) => <span key={k}><span className="dot" style={{ background: COLOUR[k] }} aria-hidden="true" /> {label}</span>)}</p>

        <h3 className="group-title">Simulations</h3>
        <ul className="small">
          <li><strong>Menstrual cycle:</strong> a feedback model with hourly steps: FSH and LH held down by oestradiol, progesterone and the inhibins; an LH surge once oestradiol has stayed high for about 36 hours (Hoff 1983); one follicle selected and ovulating about 36 hours after the surge; a corpus luteum lasting about 14 days unless hCG rescues it; the endometrium shed, rebuilt and made secretory. The follicle’s growth rate is set so the cycle has the length chosen. Ranges from Guyton &amp; Hall and Speroff.</li>
          <li><strong>Fertilisation:</strong> sperm numbers at each barrier (Suarez &amp; Pacey 2006), the Wilcox 1995 fertile window, the embryo’s stages and journey (Moore).</li>
          <li><strong>Pregnancy:</strong> crown–rump length (Robinson &amp; Fleming 1975), fetal weight (Hadlock 1991), fundal height, placenta size and the hormones of pregnancy (Williams Obstetrics; NICE NG201).</li>
          <li><strong>Labour and breastfeeding:</strong> cervical dilation on the Zhang 2010 curves, contractions and Montevideo units, the Ferguson reflex; prolactin, milk volume and the let-down reflex.</li>
          <li><strong>The testis:</strong> the male hormone loop and its disorders, spermatogenesis (Heller &amp; Clermont 1963), semen against the WHO 2021 limits; erection and emission as text and blood flow.</li>
          <li><strong>Contraception</strong> (Trussell 2011; CDC; FSRH) and <strong>disorders</strong> with a test reader (Rotterdam/2023 PCOS guideline, NICE, RCOG, NHS screening).</li>
        </ul>

        <h3 className="group-title">The 3D models</h3>
        <p className="small">
          <strong>Female:</strong> the HuBMAP Human Reference Atlas 3D Reference Organ Set for Female v1.5 (Kristen Browne, Heidi Schlehlein et al.;
          <a href="https://doi.org/10.48539/HBM352.BTSQ.586" target="_blank" rel="noopener noreferrer"> doi:10.48539/HBM352.BTSQ.586</a>), CC BY 4.0: the uterus,
          tubes, ovaries, ligaments, vagina, breasts, the full-term placenta set, bladder, rectum, pelvis and vessels. The BodyParts3D pelvic floor, iliac
          arteries, ribs and sternum are placed on it by similarity fits (the pelvis with a smooth warp, about 4 mm on the bones).<br />
          <strong>Male:</strong> <a href="https://doi.org/10.1093/nar/gkn613" target="_blank" rel="noopener noreferrer">BodyParts3D 4.0</a> (Database Center for Life Science), CC BY 4.0, in its own frame.<br />
          <strong>Modelled</strong> (no open scanned model has them): the endometrium, the growing uterus, the vulva, the female urethra and ovarian vessels;
          the scrotum, urethra segments, ejaculatory ducts, bulbourethral glands and deep arteries of the penis; the fetus, follicles, corpus luteum and
          every close-up. Full provenance and hashes: <code>ATTRIBUTION.md</code>.
        </p>

        <h3 className="group-title">Limits</h3>
        <ul className="small">{def.disclaimers.map((d) => <li key={d}>{d}</li>)}</ul>
      </section>
    </div>
  );
}
