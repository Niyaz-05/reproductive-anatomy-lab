/**
 * Content shared by the two bodies: sources, camera presets, objectives, disclaimers, helpers to
 * write structures, and the guided tour (each step names its body).
 */
import type { AnatomicalStructure, CameraPreset, Source, TourStep } from '../../contract/schema';

export const SOURCES: Source[] = [
  { id: 'openstax-ap', citation: 'Betts JG et al. Anatomy and Physiology 2e, chapters 27 (The Reproductive System) and 28 (Development and Inheritance). OpenStax, 2022.', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/27-introduction', license: 'CC BY 4.0' },
  { id: 'openstax-dev', citation: 'Betts JG et al. Anatomy and Physiology 2e, chapter 28: Development and Inheritance. OpenStax, 2022.', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/28-introduction', license: 'CC BY 4.0' },
  { id: 'guyton', citation: 'Hall JE, Hall ME. Guyton and Hall Textbook of Medical Physiology, 14th ed., chapters 81–83. Elsevier, 2021.' },
  { id: 'grays', citation: 'Standring S, ed. Gray’s Anatomy: The Anatomical Basis of Clinical Practice, 42nd ed. Elsevier, 2021.' },
  { id: 'moore', citation: 'Moore KL, Persaud TVN, Torchia MG. The Developing Human: Clinically Oriented Embryology, 11th ed. Elsevier, 2019.' },
  { id: 'williams', citation: 'Cunningham FG et al. Williams Obstetrics, 26th ed. McGraw Hill, 2022.' },
  { id: 'speroff', citation: 'Taylor HS, Pal L, Seli E. Speroff’s Clinical Gynecologic Endocrinology and Infertility, 9th ed. Wolters Kluwer, 2019.' },
  { id: 'hra', citation: 'Browne K, Schlehlein H et al. 3D Reference Organ Set for Female, v1.5. HuBMAP Human Reference Atlas, 2023.', url: 'https://doi.org/10.48539/HBM352.BTSQ.586', license: 'CC BY 4.0' },
  { id: 'bp3d', citation: 'Mitsuhashi N et al. BodyParts3D: 3D structure database for anatomical concepts. Nucleic Acids Res 2009;37:D782–5. Database Center for Life Science (DBCLS).', url: 'https://doi.org/10.1093/nar/gkn613', license: 'CC BY 4.0' },
  { id: 'who-2021', citation: 'World Health Organization. WHO laboratory manual for the examination and processing of human semen, 6th ed. WHO, 2021.', url: 'https://www.who.int/publications/i/item/9789240030787' },
  { id: 'wilcox-1995', citation: 'Wilcox AJ, Weinberg CR, Baird DD. Timing of sexual intercourse in relation to ovulation. N Engl J Med 1995;333:1517–21.', url: 'https://doi.org/10.1056/NEJM199512073332301' },
  { id: 'robinson-1975', citation: 'Robinson HP, Fleming JE. A critical evaluation of sonar crown–rump length measurements. Br J Obstet Gynaecol 1975;82:702–10.', url: 'https://doi.org/10.1111/j.1471-0528.1975.tb00710.x' },
  { id: 'hadlock-1991', citation: 'Hadlock FP, Harrist RB, Martinez-Poyer J. In utero analysis of fetal growth: a sonographic weight standard. Radiology 1991;181:129–33.', url: 'https://doi.org/10.1148/radiology.181.1.1887021' },
  { id: 'zhang-2010', citation: 'Zhang J et al. Contemporary patterns of spontaneous labor with normal neonatal outcomes. Obstet Gynecol 2010;116:1281–7.', url: 'https://doi.org/10.1097/AOG.0b013e3181fdef6e' },
  { id: 'hoff-1983', citation: 'Hoff JD, Quigley ME, Yen SSC. Hormonal dynamics at midcycle: a reevaluation. J Clin Endocrinol Metab 1983;57:792–6.', url: 'https://doi.org/10.1210/jcem-57-4-792' },
  { id: 'heller-1963', citation: 'Heller CG, Clermont Y. Spermatogenesis in man: an estimate of its duration. Science 1963;140:184–6.', url: 'https://doi.org/10.1126/science.140.3563.184' },
  { id: 'suarez-2006', citation: 'Suarez SS, Pacey AA. Sperm transport in the female reproductive tract. Hum Reprod Update 2006;12:23–37.', url: 'https://doi.org/10.1093/humupd/dmi047' },
  { id: 'trussell-2011', citation: 'Trussell J. Contraceptive failure in the United States. Contraception 2011;83:397–404.', url: 'https://doi.org/10.1016/j.contraception.2011.01.021' },
  { id: 'cdc-mec', citation: 'Centers for Disease Control and Prevention. Effectiveness of family planning methods (chart), with the US Medical Eligibility Criteria for Contraceptive Use, 2024.' },
  { id: 'fsrh-ec', citation: 'Faculty of Sexual and Reproductive Healthcare. Emergency Contraception guideline, 2017 (amended 2023).' },
  { id: 'pcos-2023', citation: 'Teede HJ et al. Recommendations from the 2023 international evidence-based guideline for the assessment and management of polycystic ovary syndrome. J Clin Endocrinol Metab 2023;108:2447–69.', url: 'https://doi.org/10.1210/clinem/dgad463' },
  { id: 'nice-ng73', citation: 'NICE guideline NG73: Endometriosis: diagnosis and management, 2017 (updated 2024).', url: 'https://www.nice.org.uk/guidance/ng73' },
  { id: 'nice-cg156', citation: 'NICE clinical guideline CG156: Fertility problems: assessment and treatment, 2013 (updated 2017).', url: 'https://www.nice.org.uk/guidance/cg156' },
  { id: 'rcog-ectopic', citation: 'Royal College of Obstetricians and Gynaecologists. Diagnosis and management of ectopic pregnancy (Green-top Guideline 21). BJOG 2016;123:e15–55.', url: 'https://doi.org/10.1111/1471-0528.14189' },
  { id: 'figo-2011', citation: 'Munro MG et al. FIGO classification system (PALM-COEIN) for causes of abnormal uterine bleeding. Int J Gynaecol Obstet 2011;113:3–13.', url: 'https://doi.org/10.1016/j.ijgo.2010.11.011' },
  { id: 'nhs-cervical', citation: 'NHS Cervical Screening Programme: screening protocols (HPV primary screening). UK Health Security Agency / NHS England.', url: 'https://www.gov.uk/government/collections/cervical-screening-professional-guidance' },
  { id: 'nice-ng131', citation: 'NICE guideline NG131: Prostate cancer: diagnosis and management, 2019 (updated 2021); NHS Prostate Cancer Risk Management Programme.', url: 'https://www.nice.org.uk/guidance/ng131' },
  { id: 'eau', citation: 'European Association of Urology. Guidelines on Male Sexual and Reproductive Health, Non-neurogenic Male LUTS (BPH) and Paediatric Urology, 2024.', url: 'https://uroweb.org/guidelines' },
  { id: 'nice-ng201', citation: 'NICE guideline NG201: Antenatal care, 2021.', url: 'https://www.nice.org.uk/guidance/ng201' },
  { id: 'nice-ng235', citation: 'NICE guideline NG235: Intrapartum care, 2023.', url: 'https://www.nice.org.uk/guidance/ng235' },
  { id: 'hfea', citation: 'Human Fertilisation and Embryology Authority. Fertility treatment: trends and figures; IVF explained.', url: 'https://www.hfea.gov.uk/' },
  { id: 'oconnell-2005', citation: 'O’Connell HE, Sanjeevan KV, Hutson JM. Anatomy of the clitoris. J Urol 2005;174:1189–95.', url: 'https://doi.org/10.1097/01.ju.0000173639.38898.cd' },
];

export const CAMERAS: CameraPreset[] = [
  { id: 'anterior', label: 'Front', direction: [0, 0.12, 1] },
  { id: 'posterior', label: 'Back', direction: [0, 0.12, -1] },
  { id: 'left', label: 'Left side', direction: [1, 0.08, 0.02] },
  { id: 'right', label: 'Right side', direction: [-1, 0.08, 0.02] },
  { id: 'superior', label: 'From above', direction: [0, 1, 0.0001], up: [0, 0, -1] },
  { id: 'inferior', label: 'From below', direction: [0, -1, 0.35] },
  { id: 'oblique', label: '3/4', direction: [0.65, 0.3, 0.75] },
];

export const DISCLAIMERS = [
  'For learning only. Not a diagnostic, fertility, contraception or obstetric tool: ask a doctor, midwife or sexual health service.',
  'The organs are from scanned reference bodies (the HuBMAP female body and BodyParts3D); parts no open scan has are modelled and marked as such.',
  'The physiology models are teaching models with textbook values; real people vary widely.',
  'University anatomy: the genital organs and their physiology are named and explained in medical terms; no sexual activity is shown.',
];

/** Defaults for a structure entry. */
export function S(o: Partial<AnatomicalStructure> & Pick<AnatomicalStructure, 'id' | 'label' | 'layer' | 'summary' | 'function'>): AnatomicalStructure {
  return { kind: 'mesh', side: 'midline', synonyms: [], related: [], sources: ['openstax-ap', 'grays'], ...o };
}
/** A left and a right structure from one description; `{side}` in the text is replaced. */
export function pair(id: string, label: string, o: Omit<Partial<AnatomicalStructure>, 'id' | 'label' | 'side'> & Pick<AnatomicalStructure, 'layer' | 'summary' | 'function'>, perSide: (side: 'left' | 'right') => Partial<AnatomicalStructure> = () => ({})): AnatomicalStructure[] {
  return (['left', 'right'] as const).map((side) => {
    const sub = (t: string) => t.replaceAll('{side}', side);
    const p = perSide(side);
    return S({
      ...o, ...p, id: `${id}-${side}`, label: `${label} (${side})`, side,
      summary: sub(p.summary ?? o.summary), function: sub(p.function ?? o.function),
      related: (p.related ?? o.related ?? []).map(sub),
      homologue: p.homologue ?? (o.homologue ? sub(o.homologue) : undefined),
    });
  });
}
export const group = (id: string, label: string, layer: string, members: string[], o: Omit<Partial<AnatomicalStructure>, 'id' | 'label' | 'layer' | 'members' | 'kind'> & Pick<AnatomicalStructure, 'summary' | 'function'>): AnatomicalStructure =>
  S({ ...o, id, label, layer, kind: 'group', members });

const T = (o: TourStep) => o;
/** The guided tour across both bodies. */
export const TOUR: TourStep[] = [
  T({ id: 'female-overview', body: 'female', title: 'The female reproductive organs', text: 'The ovaries make eggs and hormones; the uterine tubes catch the egg and are where it is fertilised; the uterus carries a pregnancy; the vagina links the cervix to the outside. These organs are from a scanned reference body (HuBMAP), placed in its real pelvis between the bladder in front and the rectum behind.', focus: ['uterus', 'uterine-tube-left', 'uterine-tube-right', 'ovary-left', 'ovary-right', 'vagina'], camera: 'anterior', mode: 'explore' }),
  T({ id: 'uterus', body: 'female', title: 'The uterus', text: 'A thick-walled muscular organ about the size of a pear (this body’s is small: about 4 cm across the body). The fundus lies above the openings of the tubes, the body below them, and the cervix projects into the vagina. It normally tips forward over the bladder (anteverted) and bends forward on itself (anteflexed), as here.', focus: ['uterus', 'urinary-bladder', 'rectum'], camera: 'left', mode: 'explore' }),
  T({ id: 'uterus-layers', body: 'female', title: 'Inside the uterus', text: 'Cut through the middle: the thick smooth-muscle wall (myometrium) surrounds a slit-like cavity lined by the endometrium. Only the endometrium’s functional layer is shed each month; its basal layer regrows it. Peritoneum (perimetrium) covers the outside.', focus: ['myometrium', 'endometrium', 'cervix'], camera: 'left', mode: 'explore', slice: { axis: 'sagittal', through: 'uterine-body' }, isolate: true, tint: false }),
  T({ id: 'tubes', body: 'female', title: 'The uterine tubes', text: 'Each tube is about 10 cm: the narrow isthmus beside the uterus, the wide ampulla where fertilisation happens, and the funnel-shaped infundibulum whose finger-like fimbriae sweep over the ovary at ovulation. Cilia and muscle move the egg and embryo towards the uterus.', focus: ['uterine-tube-left', 'uterine-tube-right', 'ovary-left', 'ovary-right', 'uterus'], camera: 'superior', mode: 'explore', isolate: true }),
  T({ id: 'ligaments', body: 'female', title: 'What holds them in place', text: 'The broad ligament, a sheet of peritoneum, drapes over the uterus, tubes and ovaries. The ovarian ligament ties each ovary to the uterus, the suspensory ligament carries its vessels from the pelvic wall, and the round ligament runs to the inguinal canal. The cardinal and uterosacral ligaments support the cervix.', focus: ['broad-ligament', 'ovarian-ligament-left', 'suspensory-ligament-left', 'round-ligament-left', 'cardinal-ligament-left', 'uterosacral-ligament-left'], camera: 'oblique', mode: 'explore' }),
  T({ id: 'menses', body: 'female', title: 'Day 3: menstruation', text: 'The corpus luteum of the last cycle has failed, so progesterone has fallen: the spiral arteries constrict and the functional layer of the endometrium is shed with blood. Without progesterone and oestradiol holding it down, FSH rises and a new group of follicles starts to grow.', focus: ['endometrium', 'ovary-left', 'ovary-right'], mode: 'cycle', day: 3, frame: 'mode' }),
  T({ id: 'follicular', body: 'female', title: 'Day 10: one follicle wins', text: 'One follicle, the most sensitive to FSH, has been selected. As it grows it makes more and more oestradiol, which feeds back to lower FSH, so the others regress. Oestradiol rebuilds the endometrium (the proliferative phase) and makes the cervical mucus thin and stretchy.', focus: ['ovary-left', 'endometrium'], mode: 'cycle', day: 10, frame: 'mode' }),
  T({ id: 'surge', body: 'female', title: 'Day 14: the surge and ovulation', text: 'When oestradiol has stayed high for about 36 hours, its feedback switches from negative to positive: the pituitary releases a surge of LH (and FSH). The surge restarts the egg’s meiosis and, about 36 hours later, the follicle ruptures and releases the egg into the fimbriae.', focus: ['ovary-left', 'tube-fimbriae-left'], mode: 'cycle', day: 14.5, frame: 'mode' }),
  T({ id: 'luteal', body: 'female', title: 'Day 21: the corpus luteum', text: 'The empty follicle becomes the corpus luteum, which makes progesterone (and oestradiol and inhibin A). Progesterone makes the endometrium secretory, ready for an embryo, and holds LH and FSH down. Without hCG from an embryo it fails after about 14 days, and the next period begins.', focus: ['ovary-left', 'endometrium'], mode: 'cycle', day: 21, frame: 'mode' }),
  T({ id: 'follicle-closeup', body: 'female', title: 'Inside a follicle', text: 'A mature (Graafian) follicle: the egg in its zona pellucida and corona radiata on a mound of granulosa cells, a fluid-filled antrum, and theca cells outside making the androgens that the granulosa cells turn into oestradiol (the two-cell, two-gonadotropin model).', focus: ['ovary-left'], mode: 'cycle', day: 13, closeUp: 'follicle' }),
  T({ id: 'sperm-journey', body: 'female', title: 'The sperm’s journey', text: 'Of about 250 million sperm deposited in the vagina, about 1 % pass the cervical mucus, some thousands reach the tubes and a few hundred reach the egg in the ampulla. Sperm survive up to 5 days, the egg about a day, so the fertile window is the 6 days ending on ovulation day.', focus: ['vagina', 'cervix', 'uterus', 'uterine-tube-left'], mode: 'fertilisation', fertDay: 0, frame: 'mode' }),
  T({ id: 'fertilisation', body: 'female', title: 'Fertilisation', text: 'Capacitated sperm reach the egg; one passes the corona radiata, its acrosome releases enzymes that digest a path through the zona pellucida, and its membrane fuses with the egg’s. The cortical reaction then hardens the zona so no other sperm get in, and the egg completes meiosis II.', focus: ['tube-ampulla-left'], mode: 'fertilisation', fertDay: 0, closeUp: 'fertilisation' }),
  T({ id: 'cleavage', body: 'female', title: 'Cleavage to blastocyst', text: 'The zygote divides as it travels down the tube: 2 cells at about 30 hours, 8 cells on day 3, a morula on day 4 as it enters the uterus, and a blastocyst on day 5, with an inner cell mass (the future embryo) and a trophoblast (the future placenta).', focus: ['tube-isthmus-left', 'uterine-body'], mode: 'fertilisation', fertDay: 5, closeUp: 'embryo' }),
  T({ id: 'implantation', body: 'female', title: 'Implantation', text: 'On days 6–10 the blastocyst attaches to the secretory endometrium, usually high on the back wall, and burrows in. Its trophoblast makes hCG, which rescues the corpus luteum: progesterone stays high, the lining is kept and there is no period. Pregnancy tests detect hCG.', focus: ['endometrium', 'uterine-wall-posterior'], mode: 'fertilisation', fertDay: 9, frame: 'mode' }),
  T({ id: 'first-trimester', body: 'female', title: '12 weeks', text: 'All the main organs have formed (weeks 3–8 are the most sensitive to harm); the embryo has become a fetus about 6 cm long. The uterus rises out of the pelvis, and the placenta has taken over progesterone from the corpus luteum.', focus: ['gravid-uterus', 'placenta'], mode: 'pregnancy', week: 12, frame: 'mode' }),
  T({ id: 'placenta', body: 'female', title: 'The placenta', text: 'Fetal blood in the villi passes close to the mother’s blood in the intervillous space: oxygen, glucose and antibodies cross one way, carbon dioxide and urea the other; the two bloods do not mix. This is the HuBMAP full-term placenta, with the umbilical cord’s two arteries and one vein.', focus: ['placenta', 'umbilical-cord'], mode: 'pregnancy', week: 30, closeUp: 'villi' }),
  T({ id: 'term', body: 'female', title: 'Term', text: 'At 36 weeks the fundus reaches the xiphoid; by 40 weeks the head engages in the pelvis and the fundus drops. The uterus has grown from about 60 g to about 1 kg and holds the fetus (about 3.5 kg), placenta and about 800 mL of amniotic fluid.', focus: ['gravid-uterus', 'placenta'], mode: 'pregnancy', week: 38, frame: 'mode', camera: 'left' }),
  T({ id: 'labour', body: 'female', title: 'Labour', text: 'Contractions open the cervix; the head presses on it, and stretch receptors drive oxytocin release from the posterior pituitary, which strengthens the contractions, which stretch more: a positive feedback loop (the Ferguson reflex) that ends only with the birth.', focus: ['gravid-uterus', 'cervix'], mode: 'birth', labourH: 10.4, frame: 'mode', camera: 'left' }),
  T({ id: 'breastfeeding', body: 'female', title: 'Breastfeeding', text: 'After delivery progesterone falls, so prolactin can start milk production in the alveoli. Suckling sends signals to the hypothalamus: prolactin rises for the next feed and oxytocin contracts the myoepithelial cells around the alveoli, pushing milk along the ducts to the nipple (the let-down reflex).', focus: ['breast-left', 'breast-right'], camera: 'anterior', mode: 'birth', labourH: 3, feeding: true }),
  T({ id: 'male-overview', body: 'male', title: 'The male reproductive organs', text: 'The testes make sperm and testosterone; the epididymis matures and stores sperm; the deferent duct carries them up the spermatic cord to the prostate; the seminal vesicles and prostate add most of the semen; the urethra carries it through the penis. These organs are from BodyParts3D (a male body).', focus: ['testis-left', 'epididymis-left', 'deferent-duct-left', 'seminal-vesicle-left', 'prostate', 'penis'], camera: 'anterior', mode: 'explore' }),
  T({ id: 'spermatogenesis', body: 'male', title: 'Making sperm', text: 'In the seminiferous tubules, spermatogonia on the basement membrane divide; their daughters pass the blood–testis barrier between the Sertoli cells, go through meiosis and become spermatids, which grow tails and are released. It takes about 74 days; Leydig cells between the tubules make the testosterone it needs.', focus: ['testis-left'], mode: 'sperm', sperm: 'normal', closeUp: 'tubule' }),
  T({ id: 'sperm-route', body: 'male', title: 'The route of sperm', text: 'Testis → epididymis (2–12 days) → deferent duct, up the spermatic cord, through the inguinal canal, over the pelvic brim and down behind the bladder → ejaculatory duct through the prostate → urethra. The seminal vesicles and prostate add fructose, buffers and enzymes.', focus: ['epididymis-left', 'deferent-duct-left', 'ejaculatory-duct-left', 'seminal-vesicle-left', 'prostate', 'urethra'], mode: 'sperm', sperm: 'normal', frame: 'mode' }),
  T({ id: 'homologues', body: 'male', title: 'Same beginnings', text: 'Until about week 7 the embryo’s genital organs are the same in both sexes. With a Y chromosome (SRY) the gonads become testes; their testosterone keeps the Wolffian ducts and their anti-Müllerian hormone removes the Müllerian ducts. Colour: Origin pairs each part with its homologue: glans with clitoral glans, scrotum with labia majora, testis with ovary.', focus: ['testis-left', 'scrotum', 'glans-penis', 'corpus-spongiosum'], mode: 'explore', colourBy: 'origin', camera: 'anterior' }),
  T({ id: 'contraception', body: 'female', title: 'How the pill works', text: 'The combined pill’s oestrogen and progestogen feed back on the hypothalamus and pituitary, so FSH stays too low to select a follicle and the LH surge never comes: no ovulation. Pick other methods to see where each acts, and how often each fails with perfect and typical use.', focus: ['ovary-left', 'ovary-right', 'cervix'], mode: 'contraception', method: 'combined-pill', frame: 'mode' }),
];
