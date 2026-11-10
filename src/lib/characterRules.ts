/**
 * Motore di regole D&D 5.5e (PHB 2024).
 * Tutti i valori derivati della scheda (punteggi, PF, CA, TS, abilità, incantesimi,
 * attacchi, Dadi Vita…) vengono calcolati qui, così wizard, scheda e riepilogo
 * mostrano sempre gli stessi numeri.
 */
import type { Ability, CharacterData, InventoryItem } from '../contexts/CharacterContext';
import { backgroundsData, classesData, speciesData, ALL_SKILLS } from '../data/rules2024';
import { findArmor, findWeapon, type ArmorData } from '../data/weaponsData';
import { getModifier } from './utils';
import { getFixedClassTools, getFixedLanguages } from '../data/languages';

export const ABILITIES: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const ABILITY_NAMES: Record<Ability, string> = {
  STR: 'Forza', DEX: 'Destrezza', CON: 'Costituzione', INT: 'Intelligenza', WIS: 'Saggezza', CHA: 'Carisma',
};

export const SKILL_ABILITIES: Record<string, Ability> = {
  'Acrobazia': 'DEX', 'Addestrare Animali': 'WIS', 'Arcano': 'INT', 'Atletica': 'STR',
  'Furtività': 'DEX', 'Indagare': 'INT', 'Inganno': 'CHA', 'Intimidire': 'CHA',
  'Intrattenimento': 'CHA', 'Intuizione': 'WIS', 'Medicina': 'WIS', 'Natura': 'INT',
  'Percezione': 'WIS', 'Persuasione': 'CHA', 'Rapidità di Mano': 'DEX', 'Religione': 'INT',
  'Sopravvivenza': 'WIS', 'Storia': 'INT',
};

export const POINT_BUY_COSTS: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUY_BUDGET = 27;
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export type ClassLevelMap = Record<string, { level: number; subclass?: string }>;

type CharacterLike = Pick<CharacterData, 'classId' | 'level'> & Partial<CharacterData>;

// ------------------------------------------------------------------
// Classi e livelli
// ------------------------------------------------------------------

/** Restituisce sempre una mappa classe → livello coerente, anche per i personaggi creati prima del multiclasse. */
export function getClassLevels(character: CharacterLike): ClassLevelMap {
  const entries = Object.entries(character.classes || {}).filter(([, data]) => data && data.level > 0);
  if (entries.length > 0) {
    const map: ClassLevelMap = {};
    entries.forEach(([id, data]) => {
      map[id] = { level: data.level, subclass: data.subclass || (id === character.classId ? character.subclassId || undefined : undefined) };
    });
    return map;
  }
  if (!character.classId) return {};
  return { [character.classId]: { level: Math.max(1, character.level || 1), subclass: character.subclassId || undefined } };
}

export function getTotalLevel(character: CharacterLike): number {
  const sum = Object.values(getClassLevels(character)).reduce((acc, c) => acc + c.level, 0);
  return Math.max(1, Math.min(20, sum || character.level || 1));
}

export function getProficiencyBonus(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2;
}

export function getSubclass(character: CharacterLike, classId: string): string | undefined {
  return getClassLevels(character)[classId]?.subclass;
}

// ------------------------------------------------------------------
// Caratteristiche
// ------------------------------------------------------------------

export function getBoostMode(character: Pick<CharacterData, 'selectedBoosts'> & Partial<CharacterData>): '2/1' | '1/1/1' {
  if (character.boostMode) return character.boostMode;
  return (character.selectedBoosts || []).length === 3 ? '1/1/1' : '2/1';
}

export function getBackgroundBonus(character: Pick<CharacterData, 'selectedBoosts'> & Partial<CharacterData>, ability: Ability): number {
  const boosts = character.selectedBoosts || [];
  const index = boosts.indexOf(ability);
  if (index === -1) return 0;
  return getBoostMode(character) === '1/1/1' ? 1 : index === 0 ? 2 : 1;
}

export function getFinalScores(character: Pick<CharacterData, 'abilityScores' | 'selectedBoosts'> & Partial<CharacterData>): Record<Ability, number> {
  const scores = {} as Record<Ability, number>;
  ABILITIES.forEach(ability => {
    const base = Number(character.abilityScores?.[ability] ?? 8);
    const bonus = getBackgroundBonus(character, ability);
    // Il bonus del background non può portare un punteggio oltre 20
    const withBackground = Math.min(base + bonus, Math.max(base, 20));
    const extra = Number(character.abilityBonuses?.[ability] || 0);
    // Gli aumenti successivi (ASI/talenti) sono limitati a 20; valori più alti (Benedizioni Epiche) si impostano in modifica manuale
    let score = withBackground + extra;
    if (extra > 0) score = Math.min(score, Math.max(20, withBackground));
    scores[ability] = Math.max(1, Math.min(30, score));
  });
  return scores;
}

export function getModifiers(scores: Record<Ability, number>): Record<Ability, number> {
  return ABILITIES.reduce((acc, ability) => ({ ...acc, [ability]: getModifier(scores[ability]) }), {} as Record<Ability, number>);
}

// ------------------------------------------------------------------
// Talenti
// ------------------------------------------------------------------

export function getAllFeats(character: Partial<CharacterData>): string[] {
  return [character.originFeat, character.bonusOriginFeat, ...(character.feats || [])].filter((f): f is string => Boolean(f));
}

export function hasFeat(character: Partial<CharacterData>, featName: string): boolean {
  const target = featName.toLocaleLowerCase('it');
  return getAllFeats(character).some(f => f.toLocaleLowerCase('it') === target || f.split(' (')[0].toLocaleLowerCase('it') === target);
}

// ------------------------------------------------------------------
// Punti Ferita e Dadi Vita
// ------------------------------------------------------------------

export function averageHitDie(hitDie: number): number {
  return Math.floor(hitDie / 2) + 1;
}

/** PF massimi (PHB 2024): massimo del dado al 1° livello, media arrotondata per eccesso ai successivi. */
export function computeHpMax(character: CharacterLike, conMod: number): number {
  if (character.hpMaxOverride !== undefined && character.hpMaxOverride !== null && character.hpMaxOverride > 0) {
    return character.hpMaxOverride;
  }
  const classLevels = getClassLevels(character);
  const startingClass = classLevels[character.classId] ? character.classId : Object.keys(classLevels)[0];
  let total = 0;
  let levels = 0;
  Object.entries(classLevels).forEach(([classId, data]) => {
    const die = classesData.find(c => c.id === classId)?.hitDie || 8;
    for (let i = 1; i <= data.level; i++) {
      const isFirstCharacterLevel = classId === startingClass && i === 1;
      const roll = isFirstCharacterLevel ? die : averageHitDie(die);
      total += Math.max(1, roll + conMod);
      levels++;
    }
  });
  if (levels === 0) {
    total = Math.max(1, 8 + conMod);
    levels = 1;
  }
  if (character.speciesId === 'dwarf') total += levels; // Robustezza Nanica
  if (hasFeat(character, 'Duro')) total += 2 * levels; // Talento Duro (Tough)
  return Math.max(1, total);
}

export function getHpGainForLevel(character: CharacterLike, classId: string, conMod: number): number {
  const die = classesData.find(c => c.id === classId)?.hitDie || 8;
  let gain = Math.max(1, averageHitDie(die) + conMod);
  if (character.speciesId === 'dwarf') gain += 1;
  if (hasFeat(character, 'Duro')) gain += 2;
  return gain;
}

export interface HitDicePool { die: number; total: number; spent: number; available: number }

export function getHitDicePools(character: CharacterLike): HitDicePool[] {
  const pools: Record<number, number> = {};
  Object.entries(getClassLevels(character)).forEach(([classId, data]) => {
    const die = classesData.find(c => c.id === classId)?.hitDie || 8;
    pools[die] = (pools[die] || 0) + data.level;
  });
  return Object.entries(pools)
    .map(([die, total]) => {
      const spent = Math.min(total, Number(character.hitDiceSpent?.[die] || 0));
      return { die: Number(die), total, spent, available: total - spent };
    })
    .sort((a, b) => b.die - a.die);
}

// ------------------------------------------------------------------
// Classe Armatura
// ------------------------------------------------------------------

export interface EquippedArmor { armor?: ArmorData; armorItem?: InventoryItem; shield?: ArmorData; shieldItem?: InventoryItem }

export function getEquippedArmor(character: Partial<CharacterData>): EquippedArmor {
  const result: EquippedArmor = {};
  (character.inventoryItems || []).filter(item => item.isEquipped).forEach(item => {
    const armor = findArmor(item.name);
    if (!armor) return;
    if (armor.category === 'Scudo') {
      if (!result.shield) { result.shield = armor; result.shieldItem = item; }
    } else if (!result.armor || armor.baseAc > result.armor.baseAc) {
      result.armor = armor;
      result.armorItem = item;
    }
  });
  return result;
}

export interface ArmorClassResult {
  value: number;
  base: number;
  source: string;
  stealthDisadvantage: boolean;
  strengthPenalty: boolean;
  untrained: boolean;
  isOverride: boolean;
}

function hasArmorTraining(character: CharacterLike, category: string): boolean {
  const classLevels = getClassLevels(character);
  const startingClass = classesData.find(c => c.id === character.classId);
  // Il primo livello conferisce tutte le competenze, il multiclasse solo alcune: semplifichiamo usando l'unione
  const trainings = new Set<string>(startingClass?.armor || []);
  Object.keys(classLevels).forEach(id => classesData.find(c => c.id === id)?.armor.forEach(a => trainings.add(a)));
  if (hasFeat(character, 'Armatura Leggera (Addestramento)')) trainings.add('Leggera');
  if (hasFeat(character, 'Armatura Media (Addestramento)')) trainings.add('Media');
  if (hasFeat(character, 'Armatura Pesante (Addestramento)')) trainings.add('Pesante');
  const key = category === 'Scudo' ? 'Scudi' : category;
  return trainings.has(key);
}

export function computeArmorClass(character: CharacterLike, mods: Record<Ability, number>, scores: Record<Ability, number>): ArmorClassResult {
  const { armor, armorItem, shield, shieldItem } = getEquippedArmor(character);
  const classLevels = getClassLevels(character);
  const candidates: { value: number; source: string }[] = [];

  if (armor) {
    const dex = armor.maxDex === null ? mods.DEX : Math.min(armor.maxDex, mods.DEX);
    candidates.push({ value: armor.baseAc + dex + (armorItem?.magicBonus || 0), source: armor.name });
  } else {
    candidates.push({ value: 10 + mods.DEX, source: 'Senza armatura' });
    if (classLevels.barbarian) candidates.push({ value: 10 + mods.DEX + mods.CON, source: 'Difesa Senza Armatura (Barbaro)' });
    if (classLevels.monk && !shield) candidates.push({ value: 10 + mods.DEX + mods.WIS, source: 'Difesa Senza Armatura (Monaco)' });
    if (classLevels.sorcerer?.level >= 3 && /dracon/i.test(classLevels.sorcerer.subclass || '')) {
      candidates.push({ value: 10 + mods.DEX + mods.CHA, source: 'Resilienza Draconica' });
    }
  }

  const best = candidates.reduce((a, b) => (b.value > a.value ? b : a));
  const shieldBonus = shield ? shield.baseAc + (shieldItem?.magicBonus || 0) : 0;
  const computed = best.value + shieldBonus;
  const isOverride = character.acOverride !== undefined && character.acOverride !== null;

  return {
    value: isOverride ? Number(character.acOverride) : computed,
    base: computed,
    source: shield ? `${best.source} + Scudo` : best.source,
    stealthDisadvantage: Boolean(armor?.stealthDisadvantage),
    strengthPenalty: Boolean(armor?.strength && scores.STR < armor.strength),
    untrained: Boolean((armor && !hasArmorTraining(character, armor.category)) || (shield && !hasArmorTraining(character, 'Scudo'))),
    isOverride,
  };
}

// ------------------------------------------------------------------
// Velocità e sensi
// ------------------------------------------------------------------

function getSpeciesSubOption(character: Partial<CharacterData>): any {
  const species = speciesData.find(s => s.id === character.speciesId) as any;
  return species?.subOptions?.find((o: any) => o.id === character.speciesSubOption);
}

export function computeSpeed(character: CharacterLike, scores: Record<Ability, number>): { value: number; base: number; notes: string[] } {
  const species = speciesData.find(s => s.id === character.speciesId);
  const sub = getSpeciesSubOption(character);
  const notes: string[] = [];
  let base = sub?.speed || species?.speed || 9;
  const classLevels = getClassLevels(character);
  const { armor, shield } = getEquippedArmor(character);

  const monkLevel = classLevels.monk?.level || 0;
  if (monkLevel >= 2 && !armor && !shield) {
    const bonus = monkLevel >= 18 ? 9 : monkLevel >= 14 ? 7.5 : monkLevel >= 10 ? 6 : monkLevel >= 6 ? 4.5 : 3;
    base += bonus;
    notes.push(`Movimento Senza Armatura +${bonus}m`);
  }
  const barbarianLevel = classLevels.barbarian?.level || 0;
  if (barbarianLevel >= 5 && armor?.category !== 'Pesante') {
    base += 3;
    notes.push('Movimento Veloce +3m');
  }
  if (armor?.strength && scores.STR < armor.strength) {
    base -= 3;
    notes.push(`Forza insufficiente per ${armor.name}: -3m`);
  }
  if (hasFeat(character, 'Scattante')) {
    base += 3;
    notes.push('Scattante +3m');
  }

  const isOverride = character.speedOverride !== undefined && character.speedOverride !== null;
  const start = isOverride ? Number(character.speedOverride) : base;
  const exhaustion = character.exhaustion || 0;
  if (exhaustion > 0) notes.push(`Esaurimento -${exhaustion * 1.5}m`);
  return { value: Math.max(0, start - exhaustion * 1.5), base, notes };
}

export function computeDarkvision(character: Partial<CharacterData>): number {
  if (character.darkvisionOverride !== undefined && character.darkvisionOverride !== null) return Number(character.darkvisionOverride);
  const species = speciesData.find(s => s.id === character.speciesId) as any;
  const sub = getSpeciesSubOption(character);
  return sub?.darkvision || species?.darkvision || 0;
}

// ------------------------------------------------------------------
// Abilità e Tiri Salvezza
// ------------------------------------------------------------------

export function getSkillProficiencies(character: Partial<CharacterData>): string[] {
  const bgSkills = backgroundsData.find(b => b.id === character.backgroundId)?.skills || [];
  return Array.from(new Set([...(character.proficientSkills || []), ...(character.speciesSkills || []), ...bgSkills]))
    .filter(skill => ALL_SKILLS.includes(skill));
}

export function getSaveProficiencies(character: CharacterLike): Ability[] {
  // Nel multiclasse si ottengono solo i TS della prima classe
  const saves = new Set<Ability>((classesData.find(c => c.id === character.classId)?.saves || []) as Ability[]);
  if (hasFeat(character, 'Resiliente')) {
    // Il talento Resiliente richiede la scelta di una caratteristica: tracciata come "Resiliente (DEX)"
    getAllFeats(character).forEach(f => {
      const match = f.match(/Resiliente \((STR|DEX|CON|INT|WIS|CHA)\)/);
      if (match) saves.add(match[1] as Ability);
    });
  }
  return Array.from(saves);
}

// ------------------------------------------------------------------
// Incantesimi
// ------------------------------------------------------------------

const CANTRIPS_KNOWN: Record<string, number[]> = {
  bard: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  cleric: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  druid: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  sorcerer: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  wizard: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  'fighter-ek': [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  'rogue-at': [0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
};

const PREPARED_SPELLS: Record<string, number[]> = {
  bard: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  cleric: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  druid: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  sorcerer: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  wizard: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  paladin: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  ranger: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  'fighter-ek': [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
  'rogue-at': [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
};

const INVOCATIONS_KNOWN = [1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10];

export function isEldritchKnight(subclass?: string) { return /cavaliere arcano|eldritch knight/i.test(subclass || ''); }
export function isArcaneTrickster(subclass?: string) { return /mistificatore arcano|arcane trickster/i.test(subclass || ''); }

export interface SpellcastingInfo {
  classId: string;
  label: string;
  ability: Ability;
  saveDc: number;
  attackBonus: number;
  cantrips: number;
  prepared: number;
}

export function getSpellcastingInfo(character: CharacterLike, mods: Record<Ability, number>, proficiency: number): SpellcastingInfo[] {
  const result: SpellcastingInfo[] = [];
  Object.entries(getClassLevels(character)).forEach(([classId, data]) => {
    const def = classesData.find(c => c.id === classId);
    let key = classId;
    let ability = def?.spellcastingAbility as Ability | undefined;
    let label = def?.name || classId;
    if (!ability && classId === 'fighter' && isEldritchKnight(data.subclass)) { key = 'fighter-ek'; ability = 'INT'; label = 'Cavaliere Arcano'; }
    if (!ability && classId === 'rogue' && isArcaneTrickster(data.subclass)) { key = 'rogue-at'; ability = 'INT'; label = 'Mistificatore Arcano'; }
    if (!ability) return;
    const idx = Math.min(20, data.level) - 1;
    result.push({
      classId,
      label,
      ability,
      saveDc: 8 + proficiency + mods[ability],
      attackBonus: proficiency + mods[ability],
      cantrips: CANTRIPS_KNOWN[key]?.[idx] ?? 0,
      prepared: PREPARED_SPELLS[key]?.[idx] ?? 0,
    });
  });
  return result;
}

export function getInvocationsKnown(character: CharacterLike): number {
  const level = getClassLevels(character).warlock?.level || 0;
  return level > 0 ? INVOCATIONS_KNOWN[Math.min(20, level) - 1] : 0;
}

export function getWeaponMasteryCount(character: CharacterLike): number {
  let best = 0;
  Object.entries(getClassLevels(character)).forEach(([classId, data]) => {
    const def = classesData.find(c => c.id === classId);
    if (!def) return;
    const count = def.masteryByLevel ? def.masteryByLevel[Math.min(20, data.level)] : def.masteryCount;
    best = Math.max(best, count || 0);
  });
  if (hasFeat(character, 'Maestro d’Armi')) best += 1;
  return best;
}

// ------------------------------------------------------------------
// Attacchi con le armi
// ------------------------------------------------------------------

export interface WeaponAttack {
  itemId: string;
  name: string;
  ability: Ability;
  attackBonus: number;
  damage: string;
  damageType: string;
  proficient: boolean;
  mastery?: string;
  masteryActive: boolean;
  properties: string[];
}

function isWeaponProficient(character: CharacterLike, category: string | undefined, properties: string[]): boolean {
  const classLevels = Object.keys(getClassLevels(character));
  if (!category) return true; // armi homebrew senza categoria
  if (category === 'Semplice') return true; // tutte le classi 2024 sono competenti nelle armi semplici
  if (hasFeat(character, 'Addestramento alle Armi Marziali')) return true;
  return classLevels.some(id => {
    const weapons = classesData.find(c => c.id === id)?.weapons || [];
    if (weapons.includes('Marziali')) return true;
    if (id === 'monk') return properties.includes('Light');
    if (id === 'rogue') return properties.includes('Light') || properties.includes('Finesse');
    return false;
  });
}

export function getWeaponAttacks(character: CharacterLike, mods: Record<Ability, number>, proficiency: number): WeaponAttack[] {
  const penalty = (character.exhaustion || 0) * 2;
  const classLevels = getClassLevels(character);
  const masteries = character.weaponMasteries || {};
  return (character.inventoryItems || [])
    .filter(item => item.isEquipped && (item.damage || findWeapon(item.name)))
    .map(item => {
      const data = findWeapon(item.name);
      const properties = item.properties || data?.properties || [];
      const isRanged = data?.kind === 'ranged' || properties.some(p => p.startsWith('Ammunition'));
      const finesse = properties.includes('Finesse');
      const isMonkWeapon = Boolean(classLevels.monk) && !isRanged && (data?.category === 'Semplice' || properties.includes('Light')) && !properties.includes('Heavy');
      let ability: Ability = isRanged ? 'DEX' : 'STR';
      if ((finesse || isMonkWeapon) && mods.DEX > mods.STR) ability = 'DEX';
      const proficient = isWeaponProficient(character, data?.category, properties);
      const magic = item.magicBonus || 0;
      const archery = isRanged && hasFeat(character, 'Tiro con l’Arco') ? 2 : 0;
      const attackBonus = mods[ability] + (proficient ? proficiency : 0) + magic + archery - penalty;
      const dmgMod = mods[ability] + magic;
      const die = item.damage || data?.damage || '1d4';
      const mastery = item.mastery || data?.mastery;
      const masteryKey = Object.keys(masteries).find(k => k.toLocaleLowerCase('it') === (data?.name || item.name).toLocaleLowerCase('it'));
      return {
        itemId: item.id,
        name: item.name,
        ability,
        attackBonus,
        damage: dmgMod === 0 ? die : `${die}${dmgMod > 0 ? '+' : ''}${dmgMod}`,
        damageType: item.damageType || data?.damageType || '',
        proficient,
        mastery: masteryKey ? masteries[masteryKey] : mastery,
        masteryActive: Boolean(masteryKey),
        properties,
      };
    });
}

// ------------------------------------------------------------------
// Multiclasse
// ------------------------------------------------------------------

export function meetsClassRequirement(scores: Record<Ability, number>, classId: string): boolean {
  const def = classesData.find(c => c.id === classId);
  if (!def || def.multiclassReq.length === 0) return true;
  return def.multiclassAny
    ? def.multiclassReq.some(a => scores[a] >= 13)
    : def.multiclassReq.every(a => scores[a] >= 13);
}

export function describeClassRequirement(classId: string): string {
  const def = classesData.find(c => c.id === classId);
  if (!def) return '';
  return def.multiclassReq.map(a => `${ABILITY_NAMES[a]} 13`).join(def.multiclassAny ? ' o ' : ' e ');
}

/** PHB 2024: per entrare in una nuova classe servono i requisiti sia delle classi attuali sia di quella nuova. */
export function canMulticlassInto(character: CharacterLike, scores: Record<Ability, number>, newClassId: string): { ok: boolean; reason?: string } {
  const current = Object.keys(getClassLevels(character));
  if (current.includes(newClassId)) return { ok: true };
  const failing = [...current, newClassId].filter(id => !meetsClassRequirement(scores, id));
  if (failing.length === 0) return { ok: true };
  return {
    ok: false,
    reason: failing.map(id => `${classesData.find(c => c.id === id)?.name}: ${describeClassRequirement(id)}`).join(' · '),
  };
}

// ------------------------------------------------------------------
// Statistiche complete
// ------------------------------------------------------------------

export function computeCharacterStats(character: CharacterData) {
  const level = getTotalLevel(character);
  const baseProficiency = getProficiencyBonus(level);
  const proficiencyBonus = character.proficiencyOverride !== undefined && character.proficiencyOverride !== null ? Number(character.proficiencyOverride) : baseProficiency;
  const scores = getFinalScores(character);
  const mods = getModifiers(scores);
  const exhaustionLevel = character.exhaustion || 0;
  const d20Penalty = exhaustionLevel * 2;

  const saveProficiencies = getSaveProficiencies(character);
  const savingThrows = ABILITIES.map(ability => {
    const isProficient = saveProficiencies.includes(ability);
    return { ability, isProficient, mod: mods[ability] + (isProficient ? proficiencyBonus : 0) - d20Penalty };
  });

  const proficiencies = getSkillProficiencies(character);
  const expertise = character.expertiseSkills || [];
  const skills = ALL_SKILLS.map(name => {
    const ability = SKILL_ABILITIES[name];
    const isProficient = proficiencies.includes(name) || expertise.includes(name);
    const isExpert = expertise.includes(name);
    const bonus = isExpert ? proficiencyBonus * 2 : isProficient ? proficiencyBonus : 0;
    return { name, ability, isProficient, isExpert, mod: mods[ability] + bonus - d20Penalty, passive: 10 + mods[ability] + bonus };
  });

  const perception = skills.find(s => s.name === 'Percezione')!;
  const insight = skills.find(s => s.name === 'Intuizione')!;
  const investigation = skills.find(s => s.name === 'Indagare')!;

  const armorClass = computeArmorClass(character, mods, scores);
  const speed = computeSpeed(character, scores);
  const hpMax = computeHpMax(character, mods.CON);
  const initiative = mods.DEX + (hasFeat(character, 'Allerta') ? proficiencyBonus : 0) - d20Penalty;

  return {
    level,
    scores,
    mods,
    hpMax,
    acBase: armorClass.value,
    armorClass,
    initiative,
    speed: speed.value,
    speedInfo: speed,
    darkvision: computeDarkvision(character),
    passivePerception: perception.passive,
    passiveInsight: insight.passive,
    passiveInvestigation: investigation.passive,
    proficiencyBonus,
    d20Penalty,
    exhaustionLevel,
    savingThrows,
    skills,
    spellcasting: getSpellcastingInfo(character, mods, proficiencyBonus),
    attacks: getWeaponAttacks(character, mods, proficiencyBonus),
    hitDice: getHitDicePools(character),
    carryingCapacity: scores.STR * 7.5,
  };
}

export type CharacterStats = ReturnType<typeof computeCharacterStats>;

// ------------------------------------------------------------------
// Competenze: armature, armi, strumenti e lingue
// ------------------------------------------------------------------

export function getProficiencySummary(character: CharacterLike) {
  const classLevels = getClassLevels(character);
  const startingClass = classesData.find(c => c.id === character.classId);
  const armor = new Set<string>(startingClass?.armor || []);
  const weapons = new Set<string>(startingClass?.weapons || []);
  // Multiclasse (PHB 2024): dalle classi successive si ottengono solo alcune competenze
  Object.keys(classLevels).filter(id => id !== character.classId).forEach(id => {
    if (['barbarian', 'fighter', 'paladin', 'ranger'].includes(id)) { armor.add('Leggera'); armor.add('Media'); armor.add('Scudi'); weapons.add('Marziali'); }
    if (['bard', 'rogue', 'warlock'].includes(id)) armor.add('Leggera');
    if (['cleric', 'druid'].includes(id)) { armor.add('Leggera'); armor.add('Media'); armor.add('Scudi'); }
    weapons.add('Semplici');
  });
  if (hasFeat(character, 'Armatura Leggera (Addestramento)')) armor.add('Leggera');
  if (hasFeat(character, 'Armatura Media (Addestramento)')) armor.add('Media');
  if (hasFeat(character, 'Armatura Pesante (Addestramento)')) armor.add('Pesante');
  if (hasFeat(character, 'Addestramento alle Armi Marziali')) weapons.add('Marziali');

  const bgTools = (backgroundsData.find(b => b.id === character.backgroundId)?.tools || []).filter(t => !t.includes('(uno)'));
  const tools = Array.from(new Set([...bgTools, ...getFixedClassTools(classLevels), ...(character.toolProficiencies || [])]));
  const languages = Array.from(new Set([...getFixedLanguages(classLevels), ...(character.languages || [])]));
  return { armor: Array.from(armor), weapons: Array.from(weapons), tools, languages };
}
