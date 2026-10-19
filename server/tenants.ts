import fs from 'node:fs';
import path from 'node:path';

// Tenant profiles: per access-key branding (org name, station names, map city).
// Keyed by the same label used in ACCESS_KEYS ("tk:TK-XXXX" → profile "tk").
// The file is NOT committed (it names real organisations); see tenants.example.json.
// Every field is optional — the client falls back to the fictional demo values.

export interface TenantProfile {
  orgName?: string;
  orgShort?: string;
  rootName?: string;
  region?: string;
  city?: string;
  cityLocative?: string;
  mapCenter?: [number, number];
  places?: Partial<Record<'puCentar' | 'psCentar' | 'psStariGrad' | 'puNoviGrad' | 'psNoviGrad' | 'psDobrinja', string>>;
  streets?: string[];
  colors?: { primary?: string; accent?: string };
}

export function loadTenants(file: string | undefined): Map<string, TenantProfile> {
  const map = new Map<string, TenantProfile>();
  const resolved = path.resolve(file && file.trim().length > 0 ? file : 'tenants.json');
  if (!fs.existsSync(resolved)) return map;
  try {
    const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8')) as Record<string, TenantProfile>;
    for (const [label, profile] of Object.entries(parsed)) {
      if (profile && typeof profile === 'object') map.set(label, profile);
    }
  } catch (err) {
    console.error(`[dutyboard] ${resolved} nije ispravan JSON — tenant profili ignorisani.`, err);
  }
  return map;
}
