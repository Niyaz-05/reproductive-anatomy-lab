import { useId } from 'react';
import { useLab } from '../app/LabContext';
import { effectiveCloseUp } from '../app/state';
import type { CloseUp } from '../contract/schema';
import { closeUpFrame } from '../repro/anchors';

export const CLOSE_UP_LABEL: Record<CloseUp, string> = {
  follicle: 'a ripe follicle', fertilisation: 'fertilisation', embryo: 'the embryo', villi: 'placental villi', tubule: 'a seminiferous tubule', alveolus: 'a breast alveolus',
};

const TEXT: Record<CloseUp, { title: string; body: string; parts: [string, string][] }> = {
  follicle: {
    title: 'A ripe (Graafian) follicle', body: 'About 2 cm across just before ovulation, cut in half here. It began as a primordial follicle laid down before birth; it took about a year to reach this stage, the last two weeks under FSH.',
    parts: [
      ['Theca cells', 'Outside the basement membrane: under LH they make androgens, which pass to the granulosa cells.'],
      ['Granulosa cells', 'Under FSH, aromatase turns the androgens into oestradiol (the two-cell, two-gonadotropin model); they also make inhibin and the follicular fluid.'],
      ['Oocyte', 'Arrested in prophase of meiosis I since before birth; the LH surge restarts meiosis, which stops again at metaphase II until fertilisation.'],
      ['Ovulation', 'About 36 hours after the surge, enzymes thin the wall and the follicle ruptures; the egg leaves in its cumulus. The remains become the corpus luteum.'],
    ],
  },
  fertilisation: {
    title: 'Fertilisation in the ampulla', body: 'Within about 24 hours of ovulation, a few hundred capacitated sperm reach the egg.',
    parts: [
      ['Capacitation', 'In the female tract sperm lose cholesterol from their membranes and swim with whip-like, hyperactivated beats.'],
      ['Acrosome reaction', 'Binding to the zona pellucida (ZP3) releases the acrosome’s enzymes, which digest a path for one sperm.'],
      ['Fusion and the cortical reaction', 'The sperm and egg membranes fuse; cortical granules harden the zona so no other sperm enter (a block to polyspermy).'],
      ['Pronuclei', 'The egg completes meiosis II (second polar body). Each pronucleus has 23 chromosomes; they meet and the zygote’s first division follows.'],
    ],
  },
  embryo: {
    title: 'From zygote to implantation', body: 'Move the day slider in the fertilisation panel to follow the stages.',
    parts: [
      ['Cleavage', 'Divisions without growth inside the zona: 2, 4, 8 cells; the morula enters the uterus on about day 4.'],
      ['Blastocyst', 'A fluid-filled cavity forms; the inner cell mass becomes the embryo, the trophoblast the placenta.'],
      ['Hatching and implantation', 'On days 6–7 it hatches from the zona and attaches to the secretory endometrium; the syncytiotrophoblast invades and makes hCG.'],
    ],
  },
  villi: {
    title: 'Placental villi', body: 'Tree-like villi of the fetus hang in a lake of the mother’s blood. Their total surface is about 12 m² at term.',
    parts: [
      ['Fetal side', 'Umbilical arteries branch over the chorionic plate into the villi; capillaries in each villus return blood by the umbilical vein.'],
      ['Maternal side', 'Spiral arteries, remodelled by the trophoblast into wide low-resistance channels, spurt blood into the intervillous space.'],
      ['The barrier', 'Syncytiotrophoblast and capillary wall, thinning to about 4 µm at term: oxygen, glucose and IgG cross; the two bloods do not mix.'],
    ],
  },
  tubule: {
    title: 'A seminiferous tubule', body: 'Cut across: each testis holds about 600 m of these tubules, each about 0.2 mm across.',
    parts: [
      ['From the edge inwards', 'Spermatogonia on the basement membrane, primary spermatocytes in meiosis, spermatids, then sperm released into the lumen: about 74 days.'],
      ['Sertoli cells', 'Tall supporting cells from the edge to the lumen; their tight junctions form the blood–testis barrier. FSH and testosterone act on them; they make inhibin B and androgen-binding protein.'],
      ['Leydig cells', 'Between the tubules, by the capillaries: under LH they make testosterone.'],
    ],
  },
  alveolus: {
    title: 'A breast alveolus', body: 'The milk-making unit: a hollow ball of cells, grouped in lobules that drain to a lactiferous duct.',
    parts: [
      ['Secretory cells', 'Under prolactin they make milk proteins (casein, whey), lactose and fat droplets, and pass IgA antibodies from the blood.'],
      ['Myoepithelial cells', 'A basket of contractile cells: oxytocin makes them squeeze, ejecting the milk into the ducts (the let-down reflex).'],
    ],
  },
};

/** The explanation beside a close-up, and the way back to the body. */
export function CloseUpPanel() {
  const { def, state, dispatch } = useLab();
  const id = useId();
  const close = effectiveCloseUp(def, state);
  if (!close) return null;
  const t = TEXT[close];
  const mag = closeUpFrame(def, close).magnified;
  return (
    <section className="sheet closeup-panel" aria-labelledby={`${id}-title`} data-close-up={close}>
      <div className="detail-head">
        <div>
          <p className="eyebrow">Close-up · magnified about {mag}×</p>
          <h2 id={`${id}-title`} className="panel-title">{t.title}</h2>
        </div>
        {state.mode !== 'tour' && <button type="button" className="secondary" onClick={() => dispatch({ type: 'set-close-up', value: null })}>Back to the body</button>}
      </div>
      <p className="small">{t.body}</p>
      <dl className="closeup-parts small">{t.parts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <p className="muted small">Drawn in code at textbook proportions, not a scan; cells are simplified.</p>
    </section>
  );
}
