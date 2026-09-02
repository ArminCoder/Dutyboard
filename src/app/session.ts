import type { AccessRole } from '../data/types';

// "Session" — koja uloga je trenutno prijavljena i pod kojim identitetom.
// Za demo nema pravih lozinki; birač uloge (E00) postavlja identitet.

export interface Session {
  role: AccessRole;
  /** ID oficira kojeg predstavljamo (za policajca, šefa smjene, dežurnog, načelnika...). */
  identityOfficerId: string | null;
  /** Org čvor koji definiše scope. Sve što ova sesija vidi je unutar ovog podstabla. */
  scopeNodeId: string;
  /** Ljudsko čitljivo ime scope-a (za title bar). */
  scopeLabel: string;
}

/** Definicija demo identiteta na E00 birač uloge (SPEC linije 56-62). */
export interface RoleChoice {
  role: AccessRole;
  officerId: string | null;
  scopeNodeId: string;
  displayName: string;
  displayTitle: string;
  scopeLabel: string;
}

export const ROLE_CHOICES: RoleChoice[] = [
  {
    role: 'policajac',
    officerId: 'off-0001', // Amar Softić
    scopeNodeId: 'ps-centar-smjena-b',
    displayName: 'Amar Softić',
    displayTitle: 'policajac, PS Centar, II smjena',
    scopeLabel: 'PS Centar · Smjena B',
  },
  {
    role: 'sefSmjene',
    officerId: 'off-0002', // Damir Kovač
    scopeNodeId: 'ps-centar',
    displayName: 'Damir Kovač',
    displayTitle: 'stariji narednik, PS Centar',
    scopeLabel: 'PS Centar',
  },
  {
    role: 'komandir',
    officerId: 'off-komandir-centar', // Adnan Softić — komandir PS Centar
    scopeNodeId: 'ps-centar',
    displayName: 'Adnan Softić',
    displayTitle: 'inspektor, komandir PS Centar',
    scopeLabel: 'PS Centar',
  },
  {
    // OKC je kantonalni — na broj 122 se javlja ovdje, pa se poziv prosljeđuje
    // stanici koja pokriva područje. Zato je scope cijela Uprava, ne jedna PU.
    role: 'dezurni',
    officerId: null,
    scopeNodeId: 'up',
    displayName: 'Operativno-komunikacijski centar',
    displayTitle: 'OKC MUP DK · dežurni operativac',
    scopeLabel: 'MUP DK · sve stanice',
  },
  {
    role: 'nacelnik',
    officerId: 'off-0003', // Samir Begić
    scopeNodeId: 'pu-centar',
    displayName: 'Samir Begić',
    displayTitle: 'načelnik PU Centar',
    scopeLabel: 'PU Centar',
  },
  {
    role: 'komesar',
    officerId: null,
    scopeNodeId: 'up',
    displayName: 'Uprava policije MUP DK',
    displayTitle: 'policijski komesar',
    scopeLabel: 'Uprava policije',
  },
  {
    role: 'ministar',
    officerId: null,
    scopeNodeId: 'mup',
    displayName: 'Kabinet ministra',
    displayTitle: 'ministar',
    scopeLabel: 'MUP Demo kantona',
  },
  {
    // Administrativna služba — šalteri: obrađuje zahtjeve građana za dokumente.
    // Scope je cijela Uprava jer se šalteri vode kantonalno.
    role: 'administracija',
    officerId: null,
    scopeNodeId: 'up',
    displayName: 'Administrativna služba',
    displayTitle: 'šalter · obrada zahtjeva građana',
    scopeLabel: 'MUP DK · šalteri',
  },
];

export function sessionFromChoice(choice: RoleChoice): Session {
  return {
    role: choice.role,
    identityOfficerId: choice.officerId,
    scopeNodeId: choice.scopeNodeId,
    scopeLabel: choice.scopeLabel,
  };
}
