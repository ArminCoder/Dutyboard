// Građanski (portal) nalog — odvojen od internih policijskih uloga.
// Za demo nema pravog backenda: nalozi žive u localStorage, prijava u sessionStorage.
// U produkciji bi ovo bio eID/eGov nalog s pravom autentikacijom.

export interface CitizenAccount {
  /** JMB — jedinstveni identifikator naloga. */
  jmb: string;
  name: string;
  email: string;
  /** Demo: lozinka se čuva u čistom tekstu lokalno. Nikad tako u produkciji. */
  password: string;
}

/** Aktivna prijava građanina (bez lozinke). */
export interface CitizenSession {
  jmb: string;
  name: string;
  email: string;
}

export function toCitizenSession(a: CitizenAccount): CitizenSession {
  return { jmb: a.jmb, name: a.name, email: a.email };
}

/** JMB: 13 cifara (demo-validacija; ne provjeravamo kontrolnu cifru). */
export function isValidJmb(jmb: string): boolean {
  return /^\d{13}$/.test(jmb.trim());
}
