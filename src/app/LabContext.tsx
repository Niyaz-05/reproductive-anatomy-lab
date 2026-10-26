import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Body, SimulationDefinition } from '../contract/schema';
import { initialState, makeReducer, type LabAction, type LabInit, type LabState } from './state';

interface LabContextValue {
  def: SimulationDefinition;
  state: LabState;
  dispatch: Dispatch<LabAction>;
  /** Switch to the other body's lab (it remounts with `init`). */
  switchBody: (body: Body, init?: LabInit) => void;
}

const Ctx = createContext<LabContextValue | null>(null);

export function LabProvider({ def, init, switchBody, children }: { def: SimulationDefinition; init?: LabInit; switchBody: (body: Body, init?: LabInit) => void; children: ReactNode }) {
  const reducer = useMemo(() => makeReducer(def), [def]);
  const [state, dispatch] = useReducer(reducer, def, (d) => initialState(d, init));
  const value = useMemo(() => ({ def, state, dispatch, switchBody }), [def, state, switchBody]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLab(): LabContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLab must be used inside <LabProvider>');
  return v;
}
