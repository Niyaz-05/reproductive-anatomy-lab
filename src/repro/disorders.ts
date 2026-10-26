/**
 * Disorders, fertility treatment and a test reader (pure data and functions). Diagnostic criteria and
 * thresholds: Rotterdam criteria for PCOS (2003, as in the 2023 international guideline); NICE NG73
 * (endometriosis), NICE CG156 (fertility: mid-luteal progesterone over 30 nmol/L confirms
 * ovulation), RCOG Green-top 21 (ectopic pregnancy), FIGO classification of fibroids (2011), NHS
 * cervical screening (HPV primary), NICE NG131 and the NHS Prostate Cancer Risk Management Programme
 * (PSA by age), EAU guidelines (BPH, torsion), WHO 2021 (semen). For learning only, not diagnosis.
 */
import type { CycleScenario } from './cycle';
import type { SpermScenario } from './spermatogenesis';
import type { Body } from './contraception';

export interface Disorder {
  id: string; name: string; body: Body;
  /** Structures to highlight. */
  organs: string[];
  what: string; signs: string; tests: string; treatment: string;
  cycle?: CycleScenario; sperm?: SpermScenario;
}
export const DISORDERS: Disorder[] = [
  { id: 'pcos', name: 'Polycystic ovary syndrome (PCOS)', body: 'female', organs: ['ovary-left', 'ovary-right'], cycle: 'pcos', what: 'The commonest hormonal disorder of women (about 1 in 10). High LH and insulin drive the ovaries’ theca cells to make androgens; follicles stop at 2–9 mm, so there is rarely a dominant follicle or ovulation.', signs: 'Irregular or absent periods, excess hair and acne, often weight gain and insulin resistance; many small follicles on ultrasound.', tests: 'Rotterdam: two of irregular ovulation, high androgens (clinical or blood), polycystic ovaries (20 or more follicles per ovary, or AMH in adults). LH:FSH is often above 2, but is not a criterion.', treatment: 'Weight loss if overweight; the combined pill for periods and skin; letrozole to induce ovulation; metformin for insulin resistance.' },
  { id: 'endometriosis', name: 'Endometriosis', body: 'female', organs: ['uterosacral-ligament-left', 'uterosacral-ligament-right', 'ovary-left', 'ovary-right', 'uterovesical-pouch', 'broad-ligament'], cycle: 'normal', what: 'Tissue like endometrium grows outside the uterus (often on the ovaries, the uterosacral ligaments and the pelvic peritoneum), probably from retrograde menstruation. It bleeds with each cycle, causing inflammation and scarring; ovarian cysts of old blood are “chocolate cysts”.', signs: 'Painful periods, pain with sex and on opening the bowels, chronic pelvic pain; subfertility. Diagnosis often takes years.', tests: 'History and examination; transvaginal ultrasound or MRI for cysts and deep disease; laparoscopy confirms it.', treatment: 'Pain relief; hormones that stop the cycle (combined pill, progestogens, GnRH analogues); surgery to remove lesions.' },
  { id: 'fibroids', name: 'Fibroids (leiomyomas)', body: 'female', organs: ['uterine-body', 'uterine-fundus', 'uterine-wall-anterior', 'uterine-wall-posterior'], cycle: 'normal', what: 'Benign growths of the uterine smooth muscle, in up to 70 % of women by 50; oestrogen and progesterone make them grow, so they shrink after the menopause. FIGO types: submucosal (bulging into the cavity), intramural (in the wall), subserosal (on the outside).', signs: 'Heavy periods (submucosal), pelvic pressure, frequent urination; often none.', tests: 'Ultrasound; anaemia on a blood count.', treatment: 'Tranexamic acid or the hormonal coil for bleeding; ulipristal or GnRH analogues to shrink them; myomectomy, embolisation or hysterectomy.' },
  { id: 'ectopic', name: 'Ectopic pregnancy', body: 'female', organs: ['tube-ampulla-left', 'tube-isthmus-left'], cycle: 'pregnant', what: 'The embryo implants outside the uterine cavity, 95 % in a tube, most often the ampulla. Damaged tubes (past infection, surgery) slow the embryo’s journey. The tube cannot hold it and may rupture and bleed.', signs: 'A missed period, then one-sided lower abdominal pain and bleeding at 6–8 weeks; shoulder-tip pain and collapse if it ruptures (an emergency).', tests: 'Positive pregnancy test with no pregnancy in the uterus on transvaginal ultrasound; serum hCG rising less than expected.', treatment: 'Methotrexate for small, stable ones; laparoscopic removal of the tube (salpingectomy) or of the pregnancy.' },
  { id: 'female-infertility', name: 'Female infertility', body: 'female', organs: ['ovary-left', 'ovary-right', 'tube-ampulla-left', 'tube-ampulla-right', 'uterine-body'], cycle: 'normal', what: 'No pregnancy after a year of regular unprotected sex (about 1 in 7 couples). Causes: ovulation disorders (PCOS, thyroid, high prolactin, low weight), blocked tubes (chlamydia, endometriosis), uterine causes, and age: egg number and quality fall, faster after 35.', signs: 'Irregular periods suggest an ovulation problem; often none.', tests: 'Mid-luteal (day 21 of a 28-day cycle) progesterone over 30 nmol/L confirms ovulation; AMH and antral follicle count estimate the reserve; a hysterosalpingogram checks the tubes.', treatment: 'Treat the cause; ovulation induction (letrozole, clomifene); IVF.' },
  { id: 'male-infertility', name: 'Male infertility', body: 'male', organs: ['testis-left', 'testis-right', 'epididymis-left', 'deferent-duct-left'], sperm: 'varicocele', what: 'A male factor in about half of infertile couples. Causes: low sperm production (varicocele, undescended testes, Klinefelter syndrome, chemotherapy, anabolic steroids), blocked ducts (vasectomy, cystic fibrosis: absent deferent ducts), hormonal causes.', signs: 'Usually none; small testes or a varicocele on examination.', tests: 'Semen analysis against the WHO 2021 limits (repeated after 3 months if abnormal); FSH, LH and testosterone; genetics for azoospermia.', treatment: 'Treat the cause; stop steroids; IVF with ICSI (one sperm injected into each egg); surgical sperm retrieval.' },
  { id: 'cervical', name: 'Cervical screening and cancer', body: 'female', organs: ['cervix', 'external-os'], cycle: 'normal', what: 'High-risk human papillomavirus (HPV 16 and 18 above all) infects the transformation zone at the external os; persistent infection can lead to precancerous change (CIN) and, years later, cancer. HPV vaccination prevents most of it.', signs: 'Precancer has none; cancer: bleeding after sex or between periods.', tests: 'NHS screening tests a cervical sample for high-risk HPV first; only HPV-positive samples are examined for abnormal cells (cytology), and abnormal ones go to colposcopy.', treatment: 'Removal of the transformation zone (LLETZ) for CIN; surgery, chemo-radiotherapy for cancer.' },
  { id: 'menopause', name: 'Menopause', body: 'female', organs: ['ovary-left', 'ovary-right', 'uterine-body'], cycle: 'normal', what: 'The ovaries run out of follicles (average age 51): oestradiol and inhibin fall, so FSH and LH rise high. Periods stop; the endometrium and vaginal lining thin; bone loss speeds up.', signs: 'Irregular then absent periods, hot flushes and night sweats, low mood, vaginal dryness.', tests: 'Diagnosed from symptoms after 45; FSH over 30 IU/L on two samples supports it in younger women.', treatment: 'Hormone replacement therapy (oestrogen, with a progestogen if the uterus is present), vaginal oestrogen, lifestyle.' },
  { id: 'bph', name: 'Benign prostatic hyperplasia (BPH)', body: 'male', organs: ['prostate', 'prostatic-urethra', 'urinary-bladder'], what: 'The transition zone of the prostate, around the prostatic urethra, grows with age under dihydrotestosterone (DHT); half of men over 60. It narrows the urethra and the bladder wall thickens.', signs: 'A weak stream, hesitancy, dribbling, frequency and getting up at night; retention of urine.', tests: 'Symptom score, digital rectal examination (smooth, enlarged), urine flow, PSA (often mildly raised).', treatment: 'Alpha-blockers (tamsulosin) relax the smooth muscle; 5-alpha-reductase inhibitors (finasteride) block DHT and shrink it; surgery (TURP).' },
  { id: 'prostate-cancer', name: 'Prostate cancer', body: 'male', organs: ['prostate', 'seminal-vesicle-left', 'seminal-vesicle-right'], what: 'The commonest cancer in men in the UK; mostly in the peripheral zone at the back of the gland, felt on rectal examination. Many grow slowly.', signs: 'Often none early; urinary symptoms; bone pain if it has spread.', tests: 'PSA (raised for age), multiparametric MRI, then targeted biopsy; Gleason grade.', treatment: 'Active surveillance for low risk; surgery (prostatectomy) or radiotherapy; hormone therapy (androgen deprivation) for advanced disease.' },
  { id: 'torsion', name: 'Testicular torsion', body: 'male', organs: ['testis-left', 'epididymis-left', 'testicular-artery-left'], what: 'The testis twists on its spermatic cord, cutting off its blood supply. Most common at 12–18 years; a high, horizontal “bell-clapper” testis is the risk.', signs: 'Sudden severe testicular pain, swelling, nausea; the testis lies high; the cremasteric reflex is absent.', tests: 'A clinical diagnosis: surgery should not wait for scans.', treatment: 'Emergency surgery within 6 hours to untwist and fix both testes (orchidopexy); the testis is lost after about 12 hours.' },
];
export const disorderById = (id: string) => DISORDERS.find((d) => d.id === id);

/** IVF step by step (HFEA; NICE CG156). */
export const IVF_STEPS = [
  { title: 'Ovarian stimulation', text: 'About 10 days of FSH injections recruit many follicles instead of one; a GnRH antagonist prevents an early LH surge. Ultrasound tracks the follicles.' },
  { title: 'Trigger', text: 'hCG (or a GnRH agonist) mimics the LH surge to finish the eggs’ maturation, 36 hours before collection.' },
  { title: 'Egg collection', text: 'A needle guided by transvaginal ultrasound passes through the vaginal fornix into each follicle and draws out its fluid and egg.' },
  { title: 'Fertilisation', text: 'Eggs are mixed with prepared sperm (IVF), or one sperm is injected into each egg (ICSI) for male-factor infertility.' },
  { title: 'Embryo culture', text: 'Embryos grow in the laboratory for 3–5 days, to the blastocyst stage; spares can be frozen.' },
  { title: 'Embryo transfer', text: 'Usually one embryo is passed through the cervix into the uterine cavity with a fine catheter (single embryo transfer avoids twins).' },
  { title: 'Luteal support and the test', text: 'Progesterone supports the endometrium; a pregnancy test follows about 2 weeks later. About 1 in 3 transfers in women under 35 leads to a birth (HFEA).' },
];

export type Reading = { level: 'ok' | 'warn' | 'info'; text: string };
/** Serum hCG (IU/L). */
export function readHcg(iu: number): Reading {
  if (!Number.isFinite(iu) || iu < 0) return { level: 'info', text: 'Enter a value.' };
  if (iu < 5) return { level: 'ok', text: 'Negative: not pregnant (or too early: retest in 48 hours).' };
  if (iu < 25) return { level: 'warn', text: 'Equivocal: repeat in 48 hours; a normal pregnancy roughly doubles.' };
  if (iu < 1500) return { level: 'info', text: 'Positive, early (about 4–5 weeks). A pregnancy may not be seen on ultrasound yet; if there is pain or bleeding, ectopic pregnancy must be excluded with serial hCG and scans.' };
  return { level: 'info', text: 'Positive. Above about 1500 IU/L a pregnancy in the uterus should be seen on transvaginal ultrasound.' };
}
/** Mid-luteal progesterone (nmol/L), about 7 days before the expected period. */
export function readProgesterone(nmol: number): Reading {
  if (!Number.isFinite(nmol) || nmol < 0) return { level: 'info', text: 'Enter a value.' };
  if (nmol > 30) return { level: 'ok', text: 'Over 30 nmol/L: ovulation has occurred (a corpus luteum is making progesterone).' };
  if (nmol >= 16) return { level: 'warn', text: '16–30 nmol/L: repeat; the sample may have been taken on the wrong day of the cycle.' };
  return { level: 'warn', text: 'Under 16 nmol/L: probably no ovulation this cycle (think of PCOS, thyroid disease, high prolactin, low weight).' };
}
/** AMH (pmol/L): ovarian reserve (NICE CG156 thresholds). */
export function readAmh(pmol: number): Reading {
  if (!Number.isFinite(pmol) || pmol < 0) return { level: 'info', text: 'Enter a value.' };
  if (pmol <= 5.4) return { level: 'warn', text: 'Low (5.4 pmol/L or less): a low ovarian reserve; a low response to IVF stimulation is likely.' };
  if (pmol >= 25) return { level: 'warn', text: 'High (25 pmol/L or more): a high response to stimulation is likely (risk of ovarian hyperstimulation); seen in PCOS.' };
  return { level: 'ok', text: 'In the usual range for a normal response to stimulation.' };
}
/** FSH and LH (IU/L), early follicular phase. */
export function readFshLh(fsh: number, lh: number, body: Body): Reading {
  if (![fsh, lh].every((x) => Number.isFinite(x) && x >= 0)) return { level: 'info', text: 'Enter both values.' };
  if (body === 'male') {
    if (fsh > 12 || lh > 9) return { level: 'warn', text: 'High LH and FSH: primary testicular failure (for example Klinefelter syndrome, or after chemotherapy or torsion).' };
    if (fsh < 1.5 && lh < 1.5) return { level: 'warn', text: 'Low LH and FSH: the hypothalamus or pituitary is suppressed (anabolic steroids, pituitary disease, Kallmann syndrome).' };
    return { level: 'ok', text: 'Within the usual adult male ranges.' };
  }
  if (fsh > 30) return { level: 'warn', text: 'FSH over 30 IU/L: the ovaries are failing (menopause, or premature ovarian insufficiency before 40).' };
  if (lh / Math.max(fsh, 0.1) > 2) return { level: 'warn', text: 'LH more than twice FSH: often seen in PCOS (supportive, not diagnostic).' };
  if (fsh < 1 && lh < 1) return { level: 'warn', text: 'Both very low: hypothalamic suppression (low weight, excess exercise, stress), pituitary disease, or hormonal contraception.' };
  return { level: 'ok', text: 'Within the usual early follicular ranges.' };
}
/** PSA (ng/mL) against the NHS age-specific thresholds. */
export function readPsa(ng: number, age: number): Reading {
  if (!Number.isFinite(ng) || ng < 0 || !Number.isFinite(age)) return { level: 'info', text: 'Enter a value and an age.' };
  const limit = age < 50 ? 2.5 : age < 70 ? 3 : 5;
  if (ng >= limit) return { level: 'warn', text: `Raised for age ${Math.round(age)} (threshold ${limit} ng/mL): refer for MRI and possible biopsy. Infection, BPH, a recent ejaculation or cycling can also raise PSA.` };
  return { level: 'ok', text: `Below the threshold for age ${Math.round(age)} (${limit} ng/mL). A normal PSA does not rule out cancer.` };
}
