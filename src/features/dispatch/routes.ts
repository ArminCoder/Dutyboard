// Aproksimirane polilinije po stvarnim ulicama Sarajeva. Koordinate [lat, lng].
// SPEC linija 350: hardcode 8 plausible routes, approximate coordinates OK.

export interface UnitDef {
  id: string;
  callSign: string;
  kind: 'auto' | 'motocikl' | 'pjesacka' | 'civilna' | 'interventna';
  /** Matična stanica — određuje ko jedinicu vidi (šef smjene svoju, OKC sve). */
  psId: string;
  polyline: Array<[number, number]>;
  officers: string[]; // slobodni opis
  loopSeconds: number;
}

export const UNITS: UnitDef[] = [
  {
    id: 'u-1',
    psId: 'ps-centar',
    callSign: 'Auto 2-1',
    kind: 'auto',
    officers: ['Softić A.', 'Mehić N.'],
    loopSeconds: 220,
    polyline: [
      [43.8580, 18.4130], [43.8586, 18.4155], [43.8593, 18.4188], [43.8600, 18.4220],
      [43.8607, 18.4255], [43.8612, 18.4290], [43.8608, 18.4320], [43.8595, 18.4335],
      [43.8580, 18.4310], [43.8570, 18.4270], [43.8570, 18.4230], [43.8575, 18.4180],
    ],
  },
  {
    id: 'u-2',
    psId: 'ps-centar',
    callSign: 'Auto 2-2',
    kind: 'auto',
    officers: ['Kovačević S.', 'Jusić E.'],
    loopSeconds: 240,
    polyline: [
      [43.8563, 18.3920], [43.8570, 18.3955], [43.8582, 18.3990], [43.8595, 18.4020],
      [43.8605, 18.4045], [43.8615, 18.4070], [43.8620, 18.4100], [43.8612, 18.4125],
      [43.8598, 18.4110], [43.8585, 18.4080], [43.8572, 18.4040], [43.8563, 18.3980],
    ],
  },
  {
    id: 'u-3',
    psId: 'ps-centar',
    callSign: 'Interventna 3-1',
    kind: 'interventna',
    officers: ['Delić R.', 'Halilović M.'],
    loopSeconds: 180,
    polyline: [
      [43.8530, 18.3810], [43.8540, 18.3850], [43.8555, 18.3880], [43.8570, 18.3910],
      [43.8582, 18.3945], [43.8578, 18.3985], [43.8562, 18.3970], [43.8548, 18.3935],
      [43.8535, 18.3895], [43.8528, 18.3855],
    ],
  },
  {
    id: 'u-4',
    psId: 'ps-centar',
    callSign: 'Moto 4-1',
    kind: 'motocikl',
    officers: ['Softić E.'],
    loopSeconds: 160,
    polyline: [
      [43.8563, 18.4113], [43.8580, 18.4165], [43.8600, 18.4210], [43.8620, 18.4260],
      [43.8635, 18.4310], [43.8628, 18.4355], [43.8608, 18.4370], [43.8585, 18.4340],
      [43.8570, 18.4285], [43.8560, 18.4220], [43.8555, 18.4160],
    ],
  },
  {
    id: 'u-5',
    psId: 'ps-centar',
    callSign: 'Pješačka 1-1',
    kind: 'pjesacka',
    officers: ['Alić T.', 'Hasanović V.'],
    loopSeconds: 340,
    polyline: [
      [43.8590, 18.4310], [43.8593, 18.4325], [43.8596, 18.4340], [43.8600, 18.4355],
      [43.8598, 18.4370], [43.8593, 18.4382], [43.8587, 18.4370], [43.8583, 18.4355],
      [43.8580, 18.4340], [43.8585, 18.4325],
    ],
  },
  {
    id: 'u-6',
    psId: 'ps-centar',
    callSign: 'Pješačka 1-2',
    kind: 'pjesacka',
    officers: ['Suljić A.', 'Muminović N.'],
    loopSeconds: 320,
    polyline: [
      [43.8574, 18.4315], [43.8570, 18.4335], [43.8568, 18.4355], [43.8571, 18.4370],
      [43.8578, 18.4362], [43.8583, 18.4348], [43.8582, 18.4330], [43.8578, 18.4320],
    ],
  },
  {
    id: 'u-7',
    psId: 'ps-novi-grad',
    callSign: 'Civilna 5-1',
    kind: 'civilna',
    officers: ['Šarić D.', 'Karić I.'],
    loopSeconds: 260,
    polyline: [
      [43.8479, 18.3595], [43.8494, 18.3620], [43.8510, 18.3655], [43.8528, 18.3690],
      [43.8548, 18.3720], [43.8563, 18.3745], [43.8555, 18.3775], [43.8535, 18.3760],
      [43.8515, 18.3730], [43.8497, 18.3690], [43.8483, 18.3648],
    ],
  },
  {
    id: 'u-8',
    psId: 'ps-dobrinja',
    callSign: 'Auto 2-3',
    kind: 'auto',
    officers: ['Ramić F.', 'Nuhić B.'],
    loopSeconds: 200,
    polyline: [
      [43.8385, 18.3565], [43.8400, 18.3600], [43.8420, 18.3640], [43.8445, 18.3680],
      [43.8470, 18.3720], [43.8480, 18.3760], [43.8470, 18.3798], [43.8450, 18.3810],
      [43.8425, 18.3785], [43.8405, 18.3745], [43.8390, 18.3700], [43.8383, 18.3630],
    ],
  },
  // --- PS Stari Grad (Baščaršija, Vratnik, Kovači) ---
  {
    id: 'u-9',
    psId: 'ps-stari-grad',
    callSign: 'Pješačka 3-1',
    kind: 'pjesacka',
    officers: ['Bešlija H.', 'Zolj A.'],
    loopSeconds: 300,
    polyline: [
      [43.8595, 18.4290], [43.8598, 18.4310], [43.8602, 18.4330], [43.8608, 18.4348],
      [43.8615, 18.4362], [43.8610, 18.4378], [43.8600, 18.4368], [43.8592, 18.4348],
      [43.8588, 18.4325], [43.8590, 18.4305],
    ],
  },
  {
    id: 'u-10',
    psId: 'ps-stari-grad',
    callSign: 'Auto 3-2',
    kind: 'auto',
    officers: ['Čengić M.', 'Hodžić S.'],
    loopSeconds: 250,
    polyline: [
      [43.8600, 18.4400], [43.8618, 18.4435], [43.8636, 18.4470], [43.8650, 18.4510],
      [43.8658, 18.4550], [43.8645, 18.4578], [43.8625, 18.4560], [43.8610, 18.4520],
      [43.8598, 18.4475], [43.8592, 18.4432],
    ],
  },
  // --- PS Novi Grad (Alipašino Polje, Otoka, Bulevar) ---
  {
    id: 'u-11',
    psId: 'ps-novi-grad',
    callSign: 'Auto 5-1',
    kind: 'auto',
    officers: ['Karić S.', 'Zukić D.'],
    loopSeconds: 230,
    polyline: [
      [43.8490, 18.3560], [43.8478, 18.3600], [43.8465, 18.3645], [43.8452, 18.3690],
      [43.8445, 18.3735], [43.8455, 18.3770], [43.8472, 18.3752], [43.8486, 18.3712],
      [43.8498, 18.3665], [43.8500, 18.3610],
    ],
  },
  {
    id: 'u-12',
    psId: 'ps-novi-grad',
    callSign: 'Interventna 5-3',
    kind: 'interventna',
    officers: ['Fazlić N.', 'Omerović T.'],
    loopSeconds: 190,
    polyline: [
      [43.8520, 18.3480], [43.8508, 18.3520], [43.8495, 18.3562], [43.8482, 18.3605],
      [43.8472, 18.3648], [43.8482, 18.3682], [43.8498, 18.3660], [43.8512, 18.3618],
      [43.8524, 18.3572], [43.8530, 18.3520],
    ],
  },
  // --- PS Dobrinja ---
  {
    id: 'u-13',
    psId: 'ps-dobrinja',
    callSign: 'Auto 6-1',
    kind: 'auto',
    officers: ['Šehić A.', 'Bajrić E.'],
    loopSeconds: 270,
    polyline: [
      [43.8300, 18.3390], [43.8318, 18.3428], [43.8338, 18.3468], [43.8358, 18.3505],
      [43.8375, 18.3545], [43.8365, 18.3585], [43.8345, 18.3562], [43.8328, 18.3520],
      [43.8310, 18.3478], [43.8298, 18.3432],
    ],
  },
];
