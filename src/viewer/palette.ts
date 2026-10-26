import type { AnatomicalStructure, Body, Mode } from '../contract/schema';
import type { ColourBy } from '../app/state';
import { MODE_OPACITY } from '../app/modes';
import type { TissueLook } from './tissue';

/**
 * Real looks as in a fresh specimen. Female: a pink-tan serosa over a deep pink myometrium, a velvety
 * red endometrium, pale grey-white bumpy ovaries, tubes with pink fimbriae, pink mucosa and
 * red-purple erectile tissue, pale breast glands in yellow fat; a maroon placenta under a translucent
 * amnion, the cord’s two arteries blue and its vein red (as they are drawn: the arteries carry the
 * fetus’s used blood). Male: the bluish-white tunica albuginea of the testes, grey-pink epididymides,
 * cream ducts, a tan prostate, dark red erectile tissue. Red arteries, blue-purple veins, ivory bone.
 */
const REAL: Record<string, TissueLook> = {
  uterus: { color: '#d29186', roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.12, sheen: 0.35, sheenColor: '#ffe0d8', rim: 0.2, rimColor: '#ff9a88', ao: 0.6, mottle: 0.25, mottleTint: '#a8605a' },
  myometrium: { color: '#b8645e', roughness: 0.4, clearcoat: 0.5, sheen: 0.3, rim: 0.15, ao: 0.6, mottle: 0.35, mottleTint: '#8a3a36' },
  endometrium: { color: '#9a2436', roughness: 0.55, clearcoat: 0.6, sheen: 0.6, sheenColor: '#ff8090', rim: 0.25, rimColor: '#ff5068', ao: 0.5, mottle: 0.45, mottleTint: '#6a1020' },
  tube: { color: '#e0a094', roughness: 0.3, clearcoat: 0.8, sheen: 0.35, rim: 0.2, rimColor: '#ffa898', ao: 0.6, mottle: 0.25, mottleTint: '#b07060' },
  fimbriae: { color: '#e88a96', roughness: 0.35, clearcoat: 0.8, sheen: 0.5, sheenColor: '#ffd0d8', rim: 0.25, rimColor: '#ff7a90', ao: 0.5, mottle: 0.3, mottleTint: '#b85a6a' },
  ovary: { color: '#e6dad0', roughness: 0.5, clearcoat: 0.45, sheen: 0.45, sheenColor: '#ffffff', rim: 0.12, ao: 0.85, mottle: 0.55, mottleTint: '#c0a090' },
  peritoneum: { color: '#edd8c6', roughness: 0.3, clearcoat: 0.8, sheen: 0.3, rim: 0.12, ao: 0.6, mottle: 0.2, mottleTint: '#c8a890' },
  vagina: { color: '#cc8288', roughness: 0.35, clearcoat: 0.8, sheen: 0.35, rim: 0.2, ao: 0.65, mottle: 0.3, mottleTint: '#9a5058' },
  skin: { color: '#d6a08c', roughness: 0.55, clearcoat: 0.2, sheen: 0.5, sheenColor: '#fff0e6', rim: 0.25, rimColor: '#ffb090', ao: 0.7, mottle: 0.3, mottleTint: '#a87060' },
  mucosa: { color: '#c46c7a', roughness: 0.3, clearcoat: 0.85, sheen: 0.45, sheenColor: '#ffd0d8', rim: 0.25, rimColor: '#ff7a90', ao: 0.55, mottle: 0.25, mottleTint: '#8a4050' },
  erectile: { color: '#8e2e3e', roughness: 0.4, clearcoat: 0.55, sheen: 0.3, rim: 0.2, rimColor: '#ff6070', ao: 0.6, mottle: 0.35, mottleTint: '#5a1826' },
  gland: { color: '#dfc19c', roughness: 0.45, clearcoat: 0.5, sheen: 0.4, rim: 0.12, ao: 0.75, mottle: 0.4, mottleTint: '#a88a60' },
  breastGland: { color: '#efc8b4', roughness: 0.45, clearcoat: 0.5, sheen: 0.5, sheenColor: '#ffffff', rim: 0.15, ao: 0.75, mottle: 0.45, mottleTint: '#c09080' },
  duct: { color: '#f2e6d6', roughness: 0.35, clearcoat: 0.7, sheen: 0.3, rim: 0.1, ao: 0.6, mottle: 0.1 },
  nipple: { color: '#b06a66', roughness: 0.5, clearcoat: 0.3, sheen: 0.4, rim: 0.2, ao: 0.7, mottle: 0.3, mottleTint: '#7a4040' },
  areola: { color: '#bd8678', roughness: 0.55, clearcoat: 0.25, sheen: 0.4, rim: 0.2, ao: 0.75, mottle: 0.35, mottleTint: '#8a5848' },
  fascia: { color: '#efe4d6', roughness: 0.4, clearcoat: 0.4, sheen: 0.3, rim: 0.1, ao: 0.7, mottle: 0.15 },
  fat: { color: '#f2d690', roughness: 0.4, clearcoat: 0.5, sheen: 0.4, sheenColor: '#fff6d0', rim: 0.15, ao: 0.6, mottle: 0.3, mottleTint: '#d8b060' },
  gravid: { color: '#d48a84', roughness: 0.3, clearcoat: 0.8, sheen: 0.35, rim: 0.3, rimColor: '#ff9a88', ao: 0.4, mottle: 0.2, mottleTint: '#a85a56' },
  placenta: { color: '#7a1e2c', roughness: 0.45, clearcoat: 0.5, sheen: 0.35, rim: 0.2, rimColor: '#ff5060', ao: 0.7, mottle: 0.45, mottleTint: '#4a0e18' },
  chorion: { color: '#b45468', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, rim: 0.25, ao: 0.6, mottle: 0.3, mottleTint: '#7a2a3a' },
  amnion: { color: '#f2e6ea', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.5, sheenColor: '#ffffff', rim: 0.3, rimColor: '#ffffff', ao: 0.3, mottle: 0.05 },
  cord: { color: '#e9dcd2', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.5, sheenColor: '#ffffff', rim: 0.25, ao: 0.5, mottle: 0.15 },
  umbArtery: { color: '#4a5aa8', roughness: 0.3, clearcoat: 0.8, sheen: 0.2, rim: 0.2, ao: 0.6, mottle: 0.15 },
  umbVein: { color: '#c0303a', roughness: 0.3, clearcoat: 0.8, sheen: 0.2, rim: 0.2, ao: 0.6, mottle: 0.15 },
  bladder: { color: '#d8b07a', roughness: 0.35, clearcoat: 0.7, sheen: 0.3, rim: 0.15, ao: 0.7, mottle: 0.3, mottleTint: '#a8804a' },
  urethra: { color: '#e4b4a4', roughness: 0.35, clearcoat: 0.7, sheen: 0.3, rim: 0.15, ao: 0.6, mottle: 0.2 },
  ureter: { color: '#e8c890', roughness: 0.35, clearcoat: 0.6, sheen: 0.25, rim: 0.12, ao: 0.6, mottle: 0.15 },
  gut: { color: '#c88a76', roughness: 0.35, clearcoat: 0.7, sheen: 0.35, rim: 0.2, ao: 0.75, mottle: 0.3, mottleTint: '#9a5a48' },
  kidney: { color: '#9a4a3c', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.35, rim: 0.22, ao: 0.55, mottle: 0.18, mottleTint: '#6e2c22' },
  muscle: { color: '#a8443c', roughness: 0.45, clearcoat: 0.45, sheen: 0.35, sheenColor: '#ffc0b0', rim: 0.18, ao: 0.75, mottle: 0.45, mottleTint: '#6e2420' },
  testis: { color: '#e0e2ec', roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1, sheen: 0.4, sheenColor: '#ffffff', rim: 0.2, rimColor: '#c8d0ff', ao: 0.6, mottle: 0.15, mottleTint: '#b0b4c8' },
  epididymis: { color: '#c9a29a', roughness: 0.4, clearcoat: 0.6, sheen: 0.35, rim: 0.15, ao: 0.7, mottle: 0.4, mottleTint: '#946860' },
  scrotum: { color: '#c18a78', roughness: 0.6, clearcoat: 0.15, sheen: 0.5, sheenColor: '#ffe6d8', rim: 0.25, rimColor: '#ffb090', ao: 0.5, mottle: 0.35, mottleTint: '#8a5848' },
  vas: { color: '#ede4d2', roughness: 0.3, clearcoat: 0.8, sheen: 0.3, rim: 0.12, ao: 0.6, mottle: 0.12 },
  prostate: { color: '#c79870', roughness: 0.4, clearcoat: 0.55, sheen: 0.35, rim: 0.15, ao: 0.75, mottle: 0.45, mottleTint: '#94683e' },
  vesicle: { color: '#d4b088', roughness: 0.4, clearcoat: 0.55, sheen: 0.35, rim: 0.15, ao: 0.75, mottle: 0.45, mottleTint: '#a0805a' },
  spongiosum: { color: '#a44456', roughness: 0.4, clearcoat: 0.55, sheen: 0.35, rim: 0.2, ao: 0.6, mottle: 0.3, mottleTint: '#6a2030' },
  glans: { color: '#b4606c', roughness: 0.3, clearcoat: 0.8, sheen: 0.45, sheenColor: '#ffd0d8', rim: 0.25, rimColor: '#ff8090', ao: 0.55, mottle: 0.25, mottleTint: '#7a3a44' },
  artery: { color: '#b4262a', roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.15, sheen: 0.2, rim: 0.25, rimColor: '#ff5a50', ao: 0.7, mottle: 0.15, mottleTint: '#7a1418' },
  vein: { color: '#4a3a78', roughness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.15, sheen: 0.2, rim: 0.2, rimColor: '#8a7ac0', ao: 0.7, mottle: 0.15, mottleTint: '#2a2050' },
  bone: { color: '#e6d9bc', roughness: 0.7, clearcoat: 0.1, sheen: 0.15, sheenColor: '#fff6e0', rim: 0.05, ao: 0.95, mottle: 0.35, mottleTint: '#bfae88' },
};

function kindOf(s: AnatomicalStructure): string {
  const id = s.id;
  switch (s.layer) {
    case 'uterus': return 'uterus';
    case 'myometrium': return id === 'endometrium' ? 'endometrium' : 'myometrium';
    case 'tubes': return id.startsWith('tube-fimbriae') ? 'fimbriae' : 'tube';
    case 'ovaries': return 'ovary';
    case 'ligaments': return 'peritoneum';
    case 'vagina': return 'vagina';
    case 'vulva': return id.startsWith('labium-majus') ? 'skin' : id.startsWith('labium-minus') || id === 'clitoral-glans' ? 'mucosa' : id.startsWith('vestibular-gland') ? 'gland' : 'erectile';
    case 'breasts': return id.startsWith('mammary') ? 'breastGland' : id.startsWith('nipple') ? 'nipple' : id.startsWith('areola') ? 'areola' : id.startsWith('breast-ligaments') ? 'fascia' : 'duct';
    case 'breast-fat': return 'fat';
    case 'pregnancy': return id === 'gravid-uterus' ? 'gravid' : id === 'placenta-basal-plate' ? 'placenta' : id === 'placenta-chorionic-plate' || id === 'placental-vessels' ? 'chorion' : id === 'amnion' ? 'amnion' : id === 'umbilical-arteries' ? 'umbArtery' : id === 'umbilical-vein' ? 'umbVein' : 'cord';
    case 'urinary': return id.includes('bladder') ? 'bladder' : id.startsWith('ureter') ? 'ureter' : 'urethra';
    case 'gut': return 'gut';
    case 'neighbours': return id.startsWith('kidney') ? 'kidney' : 'gut';
    case 'pelvic-floor': return 'muscle';
    case 'testes': return id.startsWith('testis') ? 'testis' : 'epididymis';
    case 'scrotum': return 'scrotum';
    case 'ducts': return id.includes('urethra') ? 'urethra' : 'vas';
    case 'glands': return id === 'prostate' ? 'prostate' : id.startsWith('seminal') ? 'vesicle' : 'gland';
    case 'penis': return id === 'corpus-spongiosum' ? 'spongiosum' : id === 'glans-penis' ? 'glans' : 'erectile';
    case 'artery': return 'artery';
    case 'vein': return 'vein';
    default: return 'bone';
  }
}
export function realLook(s: AnatomicalStructure): TissueLook {
  return REAL[kindOf(s)] ?? REAL.bone!;
}
/** Parts that use the bumpy lobule shader (ovary surface, glandular breast lobes, prostate). */
export function lobules(s: AnatomicalStructure): { scale: number; depth: number } | null {
  if (s.layer === 'ovaries') return { scale: 1500, depth: 0.2 };
  if (s.id.startsWith('mammary-lobes')) return { scale: 700, depth: 0.22 };
  if (s.id === 'prostate' || s.id.startsWith('seminal')) return { scale: 900, depth: 0.18 };
  if (s.id === 'placenta-basal-plate') return { scale: 220, depth: 0.3 };
  return null;
}

/** How see-through each structure is in its real look (1 = opaque), in a mode. */
export function realOpacity(s: AnatomicalStructure, body: Body, mode: Mode): number {
  const m = MODE_OPACITY[body][mode];
  const byMode = m?.[s.id] ?? m?.[s.layer];
  if (byMode !== undefined) return byMode;
  switch (s.layer) {
    case 'neighbours': return 0.25;
    case 'skeleton': return 0.22;
    case 'breast-fat': return 0.28;
    case 'scrotum': return 0.35;
    default: break;
  }
  if (s.id === 'broad-ligament') return 0.35;
  if (s.id === 'uterovesical-pouch') return 0.25;
  if (s.id === 'gravid-uterus') return 0.25;
  if (s.id === 'amnion') return 0.5;
  return 1;
}

/** One hue per layer (Colour: Layers). */
export const LAYER_COLOUR: Record<string, string> = {
  uterus: '#e0608a', myometrium: '#c04070', tubes: '#f08ab0', ovaries: '#f2b134', ligaments: '#c0b090', vagina: '#d070a0', vulva: '#b060d0', breasts: '#f0a0c8', 'breast-fat': '#f0d890', pregnancy: '#9a4ad8',
  urinary: '#e0c040', gut: '#b08a70', neighbours: '#9aa0a8', 'pelvic-floor': '#c05a4a', artery: '#e03040', vein: '#4060d0', bone: '#d8c8a0', skeleton: '#d8c8a0',
  testes: '#f2b134', scrotum: '#a0c040', ducts: '#4a8ae0', glands: '#40b8a0', penis: '#c050d0',
};
/** Colour: Origin. The embryonic tissue each part develops from, the same in both bodies. */
export const ORIGIN_COLOUR: Record<string, string> = { gonad: '#f2b134', mullerian: '#e05a9a', wolffian: '#4a8ae0', sinus: '#40b8a0', tubercle: '#c050d0', folds: '#f07050', swellings: '#a0c040', other: '#9aa0a8' };
export const ORIGIN_LABEL: Record<string, string> = { gonad: 'Gonad', mullerian: 'Müllerian duct', wolffian: 'Wolffian duct', sinus: 'Urogenital sinus', tubercle: 'Genital tubercle', folds: 'Urethral folds', swellings: 'Labioscrotal swellings', other: 'Not genital' };

export function baseColour(s: AnatomicalStructure, colourBy: ColourBy): string {
  if (colourBy === 'origin') return ORIGIN_COLOUR[s.origin ?? 'other']!;
  if (colourBy === 'layer' || s.kind === 'group') return LAYER_COLOUR[s.layer] ?? realLook(s).color;
  return realLook(s).color;
}

export const HIGHLIGHT = '#ffc94d';
export const HOVER = '#ffe7a8';
/** The glow of an active part. */
export const GLOW = '#ffd27a';

/** Cut-surface colours: what a slice through each tissue shows. */
const CUT: Record<string, string> = {
  uterus: '#c47a72', myometrium: '#c27068', endometrium: '#a8303e', tube: '#d89088', fimbriae: '#e08a94', ovary: '#ece0d4', peritoneum: '#ecdcc8', vagina: '#c47a80', skin: '#e0b8a0', mucosa: '#c87080', erectile: '#9a3646', gland: '#e4caa6',
  breastGland: '#f0d0c0', duct: '#f4ead8', nipple: '#b87470', areola: '#c89080', fascia: '#f2e8da', fat: '#f6e0a0', gravid: '#c87a74', placenta: '#6a1824', chorion: '#a04a5a', amnion: '#f4ecee', cord: '#ece2da', umbArtery: '#3a4a90', umbVein: '#a82830',
  bladder: '#dcb88a', urethra: '#e8c0b0', ureter: '#ecd4a0', gut: '#c8907c', kidney: '#a85846', muscle: '#a84a40', testis: '#d8b4a4', epididymis: '#c8a098', scrotum: '#c89480', vas: '#f0e8d8',
  prostate: '#d0a47c', vesicle: '#d8b890', spongiosum: '#a84a5a', glans: '#b8687a', artery: '#9a2024', vein: '#3a2c60', bone: '#dccdaa',
};
export function cutColour(s: AnatomicalStructure): string {
  return CUT[kindOf(s)] ?? '#c9a090';
}
