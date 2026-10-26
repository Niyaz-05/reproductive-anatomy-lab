#!/usr/bin/env node
/**
 * Writes src/repro/source/structures.source.json: every structure of the two bodies mapped to its
 * source meshes. Female: the HRA united-female body (`united`), with a few BodyParts3D parts placed on
 * it by similarity fits (`bp3d` + `fit`). Male: BodyParts3D in its own frame (`bp3d`, no fit).
 * `generated` parts are modelled in tools/extract-reproductive.mjs.
 *
 *   node tools/make-structures.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = [];
const mid = (side) => (side === 'midline' ? { sideCheck: false } : {});
const F = (id, layer, side, united, extra = {}) => S.push({ id, body: 'female', layer, side, ...mid(side), united, ...extra });
const FB = (id, layer, side, fit, bp3d, extra = {}) => S.push({ id, body: 'female', layer, side, ...mid(side), fit, bp3d, ...extra });
const FG = (id, layer, side, generated, extra = {}) => S.push({ id, body: 'female', layer, side, ...mid(side), generated, ...extra });
const M = (id, layer, side, bp3d, extra = {}) => S.push({ id, body: 'male', layer, side, ...mid(side), bp3d, ...extra });
const MG = (id, layer, side, generated, extra = {}) => S.push({ id, body: 'male', layer, side, ...mid(side), generated, ...extra });
const sides = [['left', 'L'], ['right', 'R']];

// ═══ Female ═══
// Uterus: the HRA regions are open patches over the real walls; the two walls are closed (shown cut).
F('uterine-fundus', 'uterus', 'midline', ['VH_F_fundus_of_uterus']);
F('uterine-body', 'uterus', 'midline', ['VH_F_body_of_uterus']);
F('uterine-cornua', 'uterus', 'midline', ['VH_F_cornua']);
F('lower-uterine-segment', 'uterus', 'midline', ['VH_F_lower_uterine_segment']);
F('cervix', 'uterus', 'midline', ['VH_F_cervix']);
F('internal-os', 'uterus', 'midline', ['VH_F_internal_cervical_os'], { smooth: true });
F('external-os', 'uterus', 'midline', ['VH_F_external_cervical_os'], { smooth: true });
F('uterine-wall-anterior', 'myometrium', 'midline', ['VH_F_anterior_wall_of_uterus']);
F('uterine-wall-posterior', 'myometrium', 'midline', ['VH_F_posterior_wall_of_uterus']);
FG('endometrium', 'myometrium', 'midline', 'endometrium');
// Uterine tubes.
for (const [side, X] of sides) {
  F(`tube-isthmus-${side}`, 'tubes', side, [`VH_F_isthmus_of_fallopian_tube_${X}`], { smooth: true });
  F(`tube-ampulla-${side}`, 'tubes', side, [`VH_F_ampulla_of_uterine_tube_${X}`]);
  F(`tube-infundibulum-${side}`, 'tubes', side, [`VH_F_uterine_tube_infundibulum_${X}`]);
  F(`tube-fimbriae-${side}`, 'tubes', side, [`VH_F_fibria_of_uterine_tube_${X}`]);
}
F('tubal-ostia', 'tubes', 'midline', ['VH_F_abdominal_ostium_of_uterine_tube'], { smooth: true });
// Ovaries.
F('ovary-left', 'ovaries', 'left', ['VH_F_left_ovary'], { smooth: true });
F('ovary-right', 'ovaries', 'right', ['VH_F_right_ovary'], { smooth: true });
// Ligaments and peritoneum.
F('broad-ligament', 'ligaments', 'midline', ['VH_F_broad_ligament']);
for (const [side, X] of sides) {
  F(`mesosalpinx-${side}`, 'ligaments', side, [`VH_F_mesosalpinx_${X}`]);
  F(`mesovarium-${side}`, 'ligaments', side, [`VH_F_mesovarium_${X}`], { smooth: true });
  // The HRA labels the round ligaments the wrong way round (its 'right' one lies on the patient's left).
  F(`round-ligament-${side}`, 'ligaments', side, [`VH_F_${side === 'left' ? 'right' : 'left'}_round_ligament_of_uterus`], { smooth: true });
  F(`ovarian-ligament-${side}`, 'ligaments', side, [`VH_F_ovarian_ligament_${X}`], { smooth: true });
  F(`suspensory-ligament-${side}`, 'ligaments', side, [`VH_F_suspensory_ligament_of_ovary_${X}`], { smooth: true });
  F(`cardinal-ligament-${side}`, 'ligaments', side, [`VH_F_${side}_cardinal_ligament_of_uterus`]);
  F(`uterosacral-ligament-${side}`, 'ligaments', side, [`VH_F_${side}_uterosacral_ligament`], { smooth: true });
}
F('uterovesical-pouch', 'ligaments', 'midline', ['VH_F_uterovesical_pouch']);
// Vagina and vulva (the vulva is modelled: the HRA body has no external genitalia).
F('vagina', 'vagina', 'midline', ['VH_F_vagina']);
F('vaginal-fornix', 'vagina', 'midline', ['VH_F_cervicovaginal_junction']);
// This body's vagina lies about 12 mm right of the midline, so the vulva's sides are checked against the vaginal opening.
for (const side of ['left', 'right']) {
  FG(`labium-majus-${side}`, 'vulva', side, 'vulva', { sideCheck: false });
  FG(`labium-minus-${side}`, 'vulva', side, 'vulva', { sideCheck: false });
  FG(`clitoral-crus-${side}`, 'vulva', side, 'vulva', { sideCheck: false });
  FG(`vestibular-bulb-${side}`, 'vulva', side, 'vulva', { sideCheck: false });
  FG(`vestibular-gland-${side}`, 'vulva', side, 'vulva', { sideCheck: false });
}
FG('clitoral-glans', 'vulva', 'midline', 'vulva');
FG('clitoral-body', 'vulva', 'midline', 'vulva');
// Breasts.
for (const [side, X] of sides) {
  F(`mammary-lobes-${side}`, 'breasts', side, [`VH_F_mammary_lobes_${X}`], { simplify: 0.4, maxError: 0.006 });
  F(`lactiferous-ducts-${side}`, 'breasts', side, [`VH_F_main_lactiferous_ducts_${X}`], { simplify: 0.6, maxError: 0.006 });
  F(`lactiferous-sinuses-${side}`, 'breasts', side, [`VH_F_main_lactiferous_sinuses_${X}`]);
  F(`nipple-${side}`, 'breasts', side, [`VH_F_nipple_${X}`]);
  F(`areola-${side}`, 'breasts', side, [`VH_F_areola_${X}`, `VH_F_areolar_tubercles_${X}`]);
  F(`breast-ligaments-${side}`, 'breasts', side, [`VH_F_suspensory_ligaments_${X}`], { simplify: 0.5, maxError: 0.006 });
  F(`breast-fat-${side}`, 'breast-fat', side, [`VH_F_fat_${X}`], { simplify: side === 'right' ? 0.1 : 0.4, maxError: 0.008 });
}
// Pregnancy: the HRA full-term placenta set (moved into the uterus) and the modelled gravid uterus.
F('placenta-basal-plate', 'pregnancy', 'midline', ['VH_F_basal_plate'], { placenta: true });
F('placenta-chorionic-plate', 'pregnancy', 'midline', ['VH_F_chorionic_plate'], { placenta: true });
F('placental-vessels', 'pregnancy', 'midline', ['VH_F_placenta_vessels'], { placenta: true, simplify: 0.5, maxError: 0.006 });
F('amnion', 'pregnancy', 'midline', ['VH_F_amnion'], { placenta: true });
F('umbilical-cord', 'pregnancy', 'midline', ['VH_F_umbilical_cord'], { placenta: true, simplify: 0.5, maxError: 0.006 });
F('umbilical-arteries', 'pregnancy', 'midline', ['VH_F_umbilical_artery_1', 'VH_F_umbilical_artery_2'], { placenta: true });
F('umbilical-vein', 'pregnancy', 'midline', ['VH_F_umbilical_vein'], { placenta: true });
FG('gravid-uterus', 'pregnancy', 'midline', 'gravid-uterus');
// Urinary tract.
F('urinary-bladder', 'urinary', 'midline', ['VH_F_fundus_of_urinary_bladder_dome', 'VH_F_fundus_of_urinary_bladder_base']);
F('bladder-neck', 'urinary', 'midline', ['VH_F_urinary_bladder_neck_smooth_muscle']);
F('bladder-trigone', 'urinary', 'midline', ['VH_F_trigone_of_urinary_bladder'], { smooth: true });
F('ureter-left', 'urinary', 'left', ['VH_F_left_ureter'], { simplify: 0.4, maxError: 0.006 });
F('ureter-right', 'urinary', 'right', ['VH_F_right_ureter'], { simplify: 0.4, maxError: 0.006 });
FG('urethra', 'urinary', 'midline', 'female-urethra');
// Gut.
F('rectum', 'gut', 'midline', ['VH_F_rectum']);
F('sigmoid-colon', 'gut', 'midline', ['VH_F_sigmoid_colon']);
F('small-intestine', 'neighbours', 'midline', ['VH_F_jejenum', 'VH_F_ileum', 'VH_F_ileum_terminal'], { simplify: 0.2, maxError: 0.01 });
F('large-intestine', 'neighbours', 'midline', ['VH_F_caecum', 'VH_F_ascending_colon', 'VH_F_descending_colon'], { simplify: 0.3, maxError: 0.01 });
F('kidney-left', 'neighbours', 'left', ['VH_F_kidney_capsule_L'], { simplify: 0.4, maxError: 0.006 });
F('kidney-right', 'neighbours', 'right', ['VH_F_kidney_capsule_R'], { simplify: 0.4, maxError: 0.006 });
// Pelvic floor (BodyParts3D placed on the HRA pelvis), pushed out of the HRA organs.
const floorMould = ['vagina', 'rectum', 'urinary-bladder', 'bladder-neck', 'cervix'];
FB('levator-ani-left', 'pelvic-floor', 'left', 'pelvis', ['FJ2544', 'FJ2545', 'FJ2546'], { mould: floorMould });
FB('levator-ani-right', 'pelvic-floor', 'right', 'pelvis', ['FJ2549', 'FJ2550', 'FJ2551'], { mould: floorMould, sideCheck: false });
FB('coccygeus-left', 'pelvic-floor', 'left', 'pelvis', ['FJ2542']);
FB('coccygeus-right', 'pelvic-floor', 'right', 'pelvis', ['FJ2547']);
FB('external-anal-sphincter', 'pelvic-floor', 'midline', 'pelvis', ['FJ2543', 'FJ2548'], { mould: ['rectum', 'vagina'] });
// Arteries.
F('abdominal-aorta', 'artery', 'midline', ['VH_F_descending_aorta_b']);
F('renal-artery-left', 'artery', 'left', ['VH_F_left_renal_artery']);
F('renal-artery-right', 'artery', 'right', ['VH_F_right_renal_artery']);
FB('common-iliac-artery-left', 'artery', 'left', 'pelvis', ['FJ3464']);
FB('common-iliac-artery-right', 'artery', 'right', 'pelvis', ['FJ3565']);
FB('internal-iliac-artery-left', 'artery', 'left', 'pelvis', ['FJ3468']);
FB('internal-iliac-artery-right', 'artery', 'right', 'pelvis', ['FJ3569']);
FB('external-iliac-artery-left', 'artery', 'left', 'pelvis', ['FJ3466']);
FB('external-iliac-artery-right', 'artery', 'right', 'pelvis', ['FJ3567']);
F('uterine-artery-left', 'artery', 'left', ['VH_F_left_uterine_artery'], { smooth: true });
F('uterine-artery-right', 'artery', 'right', ['VH_F_right_uterine_artery'], { smooth: true });
FG('ovarian-artery-left', 'artery', 'left', 'ovarian-vessel');
FG('ovarian-artery-right', 'artery', 'right', 'ovarian-vessel');
// Veins.
F('inferior-vena-cava', 'vein', 'midline', ['VH_F_inferior_vena_cava_a', 'VH_F_inferior_vena_cava_b']);
F('renal-vein-left', 'vein', 'left', ['VH_F_left_renal_vein']);
F('renal-vein-right', 'vein', 'right', ['VH_F_right_renal_vein']);
F('common-iliac-vein-left', 'vein', 'left', ['VH_F_left_common_iliac_vein']);
F('common-iliac-vein-right', 'vein', 'right', ['VH_F_right_common_iliac_vein'], { sideCheck: false });
F('internal-iliac-vein-left', 'vein', 'left', ['VH_F_internal_iliac_vein_L']);
F('internal-iliac-vein-right', 'vein', 'right', ['VH_F_internal_iliac_vein_R']);
F('uterine-vein-left', 'vein', 'left', ['VH_F_left_uterine_vein'], { smooth: true });
F('uterine-vein-right', 'vein', 'right', ['VH_F_right_uterine_vein'], { smooth: true });
FG('ovarian-vein-left', 'vein', 'left', 'ovarian-vessel');
FG('ovarian-vein-right', 'vein', 'right', 'ovarian-vessel');
// Bones.
const VT = (k, n) => `VH_F_${k}_vertebra_${n}`;
F('thoracic-spine', 'bone', 'midline', [6, 7, 8, 9, 10, 11, 12].map((n) => VT('thoracic', n)), { simplify: 0.22, maxError: 0.01 });
F('lumbar-spine', 'bone', 'midline', [1, 2, 3, 4, 5, 6].map((n) => VT('lumbar', n)), { simplify: 0.25, maxError: 0.01 });
F('sacrum', 'bone', 'midline', ['VH_F_sacrum'], { simplify: 0.35, maxError: 0.01 });
F('coccyx', 'bone', 'midline', ['VH_F_coccyx']);
F('hip-bone-left', 'bone', 'left', ['VH_F_ilium_compact_bone_L', 'VH_F_ischium_compact_bone_L', 'VH_F_pubis_compact_bone_L'], { simplify: 0.4, maxError: 0.01 });
F('hip-bone-right', 'bone', 'right', ['VH_F_ilium_compact_bone_R', 'VH_F_ischium_compact_bone_R', 'VH_F_pubis_compact_bone_R'], { simplify: 0.4, maxError: 0.01 });
FB('ribs-left', 'skeleton', 'left', 'thorax', ['FJ3228', 'FJ3229', 'FJ3230', 'FJ3231', 'FJ3232', 'FJ3233', 'FJ3234', 'FJ3235', 'FJ3236', 'FJ3225', 'FJ3226', 'FJ3227'], { simplify: 0.3 });
FB('ribs-right', 'skeleton', 'right', 'thorax', ['FJ3334', 'FJ3336', 'FJ3338', 'FJ3340', 'FJ3342', 'FJ3344', 'FJ3346', 'FJ3347', 'FJ3348', 'FJ3330', 'FJ3331', 'FJ3332'], { simplify: 0.3 });
FB('sternum', 'skeleton', 'midline', 'thorax', ['FJ3290', 'FJ3178', 'FJ3153'], { simplify: 0.45 });

// ═══ Male (BodyParts3D 4.0, its own frame) ═══
M('testis-left', 'testes', 'left', ['FJ3138']);
M('testis-right', 'testes', 'right', ['FJ3142']);
M('epididymis-left', 'testes', 'left', ['FJ3136']);
M('epididymis-right', 'testes', 'right', ['FJ3141']);
MG('scrotum', 'scrotum', 'midline', 'scrotum');
M('deferent-duct-left', 'ducts', 'left', ['FJ3135']);
M('deferent-duct-right', 'ducts', 'right', ['FJ3140']);
MG('ejaculatory-duct-left', 'ducts', 'left', 'ejaculatory-duct');
MG('ejaculatory-duct-right', 'ducts', 'right', 'ejaculatory-duct');
MG('prostatic-urethra', 'ducts', 'midline', 'urethra-part');
MG('membranous-urethra', 'ducts', 'midline', 'urethra-part');
MG('spongy-urethra', 'ducts', 'midline', 'urethra-part');
M('prostate', 'glands', 'midline', ['FJ3139']);
M('seminal-vesicle-left', 'glands', 'left', ['FJ3137']);
M('seminal-vesicle-right', 'glands', 'right', ['FJ3143']);
MG('bulbourethral-gland-left', 'glands', 'left', 'bulbourethral');
MG('bulbourethral-gland-right', 'glands', 'right', 'bulbourethral');
MG('corpus-cavernosum-left', 'penis', 'left', 'cavernosum');
MG('corpus-cavernosum-right', 'penis', 'right', 'cavernosum');
M('corpus-spongiosum', 'penis', 'midline', ['FJ3133']);
M('glans-penis', 'penis', 'midline', ['FJ3134']);
M('urinary-bladder', 'urinary', 'midline', ['FJ3149'], { smooth: true });
M('ureter-left', 'urinary', 'left', ['FJ3144']);
M('ureter-right', 'urinary', 'right', ['FJ3146']);
M('rectum', 'gut', 'midline', ['FJ2571']);
M('levator-ani-left', 'pelvic-floor', 'left', ['FJ2544', 'FJ2545', 'FJ2546']);
M('levator-ani-right', 'pelvic-floor', 'right', ['FJ2549', 'FJ2550', 'FJ2551'], { sideCheck: false });
M('coccygeus-left', 'pelvic-floor', 'left', ['FJ2542']);
M('coccygeus-right', 'pelvic-floor', 'right', ['FJ2547']);
M('external-anal-sphincter', 'pelvic-floor', 'midline', ['FJ2543', 'FJ2548']);
M('perineal-muscles', 'pelvic-floor', 'midline', ['FJ1450']);
M('abdominal-aorta', 'artery', 'midline', ['FJ1932']);
M('common-iliac-artery-left', 'artery', 'left', ['FJ3464']);
M('common-iliac-artery-right', 'artery', 'right', ['FJ3565']);
M('internal-iliac-artery-left', 'artery', 'left', ['FJ3468']);
M('internal-iliac-artery-right', 'artery', 'right', ['FJ3569']);
M('external-iliac-artery-left', 'artery', 'left', ['FJ3466']);
M('external-iliac-artery-right', 'artery', 'right', ['FJ3567']);
M('testicular-artery-left', 'artery', 'left', ['FJ3532']);
M('testicular-artery-right', 'artery', 'right', ['FJ3617']);
M('dorsal-artery-of-penis-left', 'artery', 'left', ['name:Left dorsal artery of penis'], { sideCheck: false });
M('dorsal-artery-of-penis-right', 'artery', 'right', ['FJ3592', 'FJ3593'], { sideCheck: false });
MG('deep-artery-of-penis-left', 'artery', 'left', 'deep-artery');
MG('deep-artery-of-penis-right', 'artery', 'right', 'deep-artery');
M('inferior-vena-cava', 'vein', 'midline', ['FJ3659']);
M('left-renal-vein', 'vein', 'left', ['FJ3477'], { sideCheck: false });
M('common-iliac-vein-left', 'vein', 'left', ['FJ3465'], { sideCheck: false });
M('common-iliac-vein-right', 'vein', 'right', ['name:Right common iliac vein']);
M('internal-iliac-vein-left', 'vein', 'left', ['FJ3469', 'FJ3470', 'FJ3471']);
M('internal-iliac-vein-right', 'vein', 'right', ['FJ3570', 'FJ3571', 'FJ3572', 'FJ3607', 'FJ3608', 'FJ3609']);
M('external-iliac-vein-left', 'vein', 'left', ['FJ3484', 'FJ3522', 'FJ3523', 'FJ3524']);
M('external-iliac-vein-right', 'vein', 'right', ['name:Right external iliac vein']);
M('testicular-vein-left', 'vein', 'left', ['name:Left testicular vein']);
M('testicular-vein-right', 'vein', 'right', ['FJ3618']);
M('deep-dorsal-vein-of-penis', 'vein', 'midline', ['FJ2056']);
M('superficial-dorsal-veins', 'vein', 'midline', ['FJ2208', 'FJ3426', 'FJ3637']);
M('lumbar-spine', 'bone', 'midline', ['FJ3157', 'FJ3159', 'FJ3162', 'FJ3165', 'FJ3168'], { simplify: 0.35, maxError: 0.01 });
M('sacrum', 'bone', 'midline', ['FJ3393'], { simplify: 0.4, maxError: 0.01 });
M('hip-bone-left', 'bone', 'left', ['FJ3288'], { simplify: 0.5, maxError: 0.01 });
M('hip-bone-right', 'bone', 'right', ['FJ3152'], { simplify: 0.5, maxError: 0.01 });

const spec = {
  $comment: 'Generated by tools/make-structures.mjs. Female: HRA united female v1.5 (united ids) with BodyParts3D placed by similarity fits; male: BodyParts3D 4.0 in its own frame. "name:" entries are BodyParts3D parts looked up by name.',
  unitedYShift: 0.794760942,
  structures: S,
  registration: {
    $comment: "Similarity transforms fitted by Horn's method on landmark centroids, then (pelvis) refined by ICP of the BodyParts3D hip bones and sacrum onto the HRA ones and a smooth warp (the male pelvis is narrower than the female). 'pelvis' places the pelvic floor, pelvic wall muscles and iliac arteries; 'thorax' (T1 to T12) the ribs and sternum, as in the endocrine lab.",
    fits: {
      pelvis: {
        maxRmsMm: 6,
        icp: { warp: 16, bp3d: ['FJ3288', 'FJ3152', 'FJ3393'], united: ['VH_F_ilium_compact_bone_L', 'VH_F_ischium_compact_bone_L', 'VH_F_pubis_compact_bone_L', 'VH_F_ilium_compact_bone_R', 'VH_F_ischium_compact_bone_R', 'VH_F_pubis_compact_bone_R', 'VH_F_sacrum'] },
        pairs: [['FJ3288', ['VH_F_ilium_compact_bone_L', 'VH_F_ischium_compact_bone_L', 'VH_F_pubis_compact_bone_L']], ['FJ3152', ['VH_F_ilium_compact_bone_R', 'VH_F_ischium_compact_bone_R', 'VH_F_pubis_compact_bone_R']], ['FJ3393', ['VH_F_sacrum']], ['FJ3168', ['VH_F_lumbar_vertebra_6']]],
      },
      thorax: {
        maxRmsMm: 10,
        pairs: [['FJ3158', ['VH_F_thoracic_vertebra_1']], ['FJ3160', ['VH_F_thoracic_vertebra_2']], ['FJ3163', ['VH_F_thoracic_vertebra_3']], ['FJ3166', ['VH_F_thoracic_vertebra_4']], ['FJ3169', ['VH_F_thoracic_vertebra_5']], ['FJ3171', ['VH_F_thoracic_vertebra_6']], ['FJ3173', ['VH_F_thoracic_vertebra_7']], ['FJ3174', ['VH_F_thoracic_vertebra_8']], ['FJ3175', ['VH_F_thoracic_vertebra_9']], ['FJ3154', ['VH_F_thoracic_vertebra_10']], ['FJ3155', ['VH_F_thoracic_vertebra_11']], ['FJ3156', ['VH_F_thoracic_vertebra_12']]],
      },
    },
  },
};
const out = path.join(root, 'src/repro/source/structures.source.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(spec, null, 1) + '\n');
console.log(`${S.length} structures (${S.filter((s) => s.body === 'female').length} female, ${S.filter((s) => s.body === 'male').length} male)`);
