// Konfiguracija organizacije (white-label). Ista aplikacija se isporučuje
// različitim policijskim upravama — naziv, boje i znak se podešavaju ovdje,
// bez ikakvih izmjena u kodu.

export type LogoVariant = 'stit' | 'zvijezda' | 'bez';

export interface OrgConfig {
  /** Puni naziv koji se prikazuje na kapiji i biraču uloga. */
  orgName: string;
  /** Skraćenica za uska mjesta (zaglavlja, izvještaji). */
  orgShort: string;
  /** Naziv proizvoda u bočnoj traci. */
  productName: string;
  colors: {
    /** Institucionalna (primarna) boja — navy skala. */
    primary: string;
    /** Akcent — brass/zlatna skala. */
    accent: string;
  };
  logo: LogoVariant;
  /** Moduli po organizaciji — pripremljeno za sljedeću fazu. */
  features: Record<string, boolean>;
}

export const DEFAULT_ORG: OrgConfig = {
  orgName: 'Ministarstvo unutrašnjih poslova · Demo kanton',
  orgShort: 'MUP DK',
  productName: 'Dutyboard',
  colors: { primary: '#132241', accent: '#bf9a5c' },
  logo: 'stit',
  features: { kdd: true, bilten: true, mapa: true, simulacija: true, plata: true },
};

export const ORG_PRESETS: Array<{ label: string; primary: string; accent: string }> = [
  { label: 'Policijska plava · zlatna', primary: '#132241', accent: '#bf9a5c' },
  { label: 'Tamnozelena · srebrna', primary: '#14301f', accent: '#9aa7ab' },
  { label: 'Bordo · zlatna', primary: '#3a1220', accent: '#c0a062' },
];

const STORAGE_KEY = 'dutyboard.orgConfig';

export function loadOrgConfig(): OrgConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ORG;
    const parsed = JSON.parse(raw) as Partial<OrgConfig>;
    return {
      ...DEFAULT_ORG,
      ...parsed,
      colors: { ...DEFAULT_ORG.colors, ...(parsed.colors ?? {}) },
      features: { ...DEFAULT_ORG.features, ...(parsed.features ?? {}) },
    };
  } catch {
    return DEFAULT_ORG;
  }
}

export function saveOrgConfig(cfg: OrgConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // privatni način rada — tema ostaje samo do reload-a
  }
}

export function resetOrgConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignoriši */
  }
}

// --- Izvođenje skale boja -------------------------------------------------

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(0)} ${Math.max(0, Math.min(100, s)).toFixed(0)}% ${Math.max(0, Math.min(100, l)).toFixed(0)}%)`;
}

/** Primjenjuje temu organizacije na CSS varijable — svi Tailwind utilityji i
 *  grafovi čitaju iste varijable, pa se aplikacija pretemira bez reload-a. */
export function applyOrgTheme(cfg: OrgConfig): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const [ph, ps, pl] = hexToHsl(cfg.colors.primary);
  // navy skala: 900 je zadana boja, ostale se izvode posvjetljavanjem
  const navySteps: Array<[string, number]> = [
    ['900', pl], ['800', pl + 5], ['700', pl + 11], ['600', pl + 18], ['500', pl + 26], ['400', pl + 34],
  ];
  for (const [step, light] of navySteps) {
    root.style.setProperty(`--color-navy-${step}`, hsl(ph, ps, light));
  }

  const [ah, as, al] = hexToHsl(cfg.colors.accent);
  const brassSteps: Array<[string, number]> = [
    ['100', al + 30], ['300', al + 16], ['500', al], ['600', al - 9], ['700', al - 18], ['800', al - 27],
  ];
  for (const [step, light] of brassSteps) {
    root.style.setProperty(`--color-brass-${step}`, hsl(ah, as, light));
  }

  // Tamna paleta (operativni centar) prati nijansu primarne boje.
  root.style.setProperty('--color-dark-bg', hsl(ph, Math.min(ps, 55), 7));
  root.style.setProperty('--color-dark-surface', hsl(ph, Math.min(ps, 55), 12));
  root.style.setProperty('--color-dark-elevated', hsl(ph, Math.min(ps, 55), 18));
  root.style.setProperty('--color-dark-border', hsl(ph, Math.min(ps, 55), 21));
}
