// rules.js

// Pořadí v selectu (skupiny jen vizuálně přes label)
window.LINE_TYPE_OPTIONS = [
  // --- Tram ---
  { value: "tram_day",            label: "Tram denní" },
  { value: "tram_night",          label: "Tram noční" },
  { value: "tram_special",        label: "Tram zvláštní" },
  { value: "tram_day_outage",     label: "Tram denní výluka" },
  { value: "tram_night_outage",   label: "Tram noční výluka" },
  { value: "tram_special_outage", label: "Tram zvláštní výluka" },

  // --- Bus ---
  { value: "bus_day",                  label: "Bus denní" },
  { value: "bus_night",                label: "Bus noční" },
  { value: "bus_suburban",             label: "Bus příměstský" },
  { value: "bus_suburban_night",       label: "Bus příměstský noční" },
  { value: "bus_special",              label: "Bus zvláštní" },
  { value: "bus_day_outage",           label: "Bus denní výluka" },
  { value: "bus_night_outage",         label: "Bus noční výluka" },
  { value: "bus_suburban_outage",      label: "Bus příměstský výluka" },
  { value: "bus_suburban_night_outage",label: "Bus příměstský noční výluka" },

  // --- Trolejbus ---
  { value: "trolley_day",        label: "Trolejbus denní" },
  { value: "trolley_day_outage", label: "Trolejbus denní výluka" },
];

window.LINE_STYLE_RULES = {
  // --- Tram ---
  tram_day:            { bg: "#ffffff", fg: "#7A2011" },
  tram_night:          { bg: "#7A2011", fg: "#ffffff" },
  tram_special:        { bg: "#ffffff", fg: "#8cc46b" },
  tram_day_outage:     { bg: "#fdcc1a", fg: "#7A2011" },
  tram_night_outage:   { bg: "#7A2011", fg: "#fdcc1a" },
  tram_special_outage: { bg: "#fdcc1a", fg: "#8cc46b" },

  // --- Bus ---
  bus_day:                   { bg: "#ffffff", fg: "#0069a2" },
  bus_night:                 { bg: "#0069a2", fg: "#ffffff" },
  bus_suburban:              { bg: "#ffffff", fg: "#000000" },
  bus_suburban_night:        { bg: "#000000", fg: "#ffffff" },
  // „Bus zvláštní“ = stejné jako „Tram zvláštní“
  bus_special:               { bg: "#ffffff", fg: "#8cc46b" },
  bus_day_outage:            { bg: "#fdcc1a", fg: "#0069a2" },
  bus_night_outage:          { bg: "#0069a2", fg: "#fdcc1a" },
  bus_suburban_outage:       { bg: "#fdcc1a", fg: "#000000" },
  bus_suburban_night_outage: { bg: "#000000", fg: "#fdcc1a" },

  // --- Trolejbus ---
  trolley_day:               { bg: "#ffffff", fg: "#7b206e" },
  trolley_day_outage:        { bg: "#fdcc1a", fg: "#7b206e" },
};

// Default typ pro nové buňky
window.DEFAULT_LINE_TYPE = "tram_day";

// --- Název (layout + odsazení + velikosti) ---
window.NAME_RULES = {
  defaultLayout: "one",  // "one" | "two15" | "two2"
  defaultSize: 140,      // 140 | 115 (použije se tam, kde je volitelné)

  layouts: {
    one075: {
      heightMm: 51.75,
      bottomMm: 0,
      fontPt: 110, // fixní velikost
    },
    
    one: {
      heightMm: 70,
      bottomMm: 6,          // odsazení odspodu pro 1 řádek
      sizes: [140, 115],    // povolené velikosti
    },

    one15: {
      heightMm: 106.5,     // 1.5 pole
      bottomMm: 25,      // aby byl text hezky „uprostřed“ (baseline)
      fontPt: 105,          // fixní velikost
    },

    two15: {
      heightMm: 106.5,      // 1.5 pole
      topBottomMm: 55,      // horní řádek: vzdálenost odspodu
      bottomBottomMm: 10,   // spodní řádek: vzdálenost odspodu
      fontPt: 105,          // fixní velikost
    },

    two2: {
      heightMm: 143,        // 2 pole + mezera
      topBottomMm: 70,
      bottomBottomMm: 15,
      sizes: [140, 115],
    },

    three: {
  heightMm: 143,       // bere velikost "2 řádky (2)"
  topBottomMm: 90,
  midBottomMm: 50,
  bottomBottomMm: 10,
  fontPt: 105,
},
  },
};


// --- Ikony (řádek typu: Ikona) ---
window.ICON_OPTIONS = [
  { value: "./fonty/icon_big_metro_a.svg", label: "Metro A" },
  { value: "./fonty/icon_big_metro_b.svg", label: "Metro B" },
  { value: "./fonty/icon_big_metro_c.svg", label: "Metro C" },
  { value: "./fonty/icon_big_linky_s.svg", label: "Linky S" },
  { value: "./fonty/icon_big_pasmo.svg", label: "Pásmo" },
  { value: "./fonty/icon_big_nastupiste.svg", label: "Nástupiště" },  
  { value: "./fonty/icon_big_lanovka.svg", label: "Lanová dráha" },
  { value: "./fonty/icon_big_privoz.svg", label: "Přívoz" },
  { value: "./fonty/icon_big_letiste.svg", label: "Letiště" },
  { value: "./fonty/icon_big_nocni_prestup.svg", label: "Noční přestup" },
  { value: "./fonty/icon_big_preprava_kol.svg", label: "Přeprava kol" },
];

// --- Linková informace ---
window.INFO_TYPE_OPTIONS = [
  { value: "request_stop", label: "Na znamení" },
  { value: "exit_only", label: "Výstupní" },
  { value: "occasional", label: "Občasná" },
  { value: "service", label: "Manipulační" },
  
  { value: "request_stop_05", label: "Na znamení (0.5)" },
  { value: "exit_only_05", label: "Výstupní (0.5)" },
  { value: "occasional_05", label: "Občasná (0.5)" },
  { value: "service_05", label: "Manipulační (0.5)" },

  { value: "platform_05", label: "Nástupiště" },
  { value: "temp_change", label: "Dočasná změna" },
  { value: "substitute_stop", label: "Náhradní zastávka" },
  { value: "direction", label: "Směr" },
];

window.INFO_TYPE_RULES = {
  request_stop: {
    layout: "requestStop",
    heightMm: 70,
    bottomPaddingMm: 15,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "NA ZNAMENÍ / ", sizePt: 100, },
      { text: "REQUEST STOP", sizePt: 50 },
    ],
  },
};

window.INFO_TYPE_RULES = {
  request_stop: {
    layout: "requestStop",
    heightMm: 70,
    bottomPaddingMm: 15,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "NA ZNAMENÍ / ", sizePt: 100 },
      { text: "REQUEST STOP", sizePt: 50 },
    ],
  },

  exit_only: {
    layout: "requestStop",
    heightMm: 70,
    bottomPaddingMm: 15,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "VÝSTUPNÍ / ", sizePt: 100 },
      { text: "EXIT ONLY", sizePt: 50 },
    ],
  },

    occasional: {
    layout: "requestStop",
    heightMm: 70,
    bottomPaddingMm: 15,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "OBČASNÁ / ", sizePt: 100 },
      { text: "OCCASIONAL", sizePt: 50 },
    ],
  },

    service: {
    layout: "requestStop",
    heightMm: 70,
    bottomPaddingMm: 15,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "MANIPULAČNÍ / ", sizePt: 100 },
      { text: "SERVICE", sizePt: 50 },
    ],
  },

    request_stop_05: {
    layout: "requestStop",
    heightMm: 33.5,
    bottomPaddingMm: 0,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "NA ZNAMENÍ / ", sizePt: 80 },
      { text: "REQUEST STOP", sizePt: 40 },
    ],
  },

  exit_only_05: {
    layout: "requestStop",
    heightMm: 33.5,
    bottomPaddingMm: 0,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "VÝSTUPNÍ / ", sizePt: 80 },
      { text: "EXIT ONLY", sizePt: 40 },
    ],
  },

  occasional_05: {
    layout: "requestStop",
    heightMm: 33.5,
    bottomPaddingMm: 0,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "OBČASNÁ / ", sizePt: 80 },
      { text: "OCCASIONAL", sizePt: 40 },
    ],
  },

  service_05: {
    layout: "requestStop",
    heightMm: 33.5,
    bottomPaddingMm: 0,
    color: "#e31f1f",
    fontFamily: "Stroudley-bold",
    parts: [
      { text: "MANIPULAČNÍ / ", sizePt: 80 },
      { text: "SERVICE", sizePt: 40 },
    ],
  },

  platform_05: {
  layout: "platform",
  heightMm: 33.5,
  bottomPaddingMm: 0,

  bg: "#00a662",
  color: "#ffffff",
  fontFamily: "Stroudley-bold",

  needsText: true, // kvůli zobrazení inputu v editoru

  parts: [
    { text: "Nástupiště / ", sizePt: 70 },
    { text: "platform ", sizePt: 60 },
    { bind: "userText", sizePt: 70 },
  ],
},

  temp_change: {
    layout: "tempChange",
    heightMm: 70,

    bg: "#fdcc1a",
    color: "#000000",
    fontFamily: "Stroudley-bold",

    icon: "./fonty/icon_small_zmena.svg",
    iconSizeMm: 33.5,
    gapMm: 5,
    leftPadMm: 5,

    // řádek 1
    line1BottomMm: 37,
    line1Parts: [
      { text: "dočasná změna od / ", sizePt: 70 },
      { text: "temporary change from", sizePt: 28, fontFamily: "Stroudley-regular" },
    ],

    // řádek 2 (uživatelský text)
    needsText: true,
    line2BottomMm: 0,
    line2SizePt: 78,
  },

    substitute_stop: {
    layout: "tempChange",
    heightMm: 70,

    bg: "#fdcc1a",
    color: "#000000",
    fontFamily: "Stroudley-bold",

    icon: "./fonty/icon_small_zmena.svg",
    iconSizeMm: 33.5,
    gapMm: 5,
    leftPadMm: 5,

    // řádek 1
    line1BottomMm: 37,
    line1Parts: [
      { text: "náhradní zastávka od / ", sizePt: 65 },
      { text: "substitute stop from", sizePt: 28, fontFamily: "Stroudley-regular" },
    ],

    // řádek 2 (uživatelský text)
    needsText: true,
    line2BottomMm: 0,
    line2SizePt: 78,
  },

direction: {
  layout: "direction",
  heightMm: 33.5,

  bg: "#ffffff",
  color: "#000000",

  leftPadMm: 10,
  rightPadMm: 5,
  labelGapMm: 15,

  needsText: true,

  // vlevo
  titleText: "směr",
  titleFontFamily: "Stroudley-bold",
  titleSizePt: 40,

  subtitleText: "direction",
  subtitleFontFamily: "Stroudley-regular",
  subtitleSizePt: 23,

  // uživatelský text (1 řádek)
  textFontFamily: "Stroudley-bold",
  textSizePt: 70,

  // volitelná ikona vpravo
  iconGroupGapMm: 3,    // mezera mezi textem a blokem ikon
  iconBetweenGapMm: 3,  // mezera mezi ikonami (zkus 0, kdyžtak doladíme)
  iconCellSizeMm: 33.5,
  iconPadMm: 5,
  iconSizeMm: 23.5,
  iconOptions: [
    { value: "./fonty/icon_small_metro_a.svg", label: "Metro A" },
    { value: "./fonty/icon_small_metro_b.svg", label: "Metro B" },
    { value: "./fonty/icon_small_metro_c.svg", label: "Metro C" },
    { value: "./fonty/icon_small_linky_s.svg", label: "Linky S" },
    { value: "./fonty/icon_small_letiste.svg", label: "Letiště" },
  ],
},

};

  