import { getModifier } from './utils';

// ==========================================
// 1. SOTTOCLASSI E AVANZAMENTO DI LIVELLO
// ==========================================
export function levelUpCharacter(
  currentLevel: number, 
  currentHpMax: number, 
  conScore: number, 
  hitDie: number
) {
  const newLevel = currentLevel + 1;
  const newProfBonus = Math.floor((newLevel - 1) / 4) + 2;
  const conMod = getModifier(conScore);
  
  // Nelle regole, dal livello 2 si prende la media arrotondata per eccesso (Math.floor(d/2) + 1)
  const avgHitDie = Math.floor(hitDie / 2) + 1;
  // Costituzione mod viene sommata. L'HP guadagnato deve essere minimo 1
  const hpGain = Math.max(1, avgHitDie + conMod);
  const newHpMax = currentHpMax + hpGain;

  return {
    newLevel,
    newProfBonus,
    newHpMax,
    addedHitDie: hitDie
  };
}

// ==========================================
// 2. REGOLE PER IL MULTICLASSE (2024 Requisiti = Punteggio 13)
// ==========================================
const CLASS_PRIMARY_STATS: Record<string, string[]> = {
  barbarian: ['STR'], bard: ['CHA'], cleric: ['WIS'], druid: ['WIS'],
  fighter: ['STR', 'DEX'], monk: ['DEX', 'WIS'], paladin: ['STR', 'CHA'],
  ranger: ['DEX', 'WIS'], rogue: ['DEX'], sorcerer: ['CHA'], warlock: ['CHA'], wizard: ['INT']
};

export function canMulticlass(
  abilityScores: Record<string, number>, 
  currentClass: string, 
  newClass: string
): boolean {
  const checkClassReq = (clsId: string) => {
    const reqs = CLASS_PRIMARY_STATS[clsId] || [];
    if (reqs.length === 0) return true;
    // Serve "almeno una" delle caratteristiche se la lista contiene 2 stat (es. Fighter: STR o DEX)
    return reqs.some(req => abilityScores[req] >= 13);
  };
  return checkClassReq(currentClass) && checkClassReq(newClass);
}

// ==========================================
// 4. GESTIONE AVANZATA EQUIPAGGIAMENTO
// ==========================================
export function calculateCarryingCapacity(strScore: number): number {
  // Regola 2024 base: Forza * 15 lb. Convertita in standard metrico localizzato (EU): Forza * 7.5 kg
  return strScore * 7.5;
}

export function maxAttunementItems(): number {
  // Hard cap limit richiesto
  return 3;
}

// ==========================================
// 5. GESTIONE AUTOMATICA RISORSE 
// ==========================================

// Tabella Slot Generici 2024
const SPELL_SLOTS_TABLE: Record<number, number[]> = {
  0: [0,0,0,0,0,0,0,0,0], 1: [2,0,0,0,0,0,0,0,0], 2: [3,0,0,0,0,0,0,0,0], 3: [4,2,0,0,0,0,0,0,0],
  4: [4,3,0,0,0,0,0,0,0], 5: [4,3,2,0,0,0,0,0,0], 6: [4,3,3,0,0,0,0,0,0], 7: [4,3,3,1,0,0,0,0,0],
  8: [4,3,3,2,0,0,0,0,0], 9: [4,3,3,3,1,0,0,0,0], 10: [4,3,3,3,2,0,0,0,0], 11: [4,3,3,3,2,1,0,0,0],
  12: [4,3,3,3,2,1,0,0,0], 13: [4,3,3,3,2,1,1,0,0], 14: [4,3,3,3,2,1,1,0,0], 15: [4,3,3,3,2,1,1,1,0],
  16: [4,3,3,3,2,1,1,1,0], 17: [4,3,3,3,2,1,1,1,1], 18: [4,3,3,3,3,1,1,1,1], 19: [4,3,3,3,3,2,1,1,1],
  20: [4,3,3,3,3,2,2,1,1]
};

export function calculateSpellSlots(classesLevels: Record<string, number>): number[] {
  let casterLevel = 0;
  for (const [cls, level] of Object.entries(classesLevels)) {
    if (['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].includes(cls)) {
      casterLevel += level;
    } else if (['paladin', 'ranger'].includes(cls)) {
      // 2024: Paladin e Ranger arrotondano per eccesso (round up)
      casterLevel += Math.ceil(level / 2);
    } else if (['fighter-ek', 'rogue-at'].includes(cls)) {
      // Eldritch Knight & Arcane Trickster arrotondano per difetto a 1/3 (round down)
      casterLevel += Math.floor(level / 3);
    }
  }
  return SPELL_SLOTS_TABLE[Math.min(20, Math.max(0, casterLevel))] || SPELL_SLOTS_TABLE[0];
}

export function calculateSorceryPoints(sorcererLevel: number): number {
  return sorcererLevel >= 2 ? sorcererLevel : 0;
}

export function calculateChannelDivinity(paladinLevel: number, clericLevel: number): number {
  let total = 0;
  if (clericLevel >= 18) total += 4;
  else if (clericLevel >= 6) total += 3;
  else if (clericLevel >= 2) total += 2;

  if (paladinLevel >= 11) total += 3;
  else if (paladinLevel >= 3) total += 2;

  return total;
}
