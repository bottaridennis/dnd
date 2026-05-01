import { useMemo } from 'react';
import { CharacterData } from '../contexts/CharacterContext';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { getModifier } from '../lib/utils';

export function useCharacterMath(character: CharacterData | null) {
  return useMemo(() => {
    if (!character) return null;

    const charClass = classesData.find(c => c.id === character.classId);
    const charSpecies = speciesData.find(s => s.id === character.speciesId);

    // Calculate Proficiency Bonus based on Level
    const baseProficiency = Math.floor((character.level - 1) / 4) + 2;
    const proficiencyBonus = character.proficiencyOverride !== undefined ? character.proficiencyOverride : baseProficiency;

    // Helper to get final ability score including background boosts
    const getFinalScore = (ability: string) => {
      let score = (character.abilityScores as any)[ability] || 8;
      const boostIndex = character.selectedBoosts.indexOf(ability as any);
      
      if (boostIndex !== -1) {
        if (character.selectedBoosts.length === 3) {
          // 1/1/1 split
          score += 1;
        } else {
          // 2/1 split
          score += (boostIndex === 0 ? 2 : 1);
        }
      }
      return score;
    };

    const scores = {
      STR: getFinalScore('STR'),
      DEX: getFinalScore('DEX'),
      CON: getFinalScore('CON'),
      INT: getFinalScore('INT'),
      WIS: getFinalScore('WIS'),
      CHA: getFinalScore('CHA'),
    };

    const mods = {
      STR: getModifier(scores.STR),
      DEX: getModifier(scores.DEX),
      CON: getModifier(scores.CON),
      INT: getModifier(scores.INT),
      WIS: getModifier(scores.WIS),
      CHA: getModifier(scores.CHA),
    };

    // HP calculation (2024)
    // Level 1: Max Hit Die + CON mod
    // Level 2+: Average Hit Die + CON mod per level
    const hitDie = charClass?.hitDie || 8;
    const avgHitDie = Math.floor(hitDie / 2) + 1;
    const hpMax = hitDie + mods.CON + (character.level - 1) * (avgHitDie + mods.CON);

    // AC
    const baseAc = 10 + mods.DEX;
    const acBase = character.acOverride !== undefined ? character.acOverride : baseAc;

    // Initiative
    const initiative = mods.DEX;

    // Exhaustion (2024)
    const exhaustionLevel = character.exhaustion || 0;
    const exhaustionSpeedPenalty = exhaustionLevel * 1.5;
    const d20Penalty = exhaustionLevel * 2;

    // Speed
    const baseSpeed = charSpecies?.speed || 30;
    const rawSpeed = character.speedOverride !== undefined ? character.speedOverride : baseSpeed;
    const speed = Math.max(0, rawSpeed - exhaustionSpeedPenalty);

    // Darkvision
    const baseDarkvision = charSpecies?.darkvision || 0;
    const darkvision = character.darkvisionOverride !== undefined ? character.darkvisionOverride : baseDarkvision;

    // Passive Perception
    // Assume Perception is Wisdom-based. In 2024 it's 10 + Perception check modifier
    const bgData = backgroundsData.find(b => b.id === character.backgroundId);
    const bgSkills = bgData?.skills || [];
    const allProficiencies = Array.from(new Set([...(character.proficientSkills || []), ...bgSkills]));
    
    const IsPerceptionProficient = allProficiencies.includes('Percezione');
    const perceptionMod = mods.WIS + (IsPerceptionProficient ? proficiencyBonus : 0);
    const passivePerception = 10 + perceptionMod;

    // Skill List and Modifiers
    const skills = [
      { name: 'Acrobazia', ability: 'DEX' },
      { name: 'Addestrare Animali', ability: 'WIS' },
      { name: 'Arcano', ability: 'INT' },
      { name: 'Atletica', ability: 'STR' },
      { name: 'Furtività', ability: 'DEX' },
      { name: 'Indagare', ability: 'INT' },
      { name: 'Inganno', ability: 'CHA' },
      { name: 'Intimidire', ability: 'CHA' },
      { name: 'Intrattenimento', ability: 'CHA' },
      { name: 'Intuizione', ability: 'WIS' },
      { name: 'Medicina', ability: 'WIS' },
      { name: 'Natura', ability: 'INT' },
      { name: 'Percezione', ability: 'WIS' },
      { name: 'Persuasione', ability: 'CHA' },
      { name: 'Rapidità di Mano', ability: 'DEX' },
      { name: 'Religione', ability: 'INT' },
      { name: 'Sopravvivenza', ability: 'WIS' },
      { name: 'Storia', ability: 'INT' }
    ].map(skill => {
      const isProficient = allProficiencies.includes(skill.name);
      const mod = mods[skill.ability as keyof typeof mods] + (isProficient ? proficiencyBonus : 0);
      return { ...skill, isProficient, mod };
    });

    return {
      scores,
      mods,
      hpMax,
      acBase,
      initiative,
      speed,
      darkvision,
      passivePerception,
      proficiencyBonus,
      d20Penalty,
      exhaustionLevel,
      skills
    };
  }, [character]);
}
