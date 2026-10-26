/**
 * The two simulation definitions (one per body) of the reproductive lab. They share the sources,
 * camera presets, disclaimers and the guided tour (each tour step names its body).
 */
import type { Body, SimulationDefinition } from '../contract/schema';
import { CAMERAS, DISCLAIMERS, SOURCES, TOUR } from './content/common';
import { FEMALE_LAYERS, FEMALE_STRUCTURES } from './content/female';
import { MALE_LAYERS, MALE_STRUCTURES } from './content/male';

const OBJECTIVES = [
  { id: 'anatomy', text: 'Name and locate the internal and external reproductive organs of both sexes, their ligaments, vessels and relations in the pelvis.' },
  { id: 'cycle', text: 'Explain the ovarian and uterine cycles: FSH, LH, oestradiol, progesterone and inhibin, negative and positive feedback, ovulation and menstruation.' },
  { id: 'fertilisation', text: 'Follow sperm through the female tract to fertilisation in the ampulla, and the embryo from cleavage to implantation.' },
  { id: 'pregnancy', text: 'Describe the growth of the uterus, fetus and placenta week by week, the hormones of pregnancy and what crosses the placenta.' },
  { id: 'birth', text: 'Explain the stages of labour, cervical dilation and the oxytocin positive feedback loop, and the hormones of lactation.' },
  { id: 'testis', text: 'Explain spermatogenesis, the male hormone loop, the route of sperm and the glands that make semen.' },
  { id: 'physiology', text: 'Describe the vascular and nervous control of erection and ejaculation, and the action of PDE5 inhibitors.' },
  { id: 'contraception', text: 'Compare contraceptive methods by mechanism, site of action and perfect- and typical-use effectiveness.' },
  { id: 'disorders', text: 'Recognise common reproductive disorders and interpret the main tests (hCG, progesterone, AMH, FSH and LH, semen analysis, PSA).' },
  { id: 'development', text: 'Pair each structure with its developmental homologue in the other sex.' },
];

const base = {
  schemaVersion: 1 as const,
  domain: 'biology' as const,
  simulationType: '3d-anatomy' as const,
  audience: 'University anatomy and physiology (medicine, nursing, midwifery, biology)',
  learningObjectives: OBJECTIVES,
  cameraPresets: CAMERAS,
  defaultCamera: 'anterior',
  tour: TOUR,
  sources: SOURCES,
  disclaimers: DISCLAIMERS,
};

export const femaleDefinition: SimulationDefinition = {
  ...base,
  id: 'reproductive-female',
  body: 'female',
  title: 'Human Reproductive System: female',
  summary: 'The female reproductive organs of the HuBMAP reference body in their real pelvis, with modelled endometrium, vulva and the growing uterus: the menstrual cycle, fertilisation, pregnancy week by week, labour and breastfeeding, contraception and disorders.',
  assets: [{ id: 'hra-female-repro-v1', role: 'anatomy-model' }],
  layers: FEMALE_LAYERS,
  structures: FEMALE_STRUCTURES,
};

export const maleDefinition: SimulationDefinition = {
  ...base,
  id: 'reproductive-male',
  body: 'male',
  title: 'Human Reproductive System: male',
  summary: 'The male reproductive organs of BodyParts3D in their pelvis, with modelled scrotum, urethra segments and ducts: spermatogenesis and the male hormone loop, the route of sperm, erection and ejaculation, contraception and disorders.',
  assets: [{ id: 'bp3d-male-repro-v1', role: 'anatomy-model' }],
  layers: MALE_LAYERS,
  structures: MALE_STRUCTURES,
};

export const DEFINITIONS: Record<Body, SimulationDefinition> = { female: femaleDefinition, male: maleDefinition };
