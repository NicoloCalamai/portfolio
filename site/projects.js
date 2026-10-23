// Contenuti del portfolio. Testi presi dal PDF; **testo** = grassetto.
// `pages` sono i numeri di pagina del PDF esportati in assets/pages (vedi tools/build_assets.py).
// `heading` (elementi delle collezioni) è il titolo a segmenti colorati [testo, colore], come nel PDF.
// `zone` collega un progetto (o un elemento di una collezione) a un oggetto cliccabile della stanza:
// i poligoni sono in coordinate dell'immagine assets/room.webp (3442 x 1828).

window.ROOM = { width: 3442, height: 1828 };

window.PROJECTS = [
  {
    id: "pensilina",
    num: "01",
    category: "product",
    title: ["Progetto", "Pensilina"],
    hero: "assets/hero/pensilina.webp",
    thumb: "assets/thumbs/01.webp",
    description: [
      "In occasione della progettazione della nuova **rete tranviaria di Brescia** (linee T2 e T3), sono state sviluppate delle proposte per la realizzazione delle nuove pensiline tenendo conto di diversi aspetti chiave:",
      "- Una struttura **modulare**\n- **Accessibilità** e inclusione\n- **Coerenza visiva** con la mobilità locale esistente",
      "Il progetto si sviluppa in due versioni principali:",
      "- Versione a **massima grandezza**;\n- Versione in formato **palina**.",
    ],
    info: ["Lavoro in coppia", ["Corso", "Product Design"], ["Durata progetto", "3 mesi"], ["Periodo", "3° anno accademico 2024-2025"], ["Docente del corso", "Paolo Gasparini"]],
    software: ["Sketchbook", "Autocad", "Alias AutoStudio", "Keyshot", "Photoshop", "Illustrator", "Indesign"],
    pages: [6, 7, 8, 9, 10, 11, 12, 13],
    zone: {
      label: "Modello in scala 1:20",
      points: [[2875, 1085], [3025, 1085], [3025, 1190], [2875, 1190]],
    },
  },
  {
    id: "sgabello",
    num: "02",
    category: "product",
    title: ["Sgabello"],
    hero: "assets/hero/sgabello.webp",
    thumb: "assets/thumbs/02.webp",
    description: [
      "Progettazione di uno sgabello per dare **seconda vita a pezzi di auto dismessi**. In particolare si è scelto di utilizzare una **molla proveniente da un Land Rover Defender** come elemento strutturale principale. A completare, per renderlo utilizzabile, sono stati utilizzati quattro dischi in legno multistrato ricavati da una vecchia mensola: due più grandi (Ø 350 mm) e due più piccoli (Ø 220 mm, Ø 175 mm), inseriti con la funzione di rinforzo, per aumentare la stabilità complessiva.",
      "Il progetto gioca volutamente con la **forma circolare**, che accomuna tutti gli elementi. La molla è ancorata nella parte superiore tramite 3 collari in alluminio per tubi, mentre alla base tramite la piastra metallica originale già saldata alla molla, completa di fori per l’ancoraggio.",
    ],
    info: ["Lavoro singolo", ["Corso", "Ecodesign"], ["Durata progetto", "1 mese"], ["Periodo", "3° anno accademico 2024-2025"], ["Docente del corso", "Pietro Giorgio Zendrini"]],
    software: ["Sketchbook", "Autocad", "Indesign"],
    pages: [15, 16],
    zone: {
      label: "Sgabello",
      points: [[720, 1045], [840, 1028], [955, 1042], [945, 1060], [885, 1075], [890, 1280], [950, 1300], [945, 1330], [840, 1345], [730, 1325], [730, 1300], [800, 1280], [800, 1075], [730, 1060]],
    },
  },
  {
    id: "more",
    num: "03",
    category: "product",
    theme: "dark",
    title: ["M.O.R.E. 2.0"],
    hero: "assets/hero/more.webp",
    thumb: "assets/thumbs/03.webp",
    description: [
      "La strada non è solo un percorso, ma uno **spazio da vivere con consapevolezza, protezione e stile.**",
      "**M.O.R.E. 2.0** nasce per ridefinire l’equipaggiamento di chi sceglie le due ruote come **stile di vita quotidiano**, fondendo la protezione con un **linguaggio formale del design automotive**. Il progetto è composto da una doppia struttura attraverso un **sistema modulare**, integrando un **sistema intelligente** che dialoga direttamente con la moto.",
      "Questo progetto è un **percorso di ricerca e sviluppo** che è stato concretizzato tramite la realizzazione di un **modello fisico in scala 1:1 semifunzionante**.",
    ],
    info: ["Lavoro di tesi", ["Durata progetto", "Circa 5 mesi"], ["Periodo", "2025 - 2026"], ["Relatore di tesi", "Paolo Gasparini"], "Realizzazione di un prototipo in scala **1:1 funzionante**"],
    software: ["Sketchbook", "Alias AutoStudio", "Autocad", "Keyshot", "Photoshop", "Illustrator", "Indesign"],
    pages: [18],
    nda: {
      title: "Progetto protetto da accordo di riservatezza (NDA)",
      text: [
        "Questo progetto, sviluppato in collaborazione con un’azienda, è attualmente in **fase di sviluppo per una futura produzione** ed è soggetto a vincoli di riservatezza industriale.",
        "Per tutelare la proprietà intellettuale coinvolta, i dettagli tecnici, la documentazione e il prototipo funzionante in scala 1:1 **saranno visionabili**, previa **firma di un accordo di riservatezza** (NDA):",
        "- In sede di **colloquio conoscitivo**\n- Su **richiesta via email**",
      ],
    },
    zone: {
      label: "Confidential project",
      points: [[2364, 1100], [2470, 1032], [2620, 1060], [2700, 1068], [2826, 1120], [2812, 1376], [2640, 1378], [2372, 1318]],
    },
  },
  {
    id: "fanzine",
    num: "04",
    category: "graphic",
    title: ["Fanzine DSA"],
    hero: "assets/hero/fanzine.webp",
    thumb: "assets/thumbs/04.webp",
    description: [
      "Capire i DSA non significa leggerne la definizione, ma **provarli sulla propria pelle**. Questa fanzine nasce per **ribaltare i punti di vista** e **far immergere chiunque** nella realtà di chi ci convive ogni giorno.",
      "Attraverso **4 capitoli** dedicati il progetto **racconta queste difficoltà** con **ironia** e le trasforma **graficamente in pratica** grazie anche a dei **minigiochi dedicati**.",
      "- **Dislessia:** parole che spariscono\n- **Disortografia:** lettere scambiate\n- **Disgrafia:** righe che si sgretolano e sfuggono al controllo\n- **Discalculia:** gioca con i numeri",
      "Un viaggio ironico e immersivo per scoprire che, a volte, per capire davvero basta semplicemente **cambiare prospettiva.**",
    ],
    info: ["Lavoro di coppia", ["Durata progetto", "Circa 1 mese"], ["Periodo", "2023 - 2024"], ["Docente del corso", "Massimo Devicienti"]],
    software: ["Sketchbook", "Illustrator", "Indesign"],
    pages: [22, 23, 24, 25],
    zone: {
      label: "Parole incrociate",
      points: [[2972, 1354], [3046, 1368], [3002, 1440], [2924, 1414]],
    },
  },
  {
    id: "bolidi-tees",
    num: "05",
    category: "graphic",
    title: ["Bolidi", "Graphic Tees"],
    thumb: "assets/thumbs/05.webp",
    description: [
      "Una **capsule collection** di t-shirt sviluppata in collaborazione con **Bolidi Collectors Cars** e arricchita, in uno dei design, dalla collaborazione ispirazionale di **Bambi Reimagined**. Il progetto dà vita a **3 grafiche** differenti fra di loro che interpretano il **tema automotive** con una chiave di lettura differente e originale.",
    ],
    info: ["Lavoro in singolo", ["Durata progetto", "Circa 7 giorni l’uno"], ["Periodo", "2025 - 2026"], "Utilizzo di macchina fotografica ed editing foto"],
    software: ["Sketchbook", "Illustrator", "Photoshop", "Lightroom Classic"],
    items: [
      {
        id: "panda-materia",
        title: "Panda Materia 04 Br",
        heading: [["Panda Materia 04 Br", "#2a8fc6"]],
        pages: [27, 28],
        zone: { points: [[455, 695], [410, 740], [420, 760], [425, 1100], [540, 1090], [535, 920], [570, 900], [505, 735]] },
      },
      {
        id: "delta-tamiya",
        title: "Lancia Delta Tamiya - Bolidi edition",
        heading: [["Lancia Delta Tamiya", "#1d3f8f"], [" - Bolidi edition", "#d62230"]],
        pages: [29, 30],
        zone: { points: [[205, 695], [170, 750], [110, 790], [80, 935], [130, 955], [135, 1185], [305, 1155], [295, 780], [275, 745]] },
      },
      {
        id: "panda-4x4",
        title: "Fiat Panda 4x4 Assembly Instruction",
        heading: [["Fiat Panda 4x4 Assembly Instruction", "#111111"]],
        pages: [31, 32],
        zone: { points: [[340, 695], [300, 740], [295, 780], [305, 1152], [425, 1130], [420, 760], [380, 740]] },
      },
    ],
  },
  {
    id: "automotive-artworks",
    num: "06",
    category: "graphic",
    title: ["Automotive", "Artworks"],
    thumb: "assets/thumbs/06.webp",
    description: [
      "Questa sezione raccoglie **poster** dedicati al **mondo dei motori**, sviluppati attraverso **due differenti tecniche**. I **primi tre**, definiti **“Vectorial Artworks”**, sono realizzati interamente in **digitale** con la tecnica di grafica vettoriale. **L’ultimo progetto**, denominato **“3D Artwork”**, sperimenta invece una tecnica **ibrida** che unisce la **base vettoriale** a componenti stampati in **3D**, successivamente verniciati e assemblati.",
    ],
    info: ["Lavoro in singolo", ["Durata progetto", "Circa 5-7 giorni l’uno"], ["Periodo", "2024 - 2026"], "Utilizzo stampa 3D", "Utilizzo di macchina fotografica ed editing foto"],
    software: ["Sketchbook", "Illustrator", "Fusion", "Lightroom Classic"],
    items: [
      {
        id: "porsche-911",
        kicker: "Vectorial Artwork",
        title: "Porsche 911 Singer",
        heading: [["Porsche 911 Singer", "#373737"]],
        pages: [34, 35],
        zone: { points: [[2196, 320], [2448, 320], [2448, 668], [2196, 668]] },
      },
      {
        id: "viper-befuel",
        kicker: "Vectorial Artwork",
        title: "Dodge Viper “Enigma” - BEFUEL",
        heading: [["Dodge Viper ", "#461f4c"], ["“Enigma”", "#026e4c"], [" - BEFUEL", "#ffffff"]],
        pages: [36, 37],
        zone: { points: [[918, 310], [1172, 310], [1172, 658], [918, 658]] },
      },
      {
        id: "fiat-131-abarth",
        kicker: "Vectorial Artwork",
        title: "Fiat 131 Abarth",
        heading: [["Fiat ", "#2c5ca8"], ["131", "#fdc017"], [" Abarth", "#2c5ca8"]],
        pages: [38, 39],
        zone: { points: [[1514, 334], [1860, 334], [1860, 592], [1514, 592]] },
      },
      {
        id: "tuttobene",
        kicker: "3D Artwork",
        title: "Tuttobene Hillclimb 2026",
        heading: [["Tuttobene Hillclimb 2026 - ", "#2559a4"], ["Clm.design", "#ffffff"]],
        pages: [40, 41],
        zone: { points: [[3170, 874], [3346, 900], [3264, 1290], [3100, 1210]] },
      },
    ],
  },
];

window.ABOUT = {
  photo: "assets/hero/about.webp",
  email: "nicolocalamai@gmail.com",
  // Contatti mostrati nella tendina "Contatti" e nella pagina About. Le voci senza valore non vengono mostrate.
  contacts: [
    { type: "email", label: "Email", value: "nicolocalamai@gmail.com" },
    { type: "phone", label: "Telefono", value: "+39 371 133 8555" },
    { type: "instagram", label: "Instagram", value: "@clm.design" },
  ],
  bio: [
    "Sono un ragazzo appassionato di **Product & Graphic Design**, guidato da una **grande curiosità** e una **profonda dedizione** per la cura del **dettaglio**. Prendo a cuore ogni progetto, affrontando le sfide con **problem solving** e **flessibilità** che mi permettono di esplorare sempre mondi e tecniche nuove.",
    "Ciò che mi contraddistingue è **l’approccio manuale** e la **passione per la prototipazione**.",
    "Credo che **in un’epoca** prevalentemente **digitale**, **la capacità di dare forma fisica alle idee** dal modello di studio al prodotto finito sia il vero **valore aggiunto del design**.",
  ],
  education: [
    "**Diploma scuola secondaria di secondo grado** presso Liceo **Artistico A. Frattini** con indirizzo design, Varese 2017-2021",
    "**Laurea triennale in Design** presso **LABA**, Brescia 2021-2025",
  ],
  software: ["Alias AutoStudio", "Autodesk Fusion", "Autocad", "SketchUp", "Sketchbook", "Keyshot", "Photoshop", "Illustrator", "Indesign", "Lightroom Classic", "Figma"],
  softSkills: ["Pensiero critico e problem solving", "Creatività", "Curiosità", "Prototipazione e capacità manuali", "Dedizione e cura del dettaglio", "Empatia", "Lavoro in team", "Flessibilità e adattabilità"],
};
