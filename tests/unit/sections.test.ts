import { describe, expect, it } from 'vitest';
import { DEFINITIONS } from '../../src/repro/definition';
import { SECTIONS } from '../../src/repro/content/sections';

describe('structure list', () => {
  for (const body of ['female', 'male'] as const) {
    it(`lists every ${body} mesh structure exactly once (directly or inside its group)`, () => {
      const def = DEFINITIONS[body];
      const listed = SECTIONS[body].flatMap((sec) => sec.ids).flatMap((id) => {
        const s = def.structures.find((x) => x.id === id);
        expect(s, id).toBeTruthy();
        return s!.kind === 'group' ? s!.members! : [id];
      });
      expect([...listed].sort()).toEqual(def.structures.filter((s) => s.kind === 'mesh').map((s) => s.id).sort());
    });
  }
});
