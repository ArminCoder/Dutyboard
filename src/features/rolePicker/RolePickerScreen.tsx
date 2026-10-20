import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Users } from 'lucide-react';
import { ROLE_CHOICES, sessionFromChoice, type RoleChoice } from '../../app/session';
import { useRoleActions } from '../../app/RoleContext';
import { useOrg } from '../../app/OrgContext';
import { OrgCrest, crestInitials } from '../../components/OrgCrest';
import { loadSeen, markSeen } from '../../app/seenRoles';

const HOME_BY_ROLE: Record<RoleChoice['role'], string> = {
  policajac: '/policajac',
  sefSmjene: '/sef-smjene',
  komandir: '/komandir',
  dezurni: '/dezurni',
  nacelnik: '/nacelnik',
  komesar: '/komesar',
  ministar: '/ministar',
  administracija: '/administracija',
  admin: '/admin',
};

const OPERATIVA: RoleChoice['role'][] = ['policajac', 'sefSmjene', 'dezurni'];
const RUKOVODSTVO: RoleChoice['role'][] = ['komandir', 'nacelnik', 'komesar', 'ministar'];
const PODRSKA: RoleChoice['role'][] = ['administracija'];

export function RolePickerScreen() {
  const nav = useNavigate();
  const { setSession } = useRoleActions();
  const { org } = useOrg();

  // Pročitano pri svakom povratku na birač — uloga se označi čim se otvori.
  const seen = loadSeen();
  const seenCount = ROLE_CHOICES.filter((c) => seen.has(c.role)).length;

  const choose = (choice: RoleChoice) => {
    markSeen(choice.role);
    setSession(sessionFromChoice(choice));
    nav(HOME_BY_ROLE[choice.role]);
  };

  const operativa = ROLE_CHOICES.filter((c) => OPERATIVA.includes(c.role));
  const rukovodstvo = ROLE_CHOICES.filter((c) => RUKOVODSTVO.includes(c.role));
  const podrska = ROLE_CHOICES.filter((c) => PODRSKA.includes(c.role));

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <header className="mb-12 text-center">
          <OrgCrest variant={org.logo} initials={crestInitials(org.orgShort)} className="mx-auto mb-4 h-12 w-12" />
          <div className="section-label mb-3 text-brass-600">{org.orgName}</div>
          <h1 className="font-heading text-4xl leading-tight text-ink-800 md:text-5xl">Odaberi ulogu</h1>
          <div className="mx-auto mt-5 h-[2px] w-16 bg-brass-500" />
          <p className="mx-auto mt-5 max-w-xl text-sm text-ink-500">
            Svaki nivo vidi samo ono što mu pripada — ista aplikacija kroz šest pari očiju.
            Svi podaci u demonstraciji su izmišljeni.
          </p>
          {seenCount > 0 ? (
            <p className="mt-3 text-xs text-ink-400">
              Pregledano {seenCount} od {ROLE_CHOICES.length} uloga
            </p>
          ) : null}
        </header>

        <RoleGroup title="Operativa" choices={operativa} seen={seen} onChoose={choose} />
        <div className="my-10 h-px bg-paper-200" />
        <RoleGroup title="Rukovodstvo" choices={rukovodstvo} seen={seen} onChoose={choose} />
        <div className="my-10 h-px bg-paper-200" />
        <RoleGroup title="Podrška" choices={podrska} seen={seen} onChoose={choose} />

        <div className="mt-8 flex justify-center">
          <a
            href="/portal"
            onClick={() => markSeen('portal')}
            className="inline-flex items-center gap-2 border border-navy-700 bg-paper-0 px-4 py-2 text-sm text-navy-900 transition hover:bg-paper-100"
          >
            <Users className="h-4 w-4" />
            Otvori portal za građane
            {seen.has('portal') ? <SeenMark /> : null}
          </a>
        </div>

        <div className="mt-14 border-t border-paper-200 pt-6">
          <div className="section-label mb-3 text-center text-ink-400">Prilozi za pitanja u toku prezentacije</div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <a href="/mockup/pisarnica" className="border border-paper-300 bg-paper-0 px-3 py-1.5 text-ink-600 hover:border-brass-500 hover:text-navy-900">
              X01 · e-Pisarnica
            </a>
            <a href="/mockup/tajnost" className="border border-paper-300 bg-paper-0 px-3 py-1.5 text-ink-600 hover:border-brass-500 hover:text-navy-900">
              X02 · Stepen tajnosti
            </a>
            <a href="/mockup/admin" className="border border-paper-300 bg-paper-0 px-3 py-1.5 text-ink-600 hover:border-brass-500 hover:text-navy-900">
              X03 · Administracija i audit
            </a>
            <button
              onClick={() => {
                setSession({ role: 'admin', identityOfficerId: null, scopeNodeId: 'mup', scopeLabel: 'Administracija' });
                nav('/admin');
              }}
              className="border border-paper-300 bg-paper-0 px-3 py-1.5 text-ink-600 hover:border-brass-500 hover:text-navy-900"
            >
              A01 · Postavke organizacije
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">
          U demonstraciji nema lozinke — produkcija koristi AD/LDAP + 2FA.
        </p>
      </div>
    </div>
  );
}

function RoleGroup({
  title,
  choices,
  seen,
  onChoose,
}: {
  title: string;
  choices: RoleChoice[];
  seen: Set<string>;
  onChoose: (c: RoleChoice) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="section-label">{title}</span>
        <span className="h-px flex-1 bg-paper-200" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {choices.map((c, i) => (
          <RoleCard key={`${c.role}-${i}`} choice={c} seen={seen.has(c.role)} onClick={() => onChoose(c)} />
        ))}
      </div>
    </section>
  );
}

function RoleCard({ choice, seen, onClick }: { choice: RoleChoice; seen: boolean; onClick: () => void }) {
  const initials = choice.displayName
    .split(/\s+/)
    .filter((s) => s[0]?.match(/[A-ZŠĐČĆŽ]/i))
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('') || 'MK';

  return (
    <button
      onClick={onClick}
      className="group relative flex items-center gap-4 border border-paper-200 bg-paper-0 p-5 text-left transition hover:border-navy-700"
    >
      {/* Mesing accent bar */}
      <span className="absolute left-0 top-0 h-full w-[3px] bg-brass-500 opacity-0 transition group-hover:opacity-100" />

      <div className="flex h-12 w-12 flex-none items-center justify-center border border-brass-500 font-heading text-base font-medium text-navy-900">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-heading text-base font-medium text-ink-800">{choice.displayName}</div>
        <div className="mt-0.5 text-xs text-ink-500">{choice.displayTitle}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1 border border-brass-300 bg-brass-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brass-700">
            {choice.scopeLabel}
          </span>
          {seen ? <SeenMark /> : null}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 flex-none text-paper-300 transition group-hover:translate-x-0.5 group-hover:text-brass-500" />
    </button>
  );
}

/** Tiha oznaka „već pogledano" — zelena (ok), ne crvena; nije alarm. */
function SeenMark() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-signal-ok">
      <Check className="h-3 w-3" />
      Pogledano
    </span>
  );
}
