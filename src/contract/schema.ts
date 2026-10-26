/**
 * The simulation contract (reproductive edition). A SimulationDefinition is plain, serialisable
 * data for one body: it names an approved asset by id, lists the structures and layers a learner
 * can work with, and declares the learning content (tour, objectives, sources). The two bodies share
 * one tour; each step names its body. The runtime renders any definition that passes these schemas
 * and the cross-reference checks in validate.ts. Nothing in here may carry a URL (except https
 * source links), a file path or code.
 */
import { z } from 'zod';
import { METHODS } from '../repro/contraception';
import { DISORDERS } from '../repro/disorders';

/** Lower-case kebab-case ids keep definitions portable and safe to use as DOM/URL keys. */
export const Id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ids are lower-case kebab-case').max(64);
const Text = (max: number) => z.string().trim().min(1).max(max);
const Vec3 = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const oneOf = <T extends string>(ids: readonly T[], what: string) => z.string().refine((v): v is T => (ids as readonly string[]).includes(v), { message: `unknown ${what}` }) as unknown as z.ZodType<T>;

export const Body = z.enum(['female', 'male']);
export type Body = z.infer<typeof Body>;

export const Source = z.object({
  id: Id,
  citation: Text(400),
  url: z.url({ protocol: /^https$/ }).optional(),
  license: Text(80).optional(),
});
export type Source = z.infer<typeof Source>;

export const AssetRef = z.object({
  /** Key into the approved asset registry (assets.ts); never a path or URL. */
  id: Id,
  role: z.enum(['anatomy-model']),
});

export const Layer = z.object({
  id: Id,
  label: Text(60),
  description: Text(300),
  visibleByDefault: z.boolean(),
});
export type Layer = z.infer<typeof Layer>;

/** What each part develops from (Colour: Origin), so the homologues of the two bodies match. */
export const Origin = z.enum(['gonad', 'mullerian', 'wolffian', 'sinus', 'tubercle', 'folds', 'swellings', 'other']);
export type Origin = z.infer<typeof Origin>;

export const CloseUp = z.enum(['follicle', 'fertilisation', 'embryo', 'villi', 'tubule', 'alveolus']);
export type CloseUp = z.infer<typeof CloseUp>;

export const AnatomicalStructure = z.object({
  id: Id,
  label: Text(80),
  synonyms: z.array(Text(80)).max(14),
  layer: Id,
  /** mesh: a node of the same id exists in the model. group: no geometry; stands for `members`. */
  kind: z.enum(['mesh', 'group']),
  members: z.array(Id).min(1).max(30).optional(),
  side: z.enum(['right', 'left', 'midline']),
  /** Group this part belongs to (for example a part of the uterine tube belongs to the tube). */
  organ: Id.optional(),
  summary: Text(400),
  function: Text(900),
  origin: Origin.optional(),
  /** The structure in the other body that develops from the same embryonic tissue. */
  homologue: Id.optional(),
  related: z.array(Id).max(12),
  /** What the 3D model does and does not show for this structure. */
  modelNote: Text(500).optional(),
  /** A magnified close-up of its tissue. */
  closeUp: CloseUp.optional(),
  sources: z.array(Id).min(1).max(6),
});
export type AnatomicalStructure = z.infer<typeof AnatomicalStructure>;

export const CameraPreset = z.object({
  id: Id,
  label: Text(40),
  /** Unit-ish vector from the model centre towards the camera, in model axes. */
  direction: Vec3,
  up: Vec3.optional(),
});
export type CameraPreset = z.infer<typeof CameraPreset>;

export const SliceAxis = z.enum(['off', 'sagittal', 'coronal', 'axial']);
export type SliceAxis = z.infer<typeof SliceAxis>;

export const Mode = z.enum(['explore', 'cycle', 'fertilisation', 'pregnancy', 'birth', 'sperm', 'contraception', 'disorders', 'tour']);
export type Mode = z.infer<typeof Mode>;

export const TourStep = z.object({
  id: Id,
  /** The body this step shows; the lab switches to it. */
  body: Body,
  title: Text(80),
  text: Text(900),
  focus: z.array(Id).max(16),
  camera: Id.optional(),
  mode: Mode.exclude(['tour']).optional(),
  /** Cycle view: the day (1–35) and the scenario. */
  day: z.number().min(1).max(35).optional(),
  cycle: z.enum(['normal', 'pill', 'pcos', 'pregnant']).optional(),
  /** Fertilisation view: days after fertilisation (0–10), and an ectopic implantation. */
  fertDay: z.number().min(0).max(10).optional(),
  ectopic: z.boolean().optional(),
  /** Pregnancy view: gestational week (4–40). */
  week: z.number().min(4).max(40).optional(),
  /** Birth view: hours from the start of labour, or a feed. */
  labourH: z.number().min(0).max(14).optional(),
  feeding: z.boolean().optional(),
  /** Sperm view: the scenario, the day of spermatogenesis, and the erection (0–1). */
  sperm: z.enum(['normal', 'steroids', 'vasectomy', 'varicocele', 'klinefelter']).optional(),
  arousal: z.number().min(0).max(1).optional(),
  method: oneOf(METHODS.map((m) => m.id), 'contraceptive method').optional(),
  disorder: oneOf(DISORDERS.map((d) => d.id), 'disorder').optional(),
  closeUp: CloseUp.optional(),
  /** Cut the model for this step: axis and position (-1 … 1), or through the middle of a structure. */
  slice: z.object({ axis: SliceAxis, at: z.number().min(-1).max(1).optional(), through: Id.optional() }).optional(),
  colourBy: z.enum(['real', 'layer', 'origin']).optional(),
  /** What the camera frames: the focus structures (default), or the mode's whole view. */
  frame: z.enum(['focus', 'mode']).optional(),
  /** Show only the focus structures. */
  isolate: z.boolean().optional(),
  /** Tint the focus structures (default); off for cut views, where the tissue's own colours matter. */
  tint: z.boolean().optional(),
});
export type TourStep = z.infer<typeof TourStep>;

export const LearningObjective = z.object({ id: Id, text: Text(200) });

export const SimulationDefinition = z.object({
  schemaVersion: z.literal(1),
  id: Id,
  body: Body,
  title: Text(100),
  domain: z.enum(['biology']),
  simulationType: z.enum(['3d-anatomy']),
  audience: Text(120),
  summary: Text(600),
  learningObjectives: z.array(LearningObjective).min(1).max(16),
  assets: z.array(AssetRef).min(1).max(2),
  layers: z.array(Layer).min(1).max(24),
  structures: z.array(AnatomicalStructure).min(1).max(160),
  cameraPresets: z.array(CameraPreset).min(1).max(12),
  defaultCamera: Id,
  tour: z.array(TourStep).max(40),
  sources: z.array(Source).min(1).max(60),
  disclaimers: z.array(Text(400)).min(1).max(6),
});
export type SimulationDefinition = z.infer<typeof SimulationDefinition>;
