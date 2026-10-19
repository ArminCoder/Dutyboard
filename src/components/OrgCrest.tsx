/* oxlint-disable react/only-export-components */
import type { LogoVariant } from '../app/orgConfig';

/** "MUP TK" → "TK": u štit stane samo oznaka kantona, ne cijela skraćenica. */
export function crestInitials(orgShort: string): string {
  return orgShort.replace(/^MUP\s+/i, '').slice(0, 4);
}

// Generički znak organizacije (ne službeni grb) — štit s inicijalima, zvijezda ili ništa.
export function OrgCrest({
  variant,
  className,
  color,
  initials,
}: {
  variant: LogoVariant;
  className?: string;
  color?: string;
  initials?: string;
}) {
  if (variant === 'bez') return null;
  const stroke = color ?? 'var(--color-brass-500)';
  if (variant === 'zvijezda') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <path
          d="M12 2.5 L14.6 9.2 L21.5 9.6 L16.2 14 L18 20.7 L12 16.9 L6 20.7 L7.8 14 L2.5 9.6 L9.4 9.2 Z"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5 L20 5.2 V12 C20 17 16.5 20.4 12 21.8 C7.5 20.4 4 17 4 12 V5.2 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {initials ? (
        <text
          x="12"
          y="13.6"
          textAnchor="middle"
          fill={stroke}
          fontSize={initials.length > 2 ? 4.6 : 5.6}
          fontWeight="600"
          letterSpacing="0.3"
          fontFamily="inherit"
        >
          {initials}
        </text>
      ) : null}
    </svg>
  );
}
