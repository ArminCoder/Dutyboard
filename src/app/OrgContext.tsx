/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { applyOrgTheme, loadOrgConfig, resetOrgConfig, saveOrgConfig, DEFAULT_ORG, type OrgConfig } from './orgConfig';

interface OrgContextValue {
  org: OrgConfig;
  setOrg: (cfg: OrgConfig) => void;
  resetOrg: () => void;
}

const OrgCtx = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrgState] = useState<OrgConfig>(() => {
    const cfg = loadOrgConfig();
    applyOrgTheme(cfg);
    return cfg;
  });

  const setOrg = useCallback((cfg: OrgConfig) => {
    saveOrgConfig(cfg);
    applyOrgTheme(cfg);
    setOrgState(cfg);
  }, []);

  const resetOrg = useCallback(() => {
    resetOrgConfig();
    applyOrgTheme(DEFAULT_ORG);
    setOrgState(DEFAULT_ORG);
  }, []);

  const value = useMemo(() => ({ org, setOrg, resetOrg }), [org, setOrg, resetOrg]);
  return <OrgCtx.Provider value={value}>{children}</OrgCtx.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgCtx);
  if (!ctx) throw new Error('OrgProvider nije montiran.');
  return ctx;
}
