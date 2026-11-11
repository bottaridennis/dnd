import type { Ability, CharacterData } from '../contexts/CharacterContext';
import { getClassLevels, getFinalScores, getTotalLevel, hasFeat } from './characterRules';
import { classesData } from '../data/rules2024';
import { RAW_SPELLS } from '../data/spells';
import { getSpellMechanics } from './spellCasting';

/** Trucchetti da Warlock conosciuti dal personaggio che infliggono danni (con eventuali requisiti aggiuntivi). */
function hasWarlockDamageCantrip(character: CharacterData, need: { attack?: boolean; minRange?: boolean }): boolean {
  const known = new Set(character.spells || []);
  return (RAW_SPELLS as { name: string; displayName?: string; level: number; classes?: string[]; range?: string; description?: string }[]).some(spell => {
    if (spell.level !== 0 || !spell.classes?.includes('warlock')) return false;
    if (!known.has(spell.displayName || spell.name) && !known.has(spell.name)) return false;
    const mech = getSpellMechanics(spell);
    if (mech.effect?.kind !== 'damage') return false;
    if (need.attack && !mech.attack) return false;
    // "gittata di 3+ metri": esclusi gli incantesimi a contatto o centrati su di sé
    if (need.minRange && !/metri|chilometri/.test(spell.range || '')) return false;
    return true;
  });
}

const ABILITY_WORDS: Record<string, Ability> = {
  forza: 'STR', destrezza: 'DEX', costituzione: 'CON', intelligenza: 'INT', saggezza: 'WIS', carisma: 'CHA',
};

export interface Eligibility { ok: boolean; reasons: string[] }

/** Valuta i prerequisiti testuali dei talenti PHB 2024 (es. "Talento Generale (Prerequisito: livello 4+, Forza 13+)"). */
export function checkFeatPrerequisites(prerequisite: string | undefined, character: CharacterData): Eligibility {
  if (!prerequisite) return { ok: true, reasons: [] };
  const text = prerequisite.toLocaleLowerCase('it');
  const reasons: string[] = [];
  const level = getTotalLevel(character);
  const scores = getFinalScores(character);
  const classLevels = getClassLevels(character);

  const levelMatch = text.match(/livello (\d+)\+/);
  if (levelMatch && level < Number(levelMatch[1])) reasons.push(`Richiede livello ${levelMatch[1]}+`);

  // Requisiti di caratteristica: "Forza o Destrezza 13+", "Intelligenza, Saggezza o Carisma 13+"
  const abilityMatch = text.match(/((?:forza|destrezza|costituzione|intelligenza|saggezza|carisma)(?:(?:,\s*| o )(?:forza|destrezza|costituzione|intelligenza|saggezza|carisma))*) (\d+)\+/);
  if (abilityMatch) {
    const abilities = abilityMatch[1].split(/,\s*| o /).map(word => ABILITY_WORDS[word.trim()]).filter(Boolean);
    const min = Number(abilityMatch[2]);
    if (!abilities.some(a => scores[a] >= min)) reasons.push(`Richiede ${abilityMatch[1]} ${min}+`);
  }

  if (text.includes('stile di combattimento')) {
    const hasStyle = (classLevels.fighter?.level || 0) >= 1 || (classLevels.paladin?.level || 0) >= 2 || (classLevels.ranger?.level || 0) >= 2;
    if (!hasStyle) reasons.push('Richiede il privilegio Stile di Combattimento');
  }

  if (text.includes('capacità incantesimi') || text.includes('magia del patto')) {
    const isCaster = Object.keys(classLevels).some(id => classesData.find(c => c.id === id)?.spellcastingAbility)
      || /cavaliere arcano|mistificatore arcano/i.test(Object.values(classLevels).map(c => c.subclass).join(' '));
    if (!isCaster) reasons.push('Richiede la capacità Incantesimi o Magia del Patto');
  }

  const trainingChecks: [string, string, string][] = [
    ['armatura leggera', 'Leggera', 'Armatura Leggera (Addestramento)'],
    ['armatura media', 'Media', 'Armatura Media (Addestramento)'],
    ['armatura pesante', 'Pesante', 'Armatura Pesante (Addestramento)'],
    ['scudo', 'Scudi', ''],
  ];
  trainingChecks.forEach(([needle, key, feat]) => {
    if (!text.includes(`addestramento ${needle}`) && !text.includes(`addestramento allo ${needle}`)) return;
    const trained = Object.keys(classLevels).some(id => classesData.find(c => c.id === id)?.armor.includes(key)) || (feat && hasFeat(character, feat));
    if (!trained) reasons.push(`Richiede addestramento: ${needle}`);
  });

  return { ok: reasons.length === 0, reasons };
}

/** Prerequisiti delle Suppliche Occulte (es. "Prerequisito: Warlock di livello 5+, invocazione Patto della Lama"). */
export function checkInvocationPrerequisites(prerequisite: string | undefined, character: CharacterData): Eligibility {
  const warlockLevel = getClassLevels(character).warlock?.level || 0;
  const reasons: string[] = [];
  if (warlockLevel === 0) reasons.push('Richiede livelli da Warlock');
  const text = (prerequisite || '').replace(/\s+/g, ' ');
  const levelMatch = text.match(/Warlock di livello (\d+)\+/);
  if (levelMatch && warlockLevel < Number(levelMatch[1])) reasons.push(`Richiede Warlock di livello ${levelMatch[1]}+`);
  if (/trucchetto da Warlock che infligge danni/i.test(text)) {
    const attack = /tiro per colpire/i.test(text);
    const minRange = /gittata di 3\+ metri/i.test(text);
    if (!hasWarlockDamageCantrip(character, { attack, minRange })) {
      reasons.push(attack ? 'Richiede un trucchetto da Warlock che infligge danni con tiro per colpire' : minRange ? 'Richiede un trucchetto da Warlock che infligge danni con gittata di almeno 3 metri' : 'Richiede un trucchetto da Warlock che infligge danni');
    }
  }
  const invMatch = text.match(/invocazione ([^,]+)/);
  if (invMatch && !(character.invocations || []).some(i => i.toLocaleLowerCase('it') === invMatch[1].trim().toLocaleLowerCase('it'))) {
    reasons.push(`Richiede la supplica ${invMatch[1].trim()}`);
  }
  return { ok: reasons.length === 0, reasons };
}
