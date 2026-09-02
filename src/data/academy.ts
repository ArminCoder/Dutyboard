// MUP Akademija — deterministička baza pitanja za edukaciju i provjeru znanja.
//
// Namjena (dvojaka, prema dogovoru s vlasnikom):
//  • aktivni policajci → osvježavanje znanja i priprema za napredovanje u čin;
//  • kadeti → obavezna obuka kroz zvaničnu, MUP-om održavanu aplikaciju.
//
// Baza je ilustrativna (demo). U produkciji je uređuje pravna služba MUP-a — isto
// kao što se pravni tekstovi i instrukcije objavljuju kroz zvanične kanale. Sadržaj
// je statičan i deterministički (isti na svakom deployu), u duhu ostatka svijeta.

export interface AcademyQuestion {
  id: string;
  text: string;
  /** Tačno četiri ponuđena odgovora. */
  options: [string, string, string, string];
  /** Indeks tačnog odgovora (0–3). */
  correctIndex: number;
  /** Kratko obrazloženje — prikazuje se u pregledu rezultata. */
  explanation: string;
}

export interface AcademyOblast {
  id: string;
  title: string;
  /** Kratki naziv za bedž/karticu. */
  short: string;
  description: string;
  /** Ključ ikone (mapira se na lucide ikonu u ekranu). */
  icon: 'shield' | 'scale' | 'car' | 'gavel' | 'target';
  questions: AcademyQuestion[];
}

/** Parametri modula — pretplata, prag prolaznosti, procjena obuhvata. */
export const ACADEMY = {
  /** Cijena mjesečne pretplate po korisniku (KM). */
  monthlyKM: 10,
  /** Prag prolaznosti (udio tačnih odgovora). */
  passThreshold: 0.7,
  /** Kadetska generacija (pretplatnici van aktivnog sastava). */
  cadets: 120,
  /** Procijenjen obuhvat aktivnog sastava i kadeta. */
  adoptionOfficers: 0.62,
  adoptionCadets: 0.9,
  /** Za projekciju na nivou FBiH (pitch ministru). */
  fbihOfficers: 9000,
} as const;

/** Prihod od pretplate — deterministički izveden iz broja policajaca u svijetu.
 *  Koristi ga ministarska tabla budžeta (vlastiti prihod umanjuje neto trošak). */
export function academyRevenue(officerCount: number) {
  const officerSubs = Math.round(officerCount * ACADEMY.adoptionOfficers);
  const cadetSubs = Math.round(ACADEMY.cadets * ACADEMY.adoptionCadets);
  const totalSubs = officerSubs + cadetSubs;
  const monthlyKM = totalSubs * ACADEMY.monthlyKM;
  const fbihSubs = Math.round(ACADEMY.fbihOfficers * ACADEMY.adoptionOfficers);
  return {
    officerSubs,
    cadetSubs,
    totalSubs,
    monthlyKM,
    annualKM: monthlyKM * 12,
    fbihSubs,
    fbihMonthlyKM: fbihSubs * ACADEMY.monthlyKM,
    fbihAnnualKM: fbihSubs * ACADEMY.monthlyKM * 12,
  };
}

export const ACADEMY_OBLASTI: AcademyOblast[] = [
  {
    id: 'ovlastenja',
    title: 'Policijska ovlaštenja i dužnosti',
    short: 'Ovlaštenja',
    description: 'Načela primjene ovlaštenja, provjera identiteta, obaveze službenika.',
    icon: 'shield',
    questions: [
      {
        id: 'ov-1',
        text: 'Koje je osnovno načelo pri primjeni policijskih ovlaštenja?',
        options: ['Srazmjernost (proporcionalnost)', 'Brzina postupanja', 'Diskrecija službenika', 'Prednost jače strane'],
        correctIndex: 0,
        explanation: 'Ovlaštenje se primjenjuje samo u mjeri neophodnoj za postizanje zakonitog cilja — načelo srazmjernosti.',
      },
      {
        id: 'ov-2',
        text: 'Prilikom provjere identiteta policijski službenik je dužan:',
        options: [
          'Odmah privesti lice u stanicu',
          'Predstaviti se i navesti razlog provjere',
          'Oduzeti ličnu kartu na uvid preko noći',
          'Provjeru izvršiti bez ikakvog obrazloženja',
        ],
        correctIndex: 1,
        explanation: 'Službenik se, po pravilu, predstavlja i navodi razlog radnje, osim kad to okolnosti onemogućavaju.',
      },
      {
        id: 'ov-3',
        text: 'Upotreba sredstava prinude dopuštena je:',
        options: [
          'Uvijek kad lice ne sarađuje',
          'Samo kad je neophodna i srazmjerna, uz upozorenje kad je moguće',
          'Isključivo po pisanom nalogu suda',
          'Nikada bez prisustva nadređenog',
        ],
        correctIndex: 1,
        explanation: 'Prinuda je krajnja mjera — koristi se kad je neophodna i srazmjerna, uz prethodno upozorenje kada okolnosti to dopuštaju.',
      },
      {
        id: 'ov-4',
        text: 'Prema licu u opasnosti policijski službenik je dužan:',
        options: [
          'Pružiti pomoć bez diskriminacije',
          'Postupati samo ako je lice prijavljeno',
          'Sačekati nalog dežurnog',
          'Uputiti lice u nadležnu službu i udaljiti se',
        ],
        correctIndex: 0,
        explanation: 'Dužnost pružanja pomoći licu u opasnosti je bezuslovna i bez diskriminacije po bilo kojem osnovu.',
      },
      {
        id: 'ov-5',
        text: 'Zadržavanje kao ovlaštenje znači:',
        options: [
          'Trajno oduzimanje slobode',
          'Privremeno ograničenje kretanja u zakonom propisanim slučajevima',
          'Zabranu napuštanja države',
          'Oduzimanje vozačke dozvole',
        ],
        correctIndex: 1,
        explanation: 'Zadržavanje je privremena mjera ograničenja kretanja, dopuštena samo u zakonom određenim situacijama i trajanju.',
      },
      {
        id: 'ov-6',
        text: 'Nošenje službene značke i legitimacije pri vršenju dužnosti je:',
        options: ['Preporučeno', 'Obavezno', 'Na volju službenika', 'Potrebno samo u civilu'],
        correctIndex: 1,
        explanation: 'Identifikacija službenom značkom i legitimacijom je obavezna prilikom vršenja službene dužnosti.',
      },
    ],
  },
  {
    id: 'jrm',
    title: 'Javni red i mir',
    short: 'JRM',
    description: 'Prekršaji protiv javnog reda i mira, postupanje i prekršajni nalog.',
    icon: 'scale',
    questions: [
      {
        id: 'jrm-1',
        text: 'Šta se smatra javnim mjestom?',
        options: [
          'Samo trg i ulica',
          'Svako mjesto dostupno neodređenom broju lica',
          'Isključivo prostor u vlasništvu države',
          'Samo ugostiteljski objekti',
        ],
        correctIndex: 1,
        explanation: 'Javno mjesto je svako mjesto dostupno neodređenom broju lica — uključujući i privatne objekte otvorene za javnost.',
      },
      {
        id: 'jrm-2',
        text: 'Za lakši prekršaj protiv javnog reda i mira policajac može:',
        options: ['Izreći kaznu zatvora', 'Izdati prekršajni nalog', 'Oduzeti imovinu', 'Pokrenuti krivični postupak'],
        correctIndex: 1,
        explanation: 'Za lakše prekršaje izdaje se prekršajni nalog; teže sankcije izriče nadležni sud.',
      },
      {
        id: 'jrm-3',
        text: 'Kod narušavanja javnog reda prioritet postupanja je:',
        options: [
          'Uspostava reda uz minimalnu prinudu',
          'Privođenje svih prisutnih',
          'Sačiniti zapisnik pa reagovati',
          'Sačekati pojačanje bez intervencije',
        ],
        correctIndex: 0,
        explanation: 'Cilj je što prije uspostaviti red, koristeći najmanju nužnu mjeru prinude.',
      },
      {
        id: 'jrm-4',
        text: 'Alkoholisano lice koje narušava javni red može biti:',
        options: [
          'Samo novčano kažnjeno',
          'Zadržano radi otrežnjenja i postupanja',
          'Odmah pušteno uz upozorenje',
          'Privedeno tek uz nalog suda',
        ],
        correctIndex: 1,
        explanation: 'Lice pod uticajem alkohola koje remeti red može biti zadržano radi otrežnjenja i daljeg postupanja.',
      },
      {
        id: 'jrm-5',
        text: 'Prijava glasne buke iz ugostiteljskog objekta u noćnim satima spada u:',
        options: ['Saobraćajni prekršaj', 'Narušavanje javnog reda i mira', 'Krivično djelo', 'Prekršaj iz oblasti oružja'],
        correctIndex: 1,
        explanation: 'Prekomjerna buka koja uznemirava građane tretira se kao narušavanje javnog reda i mira.',
      },
      {
        id: 'jrm-6',
        text: 'Prilikom intervencije na javnom mjestu službena zabilješka se sačinjava:',
        options: [
          'Samo ako ima povrijeđenih',
          'O svim relevantnim radnjama i zapažanjima',
          'Isključivo na zahtjev stranke',
          'Nikada za prekršaje',
        ],
        correctIndex: 1,
        explanation: 'Službena zabilješka dokumentuje radnje i zapažanja službenika i sačinjava se o relevantnom postupanju.',
      },
    ],
  },
  {
    id: 'saobracaj',
    title: 'Bezbjednost saobraćaja',
    short: 'Saobraćaj',
    description: 'Ograničenja, alkohol u saobraćaju i postupanje na licu mjesta nezgode.',
    icon: 'car',
    questions: [
      {
        id: 'sb-1',
        text: 'Dozvoljena granica alkohola u krvi za vozače (opšti slučaj) u BiH je:',
        options: ['0,0 g/kg', '0,3 g/kg', '0,5 g/kg', '0,8 g/kg'],
        correctIndex: 1,
        explanation: 'Opšta granica je 0,3 g/kg; za pojedine kategorije (npr. profesionalce, početnike) primjenjuje se 0,0 g/kg.',
      },
      {
        id: 'sb-2',
        text: 'Najveća dozvoljena brzina u naseljenom mjestu, ako nije drugačije označeno, je:',
        options: ['40 km/h', '50 km/h', '60 km/h', '70 km/h'],
        correctIndex: 1,
        explanation: 'U naselju je opšte ograničenje 50 km/h, osim ako saobraćajni znak ne odredi drugačije.',
      },
      {
        id: 'sb-3',
        text: 'Najveća dozvoljena brzina za putnički automobil na autoputu je:',
        options: ['100 km/h', '120 km/h', '130 km/h', '140 km/h'],
        correctIndex: 2,
        explanation: 'Za putnička vozila na autoputu opšte ograničenje je 130 km/h.',
      },
      {
        id: 'sb-4',
        text: 'Vozač koji odbije test na alkohol:',
        options: [
          'Nema nikakvih posljedica',
          'Tretira se kao da je pod uticajem i čini prekršaj',
          'Mora ponoviti test sutradan',
          'Kažnjava se samo opomenom',
        ],
        correctIndex: 1,
        explanation: 'Odbijanje alkotesta predstavlja prekršaj i vozač se tretira kao lice pod uticajem alkohola.',
      },
      {
        id: 'sb-5',
        text: 'Upotreba mobitela tokom vožnje bez opreme za razgovor bez ruku je:',
        options: ['Dozvoljena u naselju', 'Zabranjena i predstavlja prekršaj', 'Dozvoljena na semaforu', 'Dozvoljena profesionalcima'],
        correctIndex: 1,
        explanation: 'Držanje i korištenje mobitela u vožnji bez „hands-free" opreme je prekršaj.',
      },
      {
        id: 'sb-6',
        text: 'Na licu mjesta saobraćajne nezgode s povrijeđenima policajac prvo:',
        options: [
          'Sačinjava skicu nezgode',
          'Osigurava lice mjesta i organizuje pomoć povrijeđenima',
          'Uzima izjave svjedoka',
          'Uklanja vozila s kolovoza',
        ],
        correctIndex: 1,
        explanation: 'Prioritet je zaštita života — obezbjeđenje lica mjesta i pružanje/organizovanje pomoći povrijeđenima.',
      },
    ],
  },
  {
    id: 'kzp',
    title: 'Krivično-procesne osnove',
    short: 'KPP osnove',
    description: 'Lišenje slobode, prava osumnjičenog, lice mjesta i dokazi.',
    icon: 'gavel',
    questions: [
      {
        id: 'kz-1',
        text: 'Lišenje slobode bez naredbe suda moguće je:',
        options: [
          'Nikada',
          'Kad su ispunjeni zakonski uslovi (npr. zaticanje u vršenju krivičnog djela)',
          'Uvijek po procjeni policajca',
          'Samo noću',
        ],
        correctIndex: 1,
        explanation: 'Zakon dopušta lišenje slobode bez naredbe u tačno određenim slučajevima, npr. zaticanje na djelu.',
      },
      {
        id: 'kz-2',
        text: 'Osumnjičeni ima pravo:',
        options: [
          'Samo na jedan telefonski poziv',
          'Na šutnju i na branioca',
          'Da ne bude obaviješten o razlogu',
          'Da odmah bude pušten',
        ],
        correctIndex: 1,
        explanation: 'Osnovna prava odbrane uključuju pravo na šutnju i pravo na branioca.',
      },
      {
        id: 'kz-3',
        text: 'Lice mjesta krivičnog djela potrebno je:',
        options: [
          'Odmah očistiti',
          'Obezbijediti i sačuvati tragove',
          'Otvoriti za javnost',
          'Fotografisati tek nakon uviđaja',
        ],
        correctIndex: 1,
        explanation: 'Do dolaska uviđajne ekipe lice mjesta se obezbjeđuje kako bi se sačuvali tragovi i dokazi.',
      },
      {
        id: 'kz-4',
        text: 'Službena zabilješka je:',
        options: [
          'Sudska odluka',
          'Pisani akt o zapažanjima i radnjama službenika',
          'Nalog za pretres',
          'Zapisnik o saslušanju svjedoka',
        ],
        correctIndex: 1,
        explanation: 'Službena zabilješka je interni pisani akt kojim službenik dokumentuje svoja zapažanja i preduzete radnje.',
      },
      {
        id: 'kz-5',
        text: 'Privremeno oduzeti predmeti:',
        options: [
          'Zadržavaju se bez evidencije',
          'Popisuju se i o tome se izdaje potvrda',
          'Odmah se uništavaju',
          'Vraćaju se isti dan bez izuzetka',
        ],
        correctIndex: 1,
        explanation: 'O privremeno oduzetim predmetima sačinjava se popis i izdaje potvrda licu od kojeg su oduzeti.',
      },
      {
        id: 'kz-6',
        text: 'Uviđaj, po pravilu, vodi:',
        options: [
          'Bilo koji policajac na terenu',
          'Tužilac odnosno ovlaštena službena lica po nalogu',
          'Načelnik PU lično',
          'Dežurni operativac telefonom',
        ],
        correctIndex: 1,
        explanation: 'Uviđajem rukovodi tužilac; radnje provode ovlaštena službena lica po njegovom nalogu.',
      },
    ],
  },
  {
    id: 'oruzje',
    title: 'Oružje i upotreba sile',
    short: 'Oružje',
    description: 'Uslovi upotrebe vatrenog oružja, upozorenje i izvještavanje.',
    icon: 'target',
    questions: [
      {
        id: 'or-1',
        text: 'Vatreno oružje se upotrebljava:',
        options: [
          'Kao prvo sredstvo prinude',
          'Kao krajnja mjera, kad druga sredstva nisu dovoljna',
          'Po slobodnoj procjeni bez ograničenja',
          'Samo uz pisani nalog suda',
        ],
        correctIndex: 1,
        explanation: 'Vatreno oružje je krajnje sredstvo prinude — koristi se samo kad blaža sredstva nisu dovoljna, uz stroge uslove.',
      },
      {
        id: 'or-2',
        text: 'Prije upotrebe vatrenog oružja, po pravilu se:',
        options: [
          'Ne daje nikakvo upozorenje',
          'Daje upozorenje („Stoj, policija!") kad okolnosti to dopuštaju',
          'Traži saglasnost dežurnog',
          'Ispaljuje hitac u zrak obavezno tri puta',
        ],
        correctIndex: 1,
        explanation: 'Kada okolnosti dopuštaju, prije upotrebe oružja daje se jasno upozorenje.',
      },
      {
        id: 'or-3',
        text: 'Nakon svake upotrebe sredstava prinude službenik:',
        options: [
          'Nije dužan izvještavati',
          'Podnosi izvještaj nadređenom',
          'Obavještava samo kolege',
          'Čeka da ga neko pita',
        ],
        correctIndex: 1,
        explanation: 'Svaka upotreba prinude podliježe obaveznom izvještavanju i ocjeni zakonitosti od strane nadređenog.',
      },
      {
        id: 'or-4',
        text: 'Službeno oružje smije nositi:',
        options: [
          'Bilo koji zaposlenik MUP-a',
          'Samo ovlašteno lice, u skladu s propisima',
          'I članovi porodice službenika',
          'Svako ko prođe osnovnu obuku, bez ovlaštenja',
        ],
        correctIndex: 1,
        explanation: 'Nošenje i rukovanje službenim oružjem dopušteno je samo ovlaštenom licu i pod propisanim uslovima.',
      },
      {
        id: 'or-5',
        text: 'Godišnje gađanje predstavlja:',
        options: [
          'Takmičenje u streljaštvu',
          'Obaveznu provjeru osposobljenosti za rukovanje oružjem',
          'Dobrovoljnu aktivnost',
          'Uslov samo za specijalce',
        ],
        correctIndex: 1,
        explanation: 'Godišnje gađanje je obavezna provjera osposobljenosti; bez važećeg certifikata službenik ne može u dio zaduženja.',
      },
      {
        id: 'or-6',
        text: 'U sredstva prinude ne spada:',
        options: [
          'Fizička snaga',
          'Službena palica',
          'Sredstva za vezivanje',
          'Usmena opomena',
        ],
        correctIndex: 3,
        explanation: 'Usmena opomena nije sredstvo prinude; prinuda obuhvata fizičku snagu, palicu, sredstva za vezivanje i dr.',
      },
    ],
  },
];

export function findOblast(id: string): AcademyOblast | undefined {
  return ACADEMY_OBLASTI.find((o) => o.id === id);
}
