import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { ROLE_CHOICES, sessionFromChoice, type RoleChoice } from '../../app/session';
import { useRoleActions } from '../../app/RoleContext';

const HOME_BY_ROLE: Record<RoleChoice['role'], string> = {
  policajac: '/policajac',
  sefSmjene: '/sef-smjene',
  dezurni: '/dezurni',
  nacelnik: '/nacelnik',
  komesar: '/komesar',
  ministar: '/ministar',
  admin: '/admin',
};

export function RolePickerScreen() {
  const nav = useNavigate();
  const { setSession } = useRoleActions();

  const choose = (choice: RoleChoice) => {
    setSession(sessionFromChoice(choice));
    nav(HOME_BY_ROLE[choice.role]);
  };

  return (
    <div className="min-h-screen bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Dutyboard demo
            </div>
            <h1 className="text-2xl font-semibold text-ink-900">Odaberi ulogu</h1>
            <p className="mt-1 text-sm text-ink-500">
              Svi podaci su izmišljeni. Svaki nivo vidi samo ono što mu pripada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_CHOICES.map((c, i) => (
            <button
              key={`${c.role}-${i}`}
              onClick={() => choose(c)}
              className="group flex items-center justify-between rounded-xl border border-ink-200 bg-white p-4 text-left transition hover:border-ink-400 hover:shadow-md"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wider text-ink-400">
                  {roleLabel(c.role)}
                </div>
                <div className="mt-1 truncate text-base font-semibold text-ink-900">{c.displayName}</div>
                <div className="mt-0.5 text-sm text-ink-500">{c.displayTitle}</div>
                <div className="mt-2 inline-block rounded-md bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                  {c.scopeLabel}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500" />
            </button>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">
          U demonstraciji nema lozinke — u produkciji: AD/LDAP + 2FA.
        </p>
      </div>
    </div>
  );
}

function roleLabel(role: RoleChoice['role']): string {
  switch (role) {
    case 'policajac':
      return 'Policajac';
    case 'sefSmjene':
      return 'Šef smjene';
    case 'dezurni':
      return 'Dežurni operativac';
    case 'nacelnik':
      return 'Načelnik PU';
    case 'komesar':
      return 'Policijski komesar';
    case 'ministar':
      return 'Ministar';
    case 'admin':
      return 'Administrator';
  }
}
