import type { Body, Mode } from '../contract/schema';

/** The modes each body has (the others switch body). */
export const BODY_MODES: Record<Body, readonly Mode[]> = {
  female: ['explore', 'cycle', 'fertilisation', 'pregnancy', 'birth', 'contraception', 'disorders', 'tour'],
  male: ['explore', 'sperm', 'contraception', 'disorders', 'tour'],
};
/** The body a body-specific mode belongs to. */
export const MODE_BODY: Partial<Record<Mode, Body>> = { cycle: 'female', fertilisation: 'female', pregnancy: 'female', birth: 'female', sperm: 'male' };

type ModeLists = Partial<Record<Mode, readonly string[]>>;
const FEMALE_OVERVIEW = ['uterus', 'tubes', 'ovaries', 'ligaments', 'vagina', 'vulva', 'urinary', 'gut', 'bone', 'artery', 'vein'];
const PREGNANT = ['pregnancy', 'tubes', 'ovaries', 'urinary', 'bone', 'skeleton', 'artery', 'vein', 'breasts', 'breast-fat', 'neighbours', 'vulva'];
const MALE_OVERVIEW = ['testes', 'scrotum', 'ducts', 'glands', 'penis', 'urinary', 'gut', 'bone', 'artery', 'vein'];

/** Which layers each mode shows (the learner's layer toggles apply in Anatomy mode). */
export const MODE_LAYERS: Record<Body, ModeLists> = {
  female: {
    cycle: ['uterus', 'tubes', 'ovaries', 'vagina', 'bone'],
    fertilisation: ['uterus', 'tubes', 'ovaries', 'vagina', 'bone'],
    pregnancy: PREGNANT,
    birth: [...PREGNANT, 'vagina', 'pelvic-floor'],
    contraception: FEMALE_OVERVIEW,
    disorders: FEMALE_OVERVIEW,
  },
  male: {
    sperm: ['testes', 'scrotum', 'ducts', 'glands', 'penis', 'urinary', 'bone', 'artery', 'vein'],
    contraception: MALE_OVERVIEW,
    disorders: MALE_OVERVIEW,
  },
};
/** Single structures a mode adds to its layers. */
export const MODE_EXTRA: Record<Body, ModeLists> = {
  female: {
    cycle: ['endometrium', 'abdominal-aorta', 'inferior-vena-cava', 'ovarian-artery-left', 'ovarian-artery-right', 'ovarian-vein-left', 'ovarian-vein-right', 'renal-vein-left'],
    fertilisation: ['endometrium'],
    pregnancy: ['cervix', 'external-os', 'internal-os', 'vagina', 'vaginal-fornix'],
    birth: ['cervix', 'external-os', 'internal-os'],
    contraception: ['endometrium'],
    disorders: ['endometrium'],
  },
  male: {},
};
/** Structures a mode hides although their layer is shown. */
export const MODE_HIDE: Record<Body, ModeLists> = {
  female: {
    pregnancy: ['small-intestine', 'large-intestine'],
    birth: ['small-intestine', 'large-intestine'],
  },
  male: {},
};
/** The camera each mode starts with. */
export const MODE_CAMERA: Partial<Record<Mode, string>> = {
  explore: 'anterior', cycle: 'oblique', fertilisation: 'oblique', pregnancy: 'left', birth: 'left', sperm: 'oblique', contraception: 'anterior', disorders: 'anterior',
};
/** See-through structures per mode, so what is inside shows (the lining, follicles, the fetus). */
export const MODE_OPACITY: Record<Body, Partial<Record<Mode, Record<string, number>>>> = {
  female: {
    cycle: { uterus: 0.28, vagina: 0.35, ovaries: 0.55 },
    fertilisation: { uterus: 0.28, vagina: 0.3, tubes: 0.5, ovaries: 0.6 },
    pregnancy: { pregnancy: 1, 'gravid-uterus': 0.22, amnion: 0.45, vagina: 0.4, bone: 0.6 },
    birth: { 'gravid-uterus': 0.22, amnion: 0.45, vagina: 0.4, 'pelvic-floor': 0.35, bone: 0.35, skeleton: 0.2 },
    contraception: { uterus: 0.4 },
    disorders: { uterus: 0.55 },
  },
  male: {
    sperm: { scrotum: 0.18, testes: 0.75, glands: 0.6, penis: 0.5 },
  },
};
/** In a cut through the uterus its open region surfaces give way to the closed walls and lining. */
export const CUT_HIDE = ['uterine-fundus', 'uterine-body', 'lower-uterine-segment', 'uterine-cornua'];
export const CUT_SHOW = ['uterine-wall-anterior', 'uterine-wall-posterior', 'endometrium'];
