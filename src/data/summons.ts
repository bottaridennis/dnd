
import { Bird, Cat, Fish, Bug, Ghost, Flame, Waves, Wind, Mountain, Ghost as FiendIcon, Star } from 'lucide-react';

export interface Action {
  name: string;
  desc: string;
  attackBonus?: boolean; // If true, uses calculated spell attack
  damage?: string;
  damageBonus?: boolean; // If true, adds spell level or similar
}

export interface SummonTemplate {
  id: string;
  name: string;
  type: string;
  category: 'Basic' | 'Pact' | 'Scaling' | 'Homebrew';
  icon: any;
  // Fixed Stats
  ac?: number;
  hp?: number;
  speed: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  senses?: string[];
  traits?: { name: string; desc: string }[];
  actions?: Action[];
  // Scaling Formulas (Only for Scaling category)
  acFormula?: (level: number) => number;
  hpFormula?: (level: number) => number;
  attackFormula?: (mod: number) => number;
  damageBonusFormula?: (level: number) => number;
}

export const SUMMONS_DATA: SummonTemplate[] = [
  // --- BASIC SUMMONS ---
  {
    id: 'unseen-servant',
    name: 'Servitore Invisibile',
    type: 'Costrutto',
    category: 'Basic',
    icon: Ghost,
    ac: 10,
    hp: 1,
    speed: '9m',
    str: 2, dex: 10, con: 10, int: 1, wis: 10, cha: 1,
    traits: [
        { name: 'Invisibile', desc: 'Il servitore è invisibile.' },
        { name: 'Senza Forza', desc: 'Non può attaccare o infliggere danni.' }
    ]
  },
  { 
    id: 'bat', name: 'Pipistrello', type: 'Bestia', category: 'Basic', icon: Bird,
    ac: 12, hp: 1, speed: '1.5m, volo 9m', 
    str: 2, dex: 15, con: 8, int: 2, wis: 12, cha: 4,
    senses: ['Percezione Cieca 18m'],
    traits: [{ name: 'Udito Affinato', desc: 'Vantaggio alle prove di Saggezza (Percezione) basate sull\'udito.' }]
  },
  { 
    id: 'cat', name: 'Gatto', type: 'Bestia', category: 'Basic', icon: Cat,
    ac: 12, hp: 2, speed: '12m, scalare 9m', 
    str: 3, dex: 15, con: 10, int: 3, wis: 12, cha: 7,
    traits: [{ name: 'Olfatto Affinato', desc: 'Vantaggio alle prove di Saggezza (Percezione) basate sull\'olfatto.' }]
  },
  { 
    id: 'owl', name: 'Gufo', type: 'Bestia', category: 'Basic', icon: Bird,
    ac: 11, hp: 1, speed: '1.5m, volo 18m', 
    str: 3, dex: 13, con: 8, int: 2, wis: 12, cha: 7,
    traits: [{ name: 'Flyby', desc: 'Non provoca attacchi di opportunità.' }]
  },

  // --- PACT OF THE CHAIN ---
  {
    id: 'imp',
    name: 'Diavoletto (Imp)',
    type: 'Immondo',
    category: 'Pact',
    icon: FiendIcon,
    ac: 13,
    hp: 10,
    speed: '6m, volo 12m',
    str: 6, dex: 17, con: 13, int: 11, wis: 12, cha: 14,
    senses: ['Vedere nell\'Oscurità 36m'],
    traits: [
        { name: 'Resistenza alla Magia', desc: 'Vantaggio ai tiri salvezza contro incantesimi.' },
        { name: 'Invisibilità', desc: 'Può diventare invisibile come azione.' }
    ],
    actions: [
        { name: 'Pungiglione', desc: 'Attacco con arma: +5, 1d4+3 perforanti + 3d6 veleno (Metà se supera TS).' }
    ]
  },
  {
    id: 'pseudodragon',
    name: 'Pseudodrago',
    type: 'Drago',
    category: 'Pact',
    icon: Bird,
    ac: 13,
    hp: 7,
    speed: '4.5m, volo 18m',
    str: 6, dex: 15, con: 13, int: 10, wis: 12, cha: 10,
    senses: ['Percezione Cieca 3m', 'Scurovisione 18m'],
    actions: [
        { name: 'Morso/Pungiglione', desc: 'Attacco con arma: +4, 1d4+2 perforanti. Pungiglione: TS Costituzione (CD 11) o Avvelenato.' }
    ]
  },

  // --- SCALING SPIRITS ---
  {
    id: 'elemental-spirit',
    name: 'Spirito Elementale',
    type: 'Elementale',
    category: 'Scaling',
    icon: Flame,
    speed: '9m (Varia)',
    str: 18, dex: 15, con: 17, int: 4, wis: 10, cha: 16,
    acFormula: (level) => 11 + level,
    hpFormula: (level) => 50 + (10 * Math.max(0, level - 4)),
    attackFormula: (mod) => mod,
    damageBonusFormula: (level) => 4 + level,
    actions: [
        { name: 'Colpo Elementale', desc: 'Attacco da Mischia: {attack}, 1d10 + {damageBonus} danni.' }
    ]
  },
  {
    id: 'fey-spirit',
    name: 'Spirito Fatato',
    type: 'Folletto',
    category: 'Scaling',
    icon: Star,
    speed: '12m',
    str: 13, dex: 16, con: 14, int: 14, wis: 11, cha: 16,
    acFormula: (level) => 12 + level,
    hpFormula: (level) => 30 + (10 * Math.max(0, level - 3)),
    attackFormula: (mod) => mod,
    damageBonusFormula: (level) => 3 + level,
    actions: [
        { name: 'Spada Corta', desc: 'Attacco da Mischia: {attack}, 1d6 + 3 + {damageBonus} danni di forza.' }
    ]
  },
  {
    id: 'fiendish-spirit',
    name: 'Spirito Immondo',
    type: 'Immondo',
    category: 'Scaling',
    icon: FiendIcon,
    speed: '9m, volo 18m (Demon)',
    str: 13, dex: 16, con: 15, int: 10, wis: 10, cha: 16,
    acFormula: (level) => 11 + level,
    hpFormula: (level) => 40 + (15 * Math.max(0, level - 5)),
    attackFormula: (mod) => mod,
    damageBonusFormula: (level) => 3 + level,
    actions: [
        { name: 'Morso Infernale', desc: 'Attacco da Mischia: {attack}, 1d10 + 3 + {damageBonus} danni necrotici.' }
    ]
  }
];
