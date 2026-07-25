// Zajednički theme za sve Recharts instance u aplikaciji.
// Boje su iz institucionalne palete: navy dominira, brass akcent, signal boje za alarme.

export const CHART_COLORS = {
  primary: '#14203a',    // navy-800
  secondary: '#b8935a',  // brass-500
  tertiary: '#3a4761',   // navy-500
  ok: '#3f7f5e',
  warn: '#a67626',
  alarm: '#a83232',
  grid: '#e8e4d8',       // paper-200
  axis: '#524d42',       // ink-500
  tickLabel: '#3d382f',  // ink-600
  bg: '#faf9f5',         // paper-50
  surface: '#ffffff',
};

export const CHART_TICK = {
  fontSize: 10,
  fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
  fill: CHART_COLORS.tickLabel,
};

export const CHART_TOOLTIP: React.CSSProperties = {
  fontSize: 12,
  fontFamily: 'IBM Plex Sans, ui-sans-serif, sans-serif',
  border: '1px solid #d6bd91',
  borderRadius: 0,
  background: '#ffffff',
  boxShadow: 'none',
  padding: '8px 12px',
};

export const CHART_TOOLTIP_LABEL: React.CSSProperties = {
  fontFamily: 'Fraunces, serif',
  color: '#14203a',
  fontWeight: 500,
  fontSize: 12,
};

export const CHART_MARGIN = { top: 4, right: 8, left: -20, bottom: 0 };
