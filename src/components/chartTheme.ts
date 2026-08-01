// Zajednički theme za sve Recharts instance u aplikaciji.
// Boje se čitaju iz CSS varijabli (@theme u index.css) kako bi grafovi pratili
// temu organizacije koja se može mijenjati u toku rada (white-label).
// Statične vrijednosti su fallback za prvi render i okruženja bez DOM-a.

const FALLBACK = {
  primary: '#132241',
  secondary: '#bf9a5c',
  tertiary: '#3a5089',
  ok: '#3f7f5e',
  warn: '#a67626',
  alarm: '#a83232',
  grid: '#dde4ef',
  axis: '#4c5670',
  tickLabel: '#353e55',
  bg: '#f7f9fc',
  surface: '#ffffff',
  tooltipBorder: '#dcc593',
} as const;

/** Vrijednost CSS varijable u trenutku poziva (Recharts čita props pri svakom renderu). */
export function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export const CHART_COLORS = {
  get primary() { return cssVar('--color-navy-800', FALLBACK.primary); },
  get secondary() { return cssVar('--color-brass-500', FALLBACK.secondary); },
  get tertiary() { return cssVar('--color-navy-500', FALLBACK.tertiary); },
  get ok() { return cssVar('--color-signal-ok', FALLBACK.ok); },
  get warn() { return cssVar('--color-signal-warn', FALLBACK.warn); },
  get alarm() { return cssVar('--color-signal-alarm', FALLBACK.alarm); },
  get grid() { return cssVar('--color-paper-200', FALLBACK.grid); },
  get axis() { return cssVar('--color-ink-500', FALLBACK.axis); },
  get tickLabel() { return cssVar('--color-ink-600', FALLBACK.tickLabel); },
  get bg() { return cssVar('--color-paper-50', FALLBACK.bg); },
  get surface() { return cssVar('--color-paper-0', FALLBACK.surface); },
};

export const CHART_TICK = {
  fontSize: 10,
  fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
  get fill() { return CHART_COLORS.tickLabel; },
};

export const CHART_TOOLTIP: React.CSSProperties = {
  fontSize: 12,
  fontFamily: 'IBM Plex Sans, ui-sans-serif, sans-serif',
  get border() { return `1px solid ${cssVar('--color-brass-300', FALLBACK.tooltipBorder)}`; },
  borderRadius: 0,
  get background() { return CHART_COLORS.surface; },
  boxShadow: 'none',
  padding: '8px 12px',
};

export const CHART_TOOLTIP_LABEL: React.CSSProperties = {
  fontFamily: 'Fraunces, serif',
  get color() { return CHART_COLORS.primary; },
  fontWeight: 500,
  fontSize: 12,
};

export const CHART_MARGIN = { top: 4, right: 8, left: -20, bottom: 0 };
