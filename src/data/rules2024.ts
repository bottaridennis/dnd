
export const ALL_SKILLS = [
  'Acrobazia', 'Addestrare Animali', 'Arcano', 'Atletica', 'Furtività',
  'Indagare', 'Inganno', 'Intimidire', 'Intrattenimento', 'Intuizione',
  'Medicina', 'Natura', 'Percezione', 'Persuasione', 'Rapidità di Mano',
  'Religione', 'Sopravvivenza', 'Storia'
];

export const speciesData = [
  { id: 'aasimar', name: 'Aasimar', size: 'Media o Piccola', speed: 9, traits: ['Resistenza Celestiale', 'Scurovisione', 'Mani Guaritrici', 'Rivelazione Celestiale (Livello 3)'] },
  { 
    id: 'dragonborn', 
    name: 'Dragonide', 
    size: 'Media', 
    speed: 9, 
    traits: ['Antenato Draconico', 'Arma a Soffio', 'Resistenza ai Danni', 'Scurovisione', 'Volo Draconico (Livello 5)'],
    subOptions: [
      { id: 'black', name: 'Nero', damageType: 'Acido' },
      { id: 'blue', name: 'Blu', damageType: 'Fulmine' },
      { id: 'brass', name: 'Ottone', damageType: 'Fuoco' },
      { id: 'bronze', name: 'Bronzo', damageType: 'Fulmine' },
      { id: 'copper', name: 'Rame', damageType: 'Acido' },
      { id: 'gold', name: 'Oro', damageType: 'Fuoco' },
      { id: 'green', name: 'Verde', damageType: 'Veleno' },
      { id: 'red', name: 'Rosso', damageType: 'Fuoco' },
      { id: 'silver', name: 'Argento', damageType: 'Freddo' },
      { id: 'white', name: 'Bianco', damageType: 'Freddo' }
    ]
  },
  { id: 'dwarf', name: 'Nano', size: 'Media', speed: 9, traits: ['Scurovisione', 'Resistenza Nanica', 'Robustezza Nanica', 'Esperto di Pietre'] },
  { 
    id: 'elf', 
    name: 'Elfo', 
    size: 'Media', 
    speed: 9, 
    traits: ['Scurovisione', 'Ascendenza Fatata', 'Sensi Acuti', 'Trance', 'Lignaggio Elfico'], 
    skillChoices: 1, 
    skillOptions: ['Intuizione', 'Percezione', 'Sopravvivenza'],
    subOptions: [
      { id: 'drow', name: 'Drow', spells: ['Luci Danzanti'], traits: ['Scurovisione Superiore (36m)'] },
      { id: 'high-elf', name: 'Elfo Alto', spells: ['Prestigiditazione'] },
      { id: 'wood-elf', name: 'Elfo dei Boschi', spells: ['Artigianato Druidico'], speedBonus: 1.5 }
    ]
  },
  { 
    id: 'gnome', 
    name: 'Gnomo', 
    size: 'Piccola', 
    speed: 9, 
    traits: ['Scurovisione', 'Astuzia Gnomesca', 'Lignaggio Gnomesco'],
    subOptions: [
      { id: 'forest-gnome', name: 'Gnomo delle Foreste', spells: ['Illusione Minore', 'Parlare con gli Animali'] },
      { id: 'rock-gnome', name: 'Gnomo delle Rocce', spells: ['Riparare', 'Prestigiditazione'] }
    ]
  },
  { 
    id: 'goliath', 
    name: 'Goliath', 
    size: 'Media', 
    speed: 10.5, 
    traits: ['Antenato Gigante', 'Forma Grande (Livello 5)', 'Corporatura Possente'],
    subOptions: [
      { id: 'cloud', name: 'Cloud Giant (Cloud\'s Jaunt)', feature: 'Cloud\'s Jaunt' },
      { id: 'fire', name: 'Fire Giant (Fire\'s Burn)', feature: 'Fire\'s Burn' },
      { id: 'frost', name: 'Frost Giant (Frost\'s Chill)', feature: 'Frost\'s Chill' },
      { id: 'hill', name: 'Hill Giant (Hill\'s Tumble)', feature: 'Hill\'s Tumble' },
      { id: 'stone', name: 'Stone Giant (Stone\'s Endurance)', feature: 'Stone\'s Endurance' },
      { id: 'storm', name: 'Storm Giant (Storm\'s Thunder)', feature: 'Storm\'s Thunder' }
    ]
  },
  { id: 'halfling', name: 'Halfling', size: 'Piccola', speed: 7.5, traits: ['Coraggioso', 'Agilità Halfling', 'Fortunato', 'Furtività Naturale'] },
  { id: 'human', name: 'Umano', size: 'Media', speed: 9, traits: ['Ingegnoso', 'Versatilità nelle Abilità', 'Versatile'], skillChoices: 1, skillOptions: ALL_SKILLS },
  { id: 'orc', name: 'Orco', size: 'Media', speed: 9, traits: ['Scatto di Adrenalina', 'Scurovisione', 'Corporatura Possente', 'Resistenza Implacabile'] },
  { 
    id: 'tiefling', 
    name: 'Tiefling', 
    size: 'Media', 
    speed: 9, 
    traits: ['Scurovisione', 'Sguardo Oltremondano', 'Resistenza Infernale', 'Lignaggio Oltremondano'],
    subOptions: [
      { id: 'abyssal', name: 'Abissale', resistance: 'Veleno', spells: ['Spruzzo Velenoso'] },
      { id: 'chthonic', name: 'Ctonio', resistance: 'Necrotico', spells: ['Tocco Gelido'] },
      { id: 'infernal', name: 'Infernale', resistance: 'Fuoco', spells: ['Dardo di Fuoco'] }
    ]
  }
];

export const backgroundsData = [
  { id: 'acolyte', name: 'Accolito', boosts: ['INT', 'WIS', 'CHA'], feat: 'Iniziato alla Magia (Chierico)', skills: ['Intuizione', 'Religione'], tools: ['Scorte da Calligrafo'] },
  { id: 'artisan', name: 'Artigiano', boosts: ['STR', 'CON', 'INT'], feat: 'Esecutore', skills: ['Indagare', 'Persuasione'], tools: ['Strumenti da Artigiano (uno)'] },
  { id: 'charlatan', name: 'Ciarlatano', boosts: ['DEX', 'CON', 'CHA'], feat: 'Esperto', skills: ['Inganno', 'Rapidità di Mano'], tools: ['Kit per Contraffazione'] },
  { id: 'criminal', name: 'Criminale', boosts: ['DEX', 'CON', 'CHA'], feat: 'Allerta', skills: ['Inganno', 'Furtività'], tools: ['Attrezzi da Ladro'] },
  { id: 'entertainer', name: 'Intrattenitore', boosts: ['STR', 'DEX', 'CHA'], feat: 'Musicista', skills: ['Acrobazia', 'Intrattenimento'], tools: ['Strumento Musicale (uno)'] },
  { id: 'farmer', name: 'Contadino', boosts: ['STR', 'CON', 'WIS'], feat: 'Robusto', skills: ['Addestrare Animali', 'Natura'], tools: ['Strumenti da Artigiano (uno)'] },
  { id: 'guard', name: 'Guardia', boosts: ['STR', 'DEX', 'WIS'], feat: 'Allerta', skills: ['Atletica', 'Percezione'], tools: ['Set da Gioco (uno)'] },
  { id: 'guide', name: 'Guida', boosts: ['DEX', 'CON', 'WIS'], feat: 'Iniziato alla Magia (Druido)', skills: ['Furtività', 'Sopravvivenza'], tools: ['Strumenti da Cartografo'] },
  { id: 'hermit', name: 'Eremita', boosts: ['CON', 'WIS', 'CHA'], feat: 'Guaritore', skills: ['Medicina', 'Religione'], tools: ['Kit di Erboristeria'] },
  { id: 'merchant', name: 'Mercante', boosts: ['CON', 'INT', 'CHA'], feat: 'Fortunato', skills: ['Addestrare Animali', 'Persuasione'], tools: ['Strumenti da Navigatore'] },
  { id: 'noble', name: 'Nobile', boosts: ['STR', 'INT', 'CHA'], feat: 'Esperto', skills: ['Storia', 'Persuasione'], tools: ['Set da Gioco (uno)'] },
  { id: 'sage', name: 'Sapiente', boosts: ['CON', 'INT', 'WIS'], feat: 'Iniziato alla Magia (Mago)', skills: ['Arcano', 'Storia'], tools: ['Scorte da Calligrafo'] },
  { id: 'sailor', name: 'Marinaio', boosts: ['STR', 'DEX', 'WIS'], feat: 'Rissoso da Taverna', skills: ['Acrobazia', 'Percezione'], tools: ['Strumenti da Navigatore'] },
  { id: 'scribe', name: 'Scriba', boosts: ['DEX', 'INT', 'WIS'], feat: 'Esperto', skills: ['Indagare', 'Percezione'], tools: ['Scorte da Calligrafo'] },
  { id: 'soldier', name: 'Soldato', boosts: ['STR', 'DEX', 'CON'], feat: 'Attaccante Ferale', skills: ['Atletica', 'Intimidire'], tools: ['Set da Gioco (uno)'] },
  { id: 'wayfarer', name: 'Viandante', boosts: ['DEX', 'CON', 'WIS'], feat: 'Fortunato', skills: ['Intuizione', 'Furtività'], tools: ['Attrezzi da Ladro'] }
];

export const classesData = [
  { id: 'barbarian', name: 'Barbaro', hitDie: 12, saves: ['STR', 'CON'], skillChoices: 2, skillOptions: ['Addestrare Animali', 'Atletica', 'Intimidire', 'Natura', 'Percezione', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2 },
  { id: 'bard', name: 'Bardo', hitDie: 8, saves: ['DEX', 'CHA'], skillChoices: 3, skillOptions: ALL_SKILLS, armor: ['Leggera'], weapons: ['Semplici'], masteryCount: 0 },
  { id: 'cleric', name: 'Chierico', hitDie: 8, saves: ['WIS', 'CHA'], skillChoices: 2, skillOptions: ['Storia', 'Intuizione', 'Medicina', 'Persuasione', 'Religione'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici'], masteryCount: 0 },
  { id: 'druid', name: 'Druido', hitDie: 8, saves: ['INT', 'WIS'], skillChoices: 2, skillOptions: ['Arcano', 'Addestrare Animali', 'Intuizione', 'Medicina', 'Natura', 'Percezione', 'Religione', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici'], masteryCount: 0 },
  { id: 'fighter', name: 'Guerriero', hitDie: 10, saves: ['STR', 'CON'], skillChoices: 2, skillOptions: ['Acrobazia', 'Addestrare Animali', 'Atletica', 'Storia', 'Intuizione', 'Intimidire', 'Percezione', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Pesante', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 3 },
  { id: 'monk', name: 'Monaco', hitDie: 8, saves: ['STR', 'DEX'], skillChoices: 2, skillOptions: ['Acrobazia', 'Atletica', 'Storia', 'Intuizione', 'Religione', 'Furtività'], armor: [], weapons: ['Semplici', 'Marziali (finesse/leggere)'], masteryCount: 0 },
  { id: 'paladin', name: 'Paladino', hitDie: 10, saves: ['WIS', 'CHA'], skillChoices: 2, skillOptions: ['Atletica', 'Intuizione', 'Intimidire', 'Medicina', 'Persuasione', 'Religione'], armor: ['Leggera', 'Media', 'Pesante', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2 },
  { id: 'ranger', name: 'Ranger', hitDie: 10, saves: ['STR', 'DEX'], skillChoices: 3, skillOptions: ['Addestrare Animali', 'Atletica', 'Intuizione', 'Indagare', 'Natura', 'Percezione', 'Furtività', 'Sopravvivenza'], armor: ['Leggera', 'Media', 'Scudi'], weapons: ['Semplici', 'Marziali'], masteryCount: 2 },
  { id: 'rogue', name: 'Ladro', hitDie: 8, saves: ['DEX', 'INT'], skillChoices: 4, skillOptions: ['Acrobazia', 'Atletica', 'Inganno', 'Intuizione', 'Intimidire', 'Indagare', 'Percezione', 'Intrattenimento', 'Persuasione', 'Rapidità di Mano', 'Furtività'], armor: ['Leggera'], weapons: ['Semplici', 'Marziali (finesse)'], masteryCount: 2 },
  { id: 'sorcerer', name: 'Stregone', hitDie: 6, saves: ['CON', 'CHA'], skillChoices: 2, skillOptions: ['Arcano', 'Inganno', 'Intuizione', 'Intimidire', 'Persuasione', 'Religione'], armor: [], weapons: ['Semplici'], masteryCount: 0 },
  { id: 'warlock', name: 'Warlock', hitDie: 8, saves: ['WIS', 'CHA'], skillChoices: 2, skillOptions: ['Arcano', 'Inganno', 'Storia', 'Intimidire', 'Indagare', 'Natura', 'Religione'], armor: ['Leggera'], weapons: ['Semplici'], masteryCount: 0 },
  { id: 'wizard', name: 'Mago', hitDie: 6, saves: ['INT', 'WIS'], skillChoices: 2, skillOptions: ['Arcano', 'Storia', 'Intuizione', 'Indagare', 'Medicina', 'Religione'], armor: [], weapons: ['Semplici'], masteryCount: 0 }
];
