/**
 * Approved asset registry. Definitions reference assets only by these ids; the runtime resolves
 * the file, and the validators check that every mesh structure has a node in the asset. Adding an
 * asset here requires a provenance and licence entry in public/ATTRIBUTION.md.
 */
import female from '../repro/generated/female.json';
import male from '../repro/generated/male.json';

export interface ApprovedAsset {
  id: string;
  /** Path relative to the app's base URL. */
  file: string;
  format: 'glb';
  license: string;
  attribution: string;
  /** Node names present in the file; generated with the model. */
  nodes: readonly string[];
}

const nodesOf = (g: { structures: Record<string, unknown> }) => Object.keys(g.structures).filter((k) => !k.startsWith('$'));

export const APPROVED_ASSETS: Readonly<Record<string, ApprovedAsset>> = {
  'hra-female-repro-v1': {
    id: 'hra-female-repro-v1',
    file: 'models/female.glb',
    format: 'glb',
    license: 'CC-BY-4.0',
    attribution: 'HuBMAP HRA 3D reference organs (Browne, Schlehlein et al.), CC BY 4.0; BodyParts3D (DBCLS), CC BY 4.0; endometrium, gravid uterus, vulva, urethra and ovarian vessels modelled',
    nodes: nodesOf(female),
  },
  'bp3d-male-repro-v1': {
    id: 'bp3d-male-repro-v1',
    file: 'models/male.glb',
    format: 'glb',
    license: 'CC-BY-4.0',
    attribution: 'BodyParts3D (DBCLS), CC BY 4.0; scrotum, urethra segments, ejaculatory ducts, bulbourethral glands and deep arteries modelled',
    nodes: nodesOf(male),
  },
};
