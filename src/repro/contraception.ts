/**
 * Contraception (pure data): how each method works, where it acts, and how often it fails.
 * Failure: the percentage of women with an unintended pregnancy in the first year, with perfect use
 * and with typical use (Trussell 2011, Contraception 83:397; the CDC “Effectiveness of family planning
 * methods” chart for typical use). Emergency contraception: FSRH guideline 2017 (updated 2023).
 * `cycle`: what the method does to the menstrual cycle model (the pill scenario stops the surge).
 */
import type { CycleScenario } from './cycle';

export type Body = 'female' | 'male';
export type MethodKind = 'hormonal' | 'device' | 'barrier' | 'behaviour' | 'permanent' | 'emergency' | 'none';
export interface Method {
  id: string; name: string; kind: MethodKind; body: Body;
  /** Structures it acts on, in its body. */
  actsOn: string[];
  how: string;
  perfect: [number, number]; typical: [number, number];
  cycle: CycleScenario;
  lasts: string;
}
const r = (a: number, b = a): [number, number] => [a, b];

export const METHODS: Method[] = [
  { id: 'implant', name: 'Implant (etonogestrel)', kind: 'hormonal', body: 'female', actsOn: ['ovary-left', 'ovary-right', 'cervix'], how: 'A rod under the skin of the arm releases a progestogen that stops ovulation (it blocks the LH surge) and thickens the cervical mucus.', perfect: r(0.05), typical: r(0.05, 0.1), cycle: 'pill', lasts: '3 years' },
  { id: 'lng-ius', name: 'Hormonal coil (LNG-IUS)', kind: 'device', body: 'female', actsOn: ['uterine-body', 'endometrium', 'cervix'], how: 'A T-shaped device in the uterus releases levonorgestrel locally: it thins the endometrium and thickens the cervical mucus. Most users still ovulate; periods become light or stop.', perfect: r(0.2), typical: r(0.1, 0.4), cycle: 'normal', lasts: '3–8 years' },
  { id: 'copper-iud', name: 'Copper coil (Cu-IUD)', kind: 'device', body: 'female', actsOn: ['uterine-body', 'endometrium', 'tube-ampulla-left', 'tube-ampulla-right'], how: 'Copper ions are toxic to sperm and egg and cause a sterile inflammation of the endometrium that prevents implantation. No hormones: ovulation and periods continue (often heavier).', perfect: r(0.6), typical: r(0.8), cycle: 'normal', lasts: '5–10 years' },
  { id: 'injection', name: 'Injection (DMPA)', kind: 'hormonal', body: 'female', actsOn: ['ovary-left', 'ovary-right', 'cervix', 'endometrium'], how: 'Medroxyprogesterone acetate every 13 weeks stops ovulation, thickens mucus and thins the lining. Fertility can take up to a year to return.', perfect: r(0.2), typical: r(4), cycle: 'pill', lasts: '13 weeks' },
  { id: 'combined-pill', name: 'Combined pill', kind: 'hormonal', body: 'female', actsOn: ['ovary-left', 'ovary-right', 'cervix', 'endometrium'], how: 'Ethinylestradiol and a progestogen feed back on the hypothalamus and pituitary: FSH stays too low to select a follicle and there is no LH surge. The 7-day break gives a withdrawal bleed, not a period; follicles start to grow again in the break, so missed pills at the start or end of a pack matter most.', perfect: r(0.3), typical: r(7), cycle: 'pill', lasts: 'daily' },
  { id: 'pop', name: 'Progestogen-only pill (desogestrel)', kind: 'hormonal', body: 'female', actsOn: ['ovary-left', 'ovary-right', 'cervix'], how: 'Desogestrel stops ovulation in most cycles and thickens the cervical mucus; no oestrogen, so it suits those who cannot take it.', perfect: r(0.3), typical: r(7), cycle: 'pill', lasts: 'daily' },
  { id: 'patch-ring', name: 'Patch or vaginal ring', kind: 'hormonal', body: 'female', actsOn: ['ovary-left', 'ovary-right', 'vagina'], how: 'The same hormones as the combined pill, through the skin or the vaginal wall.', perfect: r(0.3), typical: r(7), cycle: 'pill', lasts: 'weekly / monthly' },
  { id: 'male-condom', name: 'Condom (external)', kind: 'barrier', body: 'male', actsOn: ['glans-penis', 'corpus-spongiosum', 'spongy-urethra'], how: 'A latex or polyurethane sheath over the erect penis keeps semen out of the vagina. The only method here that also protects against sexually transmitted infections.', perfect: r(2), typical: r(13), cycle: 'normal', lasts: 'each time' },
  { id: 'internal-condom', name: 'Internal condom', kind: 'barrier', body: 'female', actsOn: ['vagina', 'cervix'], how: 'A pouch lining the vagina, with a ring at each end; also protects against infections.', perfect: r(5), typical: r(21), cycle: 'normal', lasts: 'each time' },
  { id: 'diaphragm', name: 'Diaphragm or cap with spermicide', kind: 'barrier', body: 'female', actsOn: ['cervix', 'vaginal-fornix'], how: 'A dome of silicone covers the cervix, with spermicide; left in for 6 hours after sex.', perfect: r(16), typical: r(17), cycle: 'normal', lasts: 'each time' },
  { id: 'fertility-awareness', name: 'Fertility awareness', kind: 'behaviour', body: 'female', actsOn: ['ovary-left', 'ovary-right', 'cervix'], how: 'Avoiding sex in the fertile window, found from cycle dates, waking temperature (progesterone raises it about 0.3 °C after ovulation) and the stretchy mid-cycle mucus. Works only with careful daily records.', perfect: r(0.4, 5), typical: r(2, 23), cycle: 'normal', lasts: 'every cycle' },
  { id: 'withdrawal', name: 'Withdrawal', kind: 'behaviour', body: 'male', actsOn: ['spongy-urethra', 'glans-penis'], how: 'The penis is withdrawn before ejaculation. Fluid before ejaculation can carry sperm, and timing fails.', perfect: r(4), typical: r(20), cycle: 'normal', lasts: 'each time' },
  { id: 'female-sterilisation', name: 'Female sterilisation', kind: 'permanent', body: 'female', actsOn: ['tube-isthmus-left', 'tube-isthmus-right'], how: 'The tubes are clipped or removed (laparoscopy), so sperm and egg cannot meet. Ovulation and periods continue.', perfect: r(0.5), typical: r(0.5), cycle: 'normal', lasts: 'permanent' },
  { id: 'vasectomy', name: 'Vasectomy', kind: 'permanent', body: 'male', actsOn: ['deferent-duct-left', 'deferent-duct-right'], how: 'Each deferent duct is cut and sealed through a small opening in the scrotum. Sperm can no longer pass; hormones and semen volume are unchanged. Effective after about 3 months, confirmed by a semen test.', perfect: r(0.1), typical: r(0.15), cycle: 'normal', lasts: 'permanent' },
  { id: 'ec-levonorgestrel', name: 'Emergency pill: levonorgestrel', kind: 'emergency', body: 'female', actsOn: ['ovary-left', 'ovary-right'], how: 'One 1.5 mg tablet within 72 hours: it delays the LH surge and so ovulation; it does not work once the surge has started and does not disrupt an implanted pregnancy.', perfect: r(1.7), typical: r(2.6), cycle: 'normal', lasts: 'once' },
  { id: 'ec-ulipristal', name: 'Emergency pill: ulipristal', kind: 'emergency', body: 'female', actsOn: ['ovary-left', 'ovary-right'], how: 'A progesterone receptor modulator, within 120 hours: it can delay ovulation even after the LH has started to rise, so it is more effective than levonorgestrel.', perfect: r(1.2), typical: r(1.8), cycle: 'normal', lasts: 'once' },
  { id: 'ec-copper', name: 'Emergency copper coil', kind: 'emergency', body: 'female', actsOn: ['uterine-body', 'endometrium'], how: 'Fitted within 5 days of sex (or of the earliest likely ovulation): the most effective emergency method, and it then continues as contraception.', perfect: r(0.1), typical: r(0.1), cycle: 'normal', lasts: 'once, then 5–10 years' },
  { id: 'none', name: 'No method', kind: 'none', body: 'female', actsOn: [], how: 'About 85 in 100 sexually active couples using nothing conceive within a year.', perfect: r(85), typical: r(85), cycle: 'normal', lasts: '' },
];
export const methodById = (id: string) => METHODS.find((m) => m.id === id);
export const KIND_LABEL: Record<MethodKind, string> = { hormonal: 'Hormonal', device: 'Coil', barrier: 'Barrier', behaviour: 'Behaviour', permanent: 'Permanent', emergency: 'Emergency', none: 'None' };
/** “0.3 %” or “2–23 %”. */
export const pct = ([a, b]: [number, number]) => (a === b ? `${a} %` : `${a}–${b} %`);
/** How many of 100 couples using it for a year would conceive (typical use, upper bound). */
export const per100 = (m: Method) => Math.max(1, Math.round(m.typical[1]));
