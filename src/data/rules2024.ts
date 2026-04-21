
export const ALL_SKILLS = [
  'Acrobazia', 'Addestrare Animali', 'Arcano', 'Atletica', 'Furtività',
  'Indagare', 'Inganno', 'Intimidire', 'Intrattenimento', 'Intuizione',
  'Medicina', 'Natura', 'Percezione', 'Persuasione', 'Rapidità di Mano',
  'Religione', 'Sopravvivenza', 'Storia'
];

export const speciesData = [
  { 
    id: 'aasimar', 
    name: 'Aasimar', 
    size: 'Media o Piccola', 
    speed: 9, 
    darkvision: 18,
    traits: ['Resistenza Celestiale', 'Scurovisione', 'Mani Guaritrici', 'Rivelazione Celestiale (Livello 3)'],
    resistances: ['Necrotico', 'Radioso'],
    grantedSpells: ['Light']
  },
  { 
    id: 'dragonborn', 
    name: 'Dragonide', 
    size: 'Media', 
    speed: 9, 
    darkvision: 18,
    traits: ['Antenato Draconico', 'Arma a Soffio', 'Resistenza ai Danni', 'Scurovisione', 'Volo Draconico (Livello 5)'],
    subOptions: [
      { id: 'black', name: 'Nero', damageType: 'Acido', resistance: 'Acido' },
      { id: 'blue', name: 'Blu', damageType: 'Fulmine', resistance: 'Fulmine' },
      { id: 'brass', name: 'Ottone', damageType: 'Fuoco', resistance: 'Fuoco' },
      { id: 'bronze', name: 'Bronzo', damageType: 'Fulmine', resistance: 'Fulmine' },
      { id: 'copper', name: 'Rame', damageType: 'Acido', resistance: 'Acido' },
      { id: 'gold', name: 'Oro', damageType: 'Fuoco', resistance: 'Fuoco' },
      { id: 'green', name: 'Verde', damageType: 'Veleno', resistance: 'Veleno' },
      { id: 'red', name: 'Rosso', damageType: 'Fuoco', resistance: 'Fuoco' },
      { id: 'silver', name: 'Argento', damageType: 'Freddo', resistance: 'Freddo' },
      { id: 'white', name: 'Bianco', damageType: 'Freddo', resistance: 'Freddo' }
    ]
  },
  { 
    id: 'dwarf', 
    name: 'Nano', 
    size: 'Media', 
    speed: 9, 
    darkvision: 36,
    traits: ['Scurovisione', 'Resistenza Nanica', 'Robustezza Nanica', 'Esperto di Pietre'],
    resistances: ['Veleno']
  },
  { 
    id: 'elf', 
    name: 'Elfo', 
    size: 'Media', 
    speed: 9, 
    darkvision: 18,
    traits: ['Scurovisione', 'Ascendenza Fatata', 'Sensi Acuti', 'Trance', 'Lignaggio Elfico'], 
    skillChoices: 1, 
    skillOptions: ['Intuizione', 'Percezione', 'Sopravvivenza'],
    subOptions: [
      { id: 'drow', name: 'Drow', spells: ['Dancing Lights'], traits: ['Scurovisione Superiore (36m)'], darkvision: 36 },
      { id: 'high-elf', name: 'Elfo Alto', spells: ['Prestidigitation'] },
      { id: 'wood-elf', name: 'Elfo dei Boschi', spells: ['Druidcraft'], speed: 10.5 }
    ]
  },
  { 
    id: 'gnome', 
    name: 'Gnomo', 
    size: 'Piccola', 
    speed: 9, 
    darkvision: 18,
    traits: ['Scurovisione', 'Astuzia Gnomesca', 'Lignaggio Gnomesco'],
    subOptions: [
      { id: 'forest-gnome', name: 'Gnomo delle Foreste', spells: ['Minor Illusion', 'Speak with Animals'] },
      { id: 'rock-gnome', name: 'Gnomo delle Rocce', spells: ['Mending', 'Prestidigitation'] }
    ]
  },
  { 
    id: 'goliath', 
    name: 'Goliath', 
    size: 'Media', 
    speed: 10.5, 
    traits: ['Antenato Gigante', 'Forma Grande (Livello 5)', 'Corporatura Possente'],
    subOptions: [
      { id: 'cloud', name: 'Nuvole', feature: 'Cloud\'s Jaunt' },
      { id: 'fire', name: 'Fuoco', feature: 'Fire\'s Burn' },
      { id: 'frost', name: 'Ghiaccio', feature: 'Frost\'s Chill' },
      { id: 'hill', name: 'Colline', feature: 'Hill\'s Tumble' },
      { id: 'stone', name: 'Pietra', feature: 'Stone\'s Endurance' },
      { id: 'storm', name: 'Tempesta', feature: 'Storm\'s Thunder' }
    ]
  },
  { id: 'halfling', name: 'Halfling', size: 'Piccola', speed: 9, traits: ['Coraggioso', 'Agilità Halfling', 'Fortunato', 'Furtività Naturale'] },
  { id: 'human', name: 'Umano', size: 'Media', speed: 9, traits: ['Ingegnoso', 'Versatilità nelle Abilità', 'Versatile'], skillChoices: 1, skillOptions: ALL_SKILLS },
  { id: 'orc', name: 'Orco', size: 'Media', speed: 9, darkvision: 18, traits: ['Scatto di Adrenalina', 'Scurovisione', 'Corporatura Possente', 'Resistenza Implacabile'] },
  { 
    id: 'tiefling', 
    name: 'Tiefling', 
    size: 'Media', 
    speed: 9, 
    darkvision: 18,
    traits: ['Scurovisione', 'Sguardo Oltremondano', 'Resistenza Infernale', 'Lignaggio Oltremondano'],
    subOptions: [
      { id: 'abyssal', name: 'Abissale', resistance: 'Veleno', spells: ['Poison Spray'] },
      { id: 'chthonic', name: 'Ctonio', resistance: 'Necrotico', spells: ['Chill Touch'] },
      { id: 'infernal', name: 'Infernale', resistance: 'Fuoco', spells: ['Fire Bolt'] }
    ]
  }
];

export const backgroundsData = [
  { 
    id: 'acolyte', name: 'Accolito', boosts: ['INT', 'WIS', 'CHA'], feat: 'Iniziato alla Magia (Chierico)', skills: ['Intuizione', 'Religione'], tools: ['Scorte da Calligrafo'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Scorte da Calligrafo', 'Simbolo Sacro', 'Libro (Preghiere)', 'Mappa', 'Veste', 'Candela (5)'], gold: 8 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'artisan', name: 'Artigiano', boosts: ['STR', 'CON', 'INT'], feat: 'Esecutore', skills: ['Indagare', 'Persuasione'], tools: ['Strumenti da Artigiano (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Artigiano', 'Abiti Comuni', 'Borsa'], gold: 25 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'charlatan', name: 'Ciarlatano', boosts: ['DEX', 'CON', 'CHA'], feat: 'Esperto', skills: ['Inganno', 'Rapidità di Mano'], tools: ['Kit per Contraffazione'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Kit per Contraffazione', 'Abiti Belli', 'Borsa'], gold: 15 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'criminal', name: 'Criminale', boosts: ['DEX', 'CON', 'CHA'], feat: 'Allerta', skills: ['Inganno', 'Furtività'], tools: ['Attrezzi da Ladro'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Attrezzi da Ladro', 'Pugnale (2)', 'Abiti Comuni', 'Piede di Porco'], gold: 16 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'entertainer', name: 'Intrattenitore', boosts: ['STR', 'DEX', 'CHA'], feat: 'Musicista', skills: ['Acrobazia', 'Intrattenimento'], tools: ['Strumento Musicale (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumento Musicale', 'Abiti Belli', 'Borsa'], gold: 11 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'farmer', name: 'Contadino', boosts: ['STR', 'CON', 'WIS'], feat: 'Robusto', skills: ['Addestrare Animali', 'Natura'], tools: ['Strumenti da Artigiano (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Artigiano', 'Abiti Comuni', 'Borsa'], gold: 23 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'guard', name: 'Guardia', boosts: ['STR', 'DEX', 'WIS'], feat: 'Allerta', skills: ['Atletica', 'Percezione'], tools: ['Set da Gioco (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Lancia', 'Balestra Leggera', 'Dardi (20)', 'Abiti Comuni'], gold: 12 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'guide', name: 'Guida', boosts: ['DEX', 'CON', 'WIS'], feat: 'Iniziato alla Magia (Druido)', skills: ['Furtività', 'Sopravvivenza'], tools: ['Strumenti da Cartografo'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Cartografo', 'Bastone Ferrato', 'Abiti Comuni'], gold: 13 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'hermit', name: 'Eremita', boosts: ['CON', 'WIS', 'CHA'], feat: 'Guaritore', skills: ['Medicina', 'Religione'], tools: ['Kit di Erboristeria'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Kit di Erboristeria', 'Bastone Ferrato', 'Abiti Comuni'], gold: 15 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'merchant', name: 'Mercante', boosts: ['CON', 'INT', 'CHA'], feat: 'Fortunato', skills: ['Addestrare Animali', 'Persuasione'], tools: ['Strumenti da Navigatore'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Navigatore', 'Abiti Comuni', 'Borsa'], gold: 22 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'noble', name: 'Nobile', boosts: ['STR', 'INT', 'CHA'], feat: 'Esperto', skills: ['Storia', 'Persuasione'], tools: ['Set da Gioco (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Set da Gioco', 'Abiti Belli', 'Anello con Sigillo'], gold: 20 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'sage', name: 'Sapiente', boosts: ['CON', 'INT', 'WIS'], feat: 'Iniziato alla Magia (Mago)', skills: ['Arcano', 'Storia'], tools: ['Scorte da Calligrafo'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Scorte da Calligrafo', 'Libro', 'Pergamena (8)', 'Calamaio', 'Pennino', 'Veste'], gold: 8 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'sailor', name: 'Marinaio', boosts: ['STR', 'DEX', 'WIS'], feat: 'Rissoso da Taverna', skills: ['Acrobazia', 'Percezione'], tools: ['Strumenti da Navigatore'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Navigatore', 'Daga', 'Abiti Comuni'], gold: 10 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'scribe', name: 'Scriba', boosts: ['DEX', 'INT', 'WIS'], feat: 'Esperto', skills: ['Indagare', 'Percezione'], tools: ['Scorte da Calligrafo'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Scorte da Calligrafo', 'Calamaio', 'Pennino', 'Abiti Comuni'], gold: 20 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'soldier', name: 'Soldato', boosts: ['STR', 'DEX', 'CON'], feat: 'Attaccante Ferale', skills: ['Atletica', 'Intimidire'], tools: ['Set da Gioco (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Set da Gioco', 'Lancia', 'Balestra Leggera', 'Dardi (20)', 'Abiti Comuni'], gold: 14 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'wayfarer', name: 'Viandante', boosts: ['DEX', 'CON', 'WIS'], feat: 'Fortunato', skills: ['Intuizione', 'Furtività'], tools: ['Attrezzi da Ladro'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Attrezzi da Ladro', 'Pugnale (2)', 'Abiti Comuni'], gold: 16 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  }
];

export const classesData = [
  { 
    id: 'barbarian', name: 'Barbaro', hitDie: 12, saves: ['STR', 'CON'], skillChoices: 2, 
    skillOptions: ['Addestrare Animali', 'Atletica', 'Intimidire', 'Natura', 'Percezione', 'Sopravvivenza'], 
    armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Ascia Bipenne', 'Accetta (4)', 'Dotazione da Esploratore'], gold: 15 },
        { id: 'B', name: 'Oro', gold: 75 }
      ]
    }
  },
  { 
    id: 'bard', name: 'Bardo', hitDie: 8, saves: ['DEX', 'CHA'], skillChoices: 3, skillOptions: ALL_SKILLS, 
    armor: ['Leggera'], weapons: ['Semplici'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Daga (2)', 'Strumento Musicale', 'Abiti Belli', 'Dotazione da Intrattenitore'], gold: 18 },
        { id: 'B', name: 'Oro', gold: 90 }
      ]
    }
  },
  { 
    id: 'cleric', name: 'Chierico', hitDie: 8, saves: ['WIS', 'CHA'], skillChoices: 2, 
    skillOptions: ['Storia', 'Intuizione', 'Medicina', 'Persuasione', 'Religione'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Corazza di Cuoio', 'Mazza', 'Scudo', 'Simbolo Sacro', 'Dotazione da Sacerdote'], gold: 7 },
        { id: 'B', name: 'Oro', gold: 110 }
      ]
    }
  },
  { 
    id: 'druid', name: 'Druido', hitDie: 8, saves: ['INT', 'WIS'], skillChoices: 2, 
    skillOptions: ['Arcano', 'Addestrare Animali', 'Intuizione', 'Medicina', 'Natura', 'Percezione', 'Religione', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Corazza di Cuoio', 'Falcetto', 'Scudo', 'Focus Druidico', 'Dotazione da Esploratore'], gold: 9 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'fighter', name: 'Guerriero', hitDie: 10, saves: ['STR', 'CON'], skillChoices: 2, 
    skillOptions: ['Acrobazia', 'Addestrare Animali', 'Atletica', 'Storia', 'Intuizione', 'Intimidire', 'Percezione', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Pesante', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 3,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti (Mischia)', items: ['Armatura di Cuoio', 'Scudo', 'Arma Marziale', 'Arma Marziale (2)', 'Accetta (2)', 'Dotazione da Esploratore'], gold: 7 },
        { id: 'B', name: 'Pacchetto Oggetti (Distanza)', items: ['Arco Lungo', 'Frecce (20)', 'Armatura di Cuoio', 'Scudo', 'Arma Marziale (2)', 'Dotazione da Esploratore'], gold: 7 },
        { id: 'C', name: 'Oro', gold: 155 }
      ]
    }
  },
  { 
    id: 'monk', name: 'Monaco', hitDie: 8, saves: ['STR', 'DEX'], skillChoices: 2, 
    skillOptions: ['Acrobazia', 'Atletica', 'Storia', 'Intuizione', 'Religione', 'Furtività'], armor: [], weapons: ['Semplici', 'Marziali (finesse/leggere)'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Daga (10)', 'Bastone Ferrato', 'Dotazione da Esploratore'], gold: 9 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'paladin', name: 'Paladino', hitDie: 10, saves: ['WIS', 'CHA'], skillChoices: 2, 
    skillOptions: ['Atletica', 'Intuizione', 'Intimidire', 'Medicina', 'Persuasione', 'Religione'], armor: ['Leggera', 'Media', 'Pesante', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Cotta di Maglia', 'Scudo', 'Arma Marziale', 'Arma Marziale (2)', 'Simbolo Sacro', 'Dotazione da Esploratore'], gold: 9 },
        { id: 'B', name: 'Oro', gold: 150 }
      ]
    }
  },
  { 
    id: 'ranger', name: 'Ranger', hitDie: 10, saves: ['STR', 'DEX'], skillChoices: 3, 
    skillOptions: ['Addestrare Animali', 'Atletica', 'Intuizione', 'Indagare', 'Natura', 'Percezione', 'Furtività', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio', 'Arco Lungo', 'Frecce (20)', 'Spada Corta (2)', 'Focolaio Druidico', 'Dotazione da Esploratore'], gold: 8 },
        { id: 'B', name: 'Oro', gold: 150 }
      ]
    }
  },
  { 
    id: 'rogue', name: 'Ladro', hitDie: 8, saves: ['DEX', 'INT'], skillChoices: 4, 
    skillOptions: ['Acrobazia', 'Atletica', 'Inganno', 'Intuizione', 'Intimidire', 'Indagare', 'Percezione', 'Intrattenimento', 'Persuasione', 'Rapidità di Mano', 'Furtività'], armor: ['Leggera'], weapons: ['Semplici', 'Marziali (finesse)'], masteryCount: 2,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio', 'Spada Corta (2)', 'Pugnale (2)', 'Attrezzi da Ladro', 'Dotazione da Scassinatore'], gold: 8 },
        { id: 'B', name: 'Oro', gold: 110 }
      ]
    }
  },
  { 
    id: 'sorcerer', name: 'Stregone', hitDie: 6, saves: ['CON', 'CHA'], skillChoices: 2, 
    skillOptions: ['Arcano', 'Inganno', 'Intuizione', 'Intimidire', 'Persuasione', 'Religione'], armor: [], weapons: ['Semplici'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Daga (2)', 'Focus Arcano', 'Dotazione da Esploratore'], gold: 20 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'warlock', name: 'Warlock', hitDie: 8, saves: ['WIS', 'CHA'], skillChoices: 2, 
    skillOptions: ['Arcano', 'Inganno', 'Storia', 'Intimidire', 'Indagare', 'Natura', 'Religione'], armor: ['Leggera'], weapons: ['Semplici'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Corazza di Cuoio', 'Daga (2)', 'Focus Arcano', 'Dotazione da Esploratore'], gold: 15 },
        { id: 'B', name: 'Oro', gold: 100 }
      ]
    }
  },
  { 
    id: 'wizard', name: 'Mago', hitDie: 6, saves: ['INT', 'WIS'], skillChoices: 2, 
    skillOptions: ['Arcano', 'Storia', 'Intuizione', 'Indagare', 'Medicina', 'Religione'], armor: [], weapons: ['Semplici'], masteryCount: 0,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Bastone Ferrato', 'Libro Incantesimi', 'Focus Arcano', 'Dotazione da Studioso'], gold: 6 },
        { id: 'B', name: 'Oro', gold: 55 }
      ]
    }
  }
];
