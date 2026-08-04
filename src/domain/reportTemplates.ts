import type { Officer, OrgNode, ReportKind } from '../data/types';
import { REPORT_KIND_LABEL } from '../data/types';
import { DEMO_TODAY, dayNameBs, demoNow, formatBs } from '../data/generator/dates';

/**
 * Sastavljanje dokumenta iz kratkog opisa.
 *
 * U produkciji ovo radi jezički model — policajac napiše dvije rečenice, sistem
 * sastavi cijeli dokument po obrascu i on ga samo potvrdi. U demou je obrazac
 * fiksan i popunjava se stvarnim podacima (ko, gdje, kada) + unesenim opisom;
 * ne izmišljamo sadržaj koji policajac nije naveo.
 */

export interface ComposeCtx {
  officer: Officer;
  station?: OrgNode;
  summary: string;
  kind: ReportKind;
  /** Mjesto događaja, ako je poznato (npr. iz knjige događaja). */
  location?: string;
  /** Vrijeme događaja "HH:mm"; podrazumijeva se trenutno demo vrijeme. */
  time?: string;
}

function header(ctx: ComposeCtx): string {
  const st = ctx.station?.name ?? 'Policijska stanica';
  return [
    'BOSNA I HERCEGOVINA',
    'Federacija Bosne i Hercegovine',
    'Demo kanton',
    'MINISTARSTVO UNUTRAŠNJIH POSLOVA',
    'Uprava policije',
    st.toUpperCase(),
    '',
    `Broj: ${docNumber(ctx)}`,
    `Datum: ${formatBs(DEMO_TODAY)}`,
    '',
    REPORT_KIND_LABEL[ctx.kind].toUpperCase(),
    '',
  ].join('\n');
}

/** Djelovodni broj — u produkciji ga dodjeljuje pisarnica. */
function docNumber(ctx: ComposeCtx): string {
  const seq = Math.abs(hash(ctx.officer.id + ctx.summary)) % 900 + 100;
  return `02/3-${seq}/26`;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function footer(ctx: ComposeCtx): string {
  return ['', 'Službenu radnju izvršio:', `${ctx.officer.name}`, 'Potpis: ______________________'].join('\n');
}

export function composeReport(ctx: ComposeCtx): string {
  const time = ctx.time ?? demoNow().slice(11, 16);
  const place = ctx.location ?? 'na području odgovornosti stanice';
  const opis = ctx.summary.trim();

  if (ctx.kind === 'sluzbena_zabiljeska') {
    return [
      header(ctx),
      `Dana ${formatBs(DEMO_TODAY)} godine (${dayNameBs(DEMO_TODAY)}) u ${time} sati, postupajući po`,
      `službenoj dužnosti ${place}, sačinjena je službena zabilješka o sljedećem:`,
      '',
      opis,
      '',
      'O navedenom je obaviješten šef smjene, a događaj je evidentiran u Knjizi dnevnih događaja.',
      footer(ctx),
    ].join('\n');
  }

  if (ctx.kind === 'prekrsajna_prijava') {
    return [
      header(ctx),
      `Dana ${formatBs(DEMO_TODAY)} godine u ${time} sati, ${place}, utvrđeno je počinjenje prekršaja`,
      'te se podnosi prekršajna prijava zbog sljedećeg činjeničnog stanja:',
      '',
      opis,
      '',
      'Uz prijavu se prilaže dokumentacija prikupljena tokom postupanja.',
      'Prijava se dostavlja nadležnom sudu za prekršaje.',
      footer(ctx),
    ].join('\n');
  }

  return [
    header(ctx),
    `Dana ${formatBs(DEMO_TODAY)} godine u ${time} sati, ${place}, postupano je po`,
    'saznanju o događaju, o čemu se podnosi izvještaj:',
    '',
    opis,
    '',
    'Preduzete su mjere i radnje iz nadležnosti policije. Izvještaj se dostavlja',
    'komandiru stanice na dalje postupanje.',
    footer(ctx),
  ].join('\n');
}
