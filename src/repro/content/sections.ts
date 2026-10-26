import type { Body } from '../../contract/schema';

const pairs = (...bases: string[]) => bases.flatMap((b) => [`${b}-left`, `${b}-right`]);

/** The structure list of each body: groups expand to their parts, so every mesh is listed once. */
export const SECTIONS: Record<Body, { title: string; ids: string[] }[]> = {
  female: [
    { title: 'Uterus and lining', ids: ['uterus', 'myometrium', 'endometrium'] },
    { title: 'Tubes and ovaries', ids: ['uterine-tube-left', 'uterine-tube-right', 'tubal-ostia', 'ovary-left', 'ovary-right'] },
    { title: 'Ligaments', ids: ['broad-ligament', ...pairs('mesosalpinx', 'mesovarium', 'ovarian-ligament', 'suspensory-ligament', 'round-ligament', 'cardinal-ligament', 'uterosacral-ligament'), 'uterovesical-pouch'] },
    { title: 'Vagina and vulva', ids: ['vagina', 'vaginal-fornix', ...pairs('labium-majus', 'labium-minus'), 'clitoris', ...pairs('vestibular-gland')] },
    { title: 'Breasts', ids: ['breast-left', 'breast-right'] },
    { title: 'Pregnancy', ids: ['gravid-uterus', 'placenta', 'amnion', 'umbilical-cord', 'umbilical-arteries', 'umbilical-vein'] },
    { title: 'Bladder, urethra and gut', ids: ['urinary-bladder', 'bladder-neck', 'bladder-trigone', ...pairs('ureter'), 'urethra', 'rectum', 'sigmoid-colon'] },
    { title: 'Pelvic floor', ids: [...pairs('levator-ani', 'coccygeus'), 'external-anal-sphincter'] },
    { title: 'Blood vessels', ids: ['abdominal-aorta', ...pairs('renal-artery', 'common-iliac-artery', 'internal-iliac-artery', 'external-iliac-artery', 'uterine-artery', 'ovarian-artery'), 'inferior-vena-cava', ...pairs('renal-vein', 'common-iliac-vein', 'internal-iliac-vein', 'uterine-vein', 'ovarian-vein')] },
    { title: 'Bones', ids: ['pelvis', 'lumbar-spine', 'thoracic-spine', 'ribs-left', 'ribs-right', 'sternum'] },
    { title: 'Abdominal organs', ids: ['small-intestine', 'large-intestine', 'kidney-left', 'kidney-right'] },
  ],
  male: [
    { title: 'Testes', ids: [...pairs('testis', 'epididymis'), 'scrotum'] },
    { title: 'Ducts and urethra', ids: ['spermatic-cord-left', 'spermatic-cord-right', ...pairs('ejaculatory-duct'), 'urethra'] },
    { title: 'Glands', ids: ['prostate', ...pairs('seminal-vesicle', 'bulbourethral-gland')] },
    { title: 'Penis', ids: ['penis'] },
    { title: 'Bladder and rectum', ids: ['urinary-bladder', ...pairs('ureter'), 'rectum'] },
    { title: 'Pelvic floor', ids: [...pairs('levator-ani', 'coccygeus'), 'external-anal-sphincter', 'perineal-muscles'] },
    { title: 'Blood vessels', ids: ['abdominal-aorta', ...pairs('common-iliac-artery', 'internal-iliac-artery', 'external-iliac-artery', 'dorsal-artery-of-penis', 'deep-artery-of-penis'), 'inferior-vena-cava', 'left-renal-vein', ...pairs('common-iliac-vein', 'internal-iliac-vein', 'external-iliac-vein'), 'deep-dorsal-vein-of-penis', 'superficial-dorsal-veins'] },
    { title: 'Bones', ids: ['pelvis', 'lumbar-spine'] },
  ],
};
