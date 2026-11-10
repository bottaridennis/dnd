
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
  { id: 'orc', name: 'Orco', size: 'Media', speed: 9, darkvision: 36, traits: ['Scatto di Adrenalina', 'Scurovisione', 'Corporatura Possente', 'Resistenza Implacabile'] },
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
    id: 'artisan', name: 'Artigiano', boosts: ['STR', 'DEX', 'INT'], feat: 'Artigiano', skills: ['Indagare', 'Persuasione'], tools: ['Strumenti da Artigiano (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Artigiano', 'Abiti Comuni', 'Borsa'], gold: 25 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'charlatan', name: 'Ciarlatano', boosts: ['DEX', 'CON', 'CHA'], feat: 'Abile', skills: ['Inganno', 'Rapidità di Mano'], tools: ['Kit per Contraffazione'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Kit per Contraffazione', 'Abiti Belli', 'Borsa'], gold: 15 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'criminal', name: 'Criminale', boosts: ['DEX', 'CON', 'INT'], feat: 'Allerta', skills: ['Rapidità di Mano', 'Furtività'], tools: ['Attrezzi da Ladro'],
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
    id: 'farmer', name: 'Contadino', boosts: ['STR', 'CON', 'WIS'], feat: 'Duro', skills: ['Addestrare Animali', 'Natura'], tools: ['Strumenti da Falegname'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Artigiano', 'Abiti Comuni', 'Borsa'], gold: 23 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'guard', name: 'Guardia', boosts: ['STR', 'INT', 'WIS'], feat: 'Allerta', skills: ['Atletica', 'Percezione'], tools: ['Set da Gioco (uno)'],
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
    id: 'noble', name: 'Nobile', boosts: ['STR', 'INT', 'CHA'], feat: 'Abile', skills: ['Storia', 'Persuasione'], tools: ['Set da Gioco (uno)'],
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
    id: 'sailor', name: 'Marinaio', boosts: ['STR', 'DEX', 'WIS'], feat: 'Attaccabrighe da Taverna', skills: ['Acrobazia', 'Percezione'], tools: ['Strumenti da Navigatore'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Strumenti da Navigatore', 'Daga', 'Abiti Comuni'], gold: 10 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'scribe', name: 'Scriba', boosts: ['DEX', 'INT', 'WIS'], feat: 'Abile', skills: ['Indagare', 'Percezione'], tools: ['Scorte da Calligrafo'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Scorte da Calligrafo', 'Calamaio', 'Pennino', 'Abiti Comuni'], gold: 20 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'soldier', name: 'Soldato', boosts: ['STR', 'DEX', 'CON'], feat: 'Attaccante Selvaggio', skills: ['Atletica', 'Intimidire'], tools: ['Set da Gioco (uno)'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Set da Gioco', 'Lancia', 'Balestra Leggera', 'Dardi (20)', 'Abiti Comuni'], gold: 14 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  { 
    id: 'wayfarer', name: 'Viandante', boosts: ['DEX', 'WIS', 'CHA'], feat: 'Fortunato', skills: ['Intuizione', 'Furtività'], tools: ['Attrezzi da Ladro'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Attrezzi da Ladro', 'Pugnale (2)', 'Abiti Comuni'], gold: 16 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  }
];

export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface ClassDefinition {
  id: string;
  name: string;
  hitDie: number;
  saves: AbilityKey[];
  skillChoices: number;
  skillOptions: string[];
  armor: string[];
  weapons: string[];
  /** Numero di armi con Maestria per livello di classe (indice = livello) */
  masteryByLevel?: number[];
  masteryCount: number;
  /** Requisiti per il multiclasse (PHB 2024): tutte le caratteristiche indicate devono essere 13+, salvo `multiclassAny` */
  multiclassReq: AbilityKey[];
  multiclassAny?: boolean;
  spellcastingAbility?: AbilityKey;
  startingEquipment: { options: { id: string; name: string; items?: string[]; gold: number }[] };
}


export const classesData: ClassDefinition[] = [
  {
    id: 'barbarian', name: 'Barbaro', hitDie: 12, saves: ['STR', 'CON'], skillChoices: 2,
    skillOptions: ['Addestrare Animali', 'Atletica', 'Intimidire', 'Natura', 'Percezione', 'Sopravvivenza'],
    armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2,
    masteryByLevel: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    multiclassReq: ['STR'],
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
    multiclassReq: ['CHA'], spellcastingAbility: 'CHA',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio', 'Pugnale (2)', 'Strumento Musicale', 'Dotazione da Intrattenitore'], gold: 19 },
        { id: 'B', name: 'Oro', gold: 90 }
      ]
    }
  },
  {
    id: 'cleric', name: 'Chierico', hitDie: 8, saves: ['WIS', 'CHA'], skillChoices: 2,
    skillOptions: ['Storia', 'Intuizione', 'Medicina', 'Persuasione', 'Religione'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici'], masteryCount: 0,
    multiclassReq: ['WIS'], spellcastingAbility: 'WIS',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Giaco di Maglia', 'Scudo', 'Mazza', 'Simbolo Sacro', 'Dotazione da Sacerdote'], gold: 7 },
        { id: 'B', name: 'Oro', gold: 110 }
      ]
    }
  },
  {
    id: 'druid', name: 'Druido', hitDie: 8, saves: ['INT', 'WIS'], skillChoices: 2,
    skillOptions: ['Arcano', 'Addestrare Animali', 'Intuizione', 'Medicina', 'Natura', 'Percezione', 'Religione', 'Sopravvivenza'], armor: ['Leggera', 'Scudi'], weapons: ['Semplici'], masteryCount: 0,
    multiclassReq: ['WIS'], spellcastingAbility: 'WIS',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio', 'Scudo', 'Falcetto', 'Bastone Ferrato', 'Kit da Erborista', 'Dotazione da Esploratore'], gold: 9 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  {
    id: 'fighter', name: 'Guerriero', hitDie: 10, saves: ['STR', 'CON'], skillChoices: 2,
    skillOptions: ['Acrobazia', 'Addestrare Animali', 'Atletica', 'Storia', 'Intuizione', 'Intimidire', 'Persuasione', 'Percezione', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Pesante', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 3,
    masteryByLevel: [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6],
    multiclassReq: ['STR', 'DEX'], multiclassAny: true,
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti (Mischia)', items: ['Cotta di Maglia', 'Spadone', 'Flagello', 'Giavellotto (8)', 'Dotazione da Esploratore di Dungeon'], gold: 4 },
        { id: 'B', name: 'Pacchetto Oggetti (Distanza)', items: ['Armatura di Cuoio Borchiato', 'Scimitarra', 'Spada Corta', 'Arco Lungo', 'Frecce (20)', 'Faretra', 'Dotazione da Esploratore di Dungeon'], gold: 11 },
        { id: 'C', name: 'Oro', gold: 155 }
      ]
    }
  },
  {
    id: 'monk', name: 'Monaco', hitDie: 8, saves: ['STR', 'DEX'], skillChoices: 2,
    skillOptions: ['Acrobazia', 'Atletica', 'Storia', 'Intuizione', 'Religione', 'Furtività'], armor: [], weapons: ['Semplici', 'Marziali (leggere)'], masteryCount: 0,
    multiclassReq: ['DEX', 'WIS'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Lancia', 'Pugnale (5)', 'Strumenti da Artigiano', 'Dotazione da Esploratore'], gold: 11 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  {
    id: 'paladin', name: 'Paladino', hitDie: 10, saves: ['WIS', 'CHA'], skillChoices: 2,
    skillOptions: ['Atletica', 'Intuizione', 'Intimidire', 'Medicina', 'Persuasione', 'Religione'], armor: ['Leggera', 'Media', 'Pesante', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2,
    multiclassReq: ['STR', 'CHA'], spellcastingAbility: 'CHA',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Cotta di Maglia', 'Scudo', 'Spada Lunga', 'Giavellotto (6)', 'Simbolo Sacro', 'Dotazione da Sacerdote'], gold: 9 },
        { id: 'B', name: 'Oro', gold: 150 }
      ]
    }
  },
  {
    id: 'ranger', name: 'Ranger', hitDie: 10, saves: ['STR', 'DEX'], skillChoices: 3,
    skillOptions: ['Addestrare Animali', 'Atletica', 'Intuizione', 'Indagare', 'Natura', 'Percezione', 'Furtività', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2,
    multiclassReq: ['DEX', 'WIS'], spellcastingAbility: 'WIS',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio Borchiato', 'Scimitarra', 'Spada Corta', 'Arco Lungo', 'Frecce (20)', 'Faretra', 'Focus Druidico', 'Dotazione da Esploratore'], gold: 7 },
        { id: 'B', name: 'Oro', gold: 150 }
      ]
    }
  },
  {
    id: 'rogue', name: 'Ladro', hitDie: 8, saves: ['DEX', 'INT'], skillChoices: 4,
    skillOptions: ['Acrobazia', 'Atletica', 'Inganno', 'Intuizione', 'Intimidire', 'Indagare', 'Percezione', 'Persuasione', 'Rapidità di Mano', 'Furtività'], armor: ['Leggera'], weapons: ['Semplici', 'Marziali (accurate o leggere)'], masteryCount: 2,
    multiclassReq: ['DEX'],
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio', 'Pugnale (2)', 'Spada Corta', 'Arco Corto', 'Frecce (20)', 'Faretra', 'Attrezzi da Ladro', 'Dotazione da Scassinatore'], gold: 8 },
        { id: 'B', name: 'Oro', gold: 100 }
      ]
    }
  },
  {
    id: 'sorcerer', name: 'Stregone', hitDie: 6, saves: ['CON', 'CHA'], skillChoices: 2,
    skillOptions: ['Arcano', 'Inganno', 'Intuizione', 'Intimidire', 'Persuasione', 'Religione'], armor: [], weapons: ['Semplici'], masteryCount: 0,
    multiclassReq: ['CHA'], spellcastingAbility: 'CHA',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Lancia', 'Pugnale (2)', 'Focus Arcano', 'Dotazione da Esploratore di Dungeon'], gold: 28 },
        { id: 'B', name: 'Oro', gold: 50 }
      ]
    }
  },
  {
    id: 'warlock', name: 'Warlock', hitDie: 8, saves: ['WIS', 'CHA'], skillChoices: 2,
    skillOptions: ['Arcano', 'Inganno', 'Storia', 'Intimidire', 'Indagare', 'Natura', 'Religione'], armor: ['Leggera'], weapons: ['Semplici'], masteryCount: 0,
    multiclassReq: ['CHA'], spellcastingAbility: 'CHA',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Armatura di Cuoio', 'Falcetto', 'Pugnale (2)', 'Focus Arcano', 'Libro (Conoscenze Occulte)', 'Dotazione da Studioso'], gold: 15 },
        { id: 'B', name: 'Oro', gold: 100 }
      ]
    }
  },
  {
    id: 'wizard', name: 'Mago', hitDie: 6, saves: ['INT', 'WIS'], skillChoices: 2,
    skillOptions: ['Arcano', 'Storia', 'Intuizione', 'Indagare', 'Medicina', 'Natura', 'Religione'], armor: [], weapons: ['Semplici'], masteryCount: 0,
    multiclassReq: ['INT'], spellcastingAbility: 'INT',
    startingEquipment: {
      options: [
        { id: 'A', name: 'Pacchetto Oggetti', items: ['Pugnale (2)', 'Bastone Ferrato', 'Veste', 'Libro degli Incantesimi', 'Dotazione da Studioso'], gold: 5 },
        { id: 'B', name: 'Oro', gold: 55 }
      ]
    }
  }
];

/** Talenti d'Origine (PHB 2024) — usati da Background e dal tratto Versatile dell'Umano */
export const ORIGIN_FEATS = ['Abile', 'Allerta', 'Artigiano', 'Attaccabrighe da Taverna', 'Attaccante Selvaggio', 'Duro', 'Fortunato', 'Guaritore', 'Iniziato alla Magia', 'Musicista'];
