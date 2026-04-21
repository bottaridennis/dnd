
import { useCharacter } from '../contexts/CharacterContext';
import { SUMMONS_DATA, SummonTemplate } from '../data/summons';
import { ActiveSummon } from '../types/summons';
import { characterService } from '../services/characterService';
import { v4 as uuidv4 } from 'uuid';

export function useSummons() {
  const { currentCharacter, dispatch } = useCharacter();

  const summonCreature = async (
    templateId: string, 
    spellLevel: number = 0, 
    playerStats: { spellAttackModifier: number }
  ) => {
    if (!currentCharacter) return;

    const template = SUMMONS_DATA.find(s => s.id === templateId);
    if (!template) return;

    let maxHp = template.hp || 1;
    let ac = template.ac || 10;
    let attackBonus = 0;
    let damageBonus = 0;

    // Handle Scaling
    if (template.category === 'Scaling') {
      if (template.hpFormula) maxHp = template.hpFormula(spellLevel);
      if (template.acFormula) ac = template.acFormula(spellLevel);
      if (template.attackFormula) attackBonus = template.attackFormula(playerStats.spellAttackModifier);
      if (template.damageBonusFormula) damageBonus = template.damageBonusFormula(spellLevel);
    } else if (template.category === 'Pact' || template.category === 'Basic') {
      // Basic/Pact usually have fixed stats but attack might scale with proficiency or fixed
      // For simplicity, we use what's in the template or generic
      attackBonus = 0; // Fixed in description usually
    }

    // Process Actions with calculated bonuses
    const processedActions = (template.actions || []).map(action => {
      let desc = action.desc;
      desc = desc.replace('{attack}', attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`);
      desc = desc.replace('{damageBonus}', `${damageBonus}`);
      return { ...action, desc };
    });

    const newSummon: ActiveSummon = {
      instanceId: uuidv4(),
      templateId: template.id,
      name: template.name,
      category: template.category,
      spellLevel,
      currentHp: maxHp,
      maxHp,
      ac,
      attackBonus,
      damageBonus,
      speed: template.speed,
      str: template.str,
      dex: template.dex,
      con: template.con,
      int: template.int,
      wis: template.wis,
      cha: template.cha,
      actions: processedActions,
      traits: template.traits || [],
      iconName: template.icon.name || 'Dog'
    };

    const updatedSummons = [...(currentCharacter.activeSummons || []), newSummon];
    
    dispatch({ type: 'UPDATE_CHARACTER', payload: { activeSummons: updatedSummons } });
    await characterService.updateCharacter(currentCharacter.id, { activeSummons: updatedSummons });
  };

  const summonHomebrew = async (data: Partial<ActiveSummon>) => {
    if (!currentCharacter) return;
    const newSummon: ActiveSummon = {
      instanceId: uuidv4(),
      templateId: 'homebrew',
      name: data.name || 'Homebrew Familiar',
      category: 'Homebrew',
      spellLevel: 0,
      currentHp: data.maxHp || 1,
      maxHp: data.maxHp || 1,
      ac: data.ac || 10,
      attackBonus: 0,
      damageBonus: 0,
      speed: data.speed || '9m',
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      actions: data.actions || [{ name: 'Azione Custom', desc: 'Definita dal DM' }],
      traits: data.traits || [],
      iconName: 'Dog',
      ...data
    };
    const updatedSummons = [...(currentCharacter.activeSummons || []), newSummon];
    dispatch({ type: 'UPDATE_CHARACTER', payload: { activeSummons: updatedSummons } });
    await characterService.updateCharacter(currentCharacter.id, { activeSummons: updatedSummons });
  };

  const dismissSummon = async (instanceId: string) => {
    if (!currentCharacter) return;

    const updatedSummons = (currentCharacter.activeSummons || []).filter(s => s.instanceId !== instanceId);
    
    dispatch({ type: 'UPDATE_CHARACTER', payload: { activeSummons: updatedSummons } });
    await characterService.updateCharacter(currentCharacter.id, { activeSummons: updatedSummons });
  };

  const updateSummonHp = async (instanceId: string, newHp: number) => {
    if (!currentCharacter) return;

    const updatedSummons = (currentCharacter.activeSummons || []).map(s => 
      s.instanceId === instanceId ? { ...s, currentHp: Math.max(0, Math.min(s.maxHp, newHp)) } : s
    );
    
    dispatch({ type: 'UPDATE_CHARACTER', payload: { activeSummons: updatedSummons } });
    await characterService.updateCharacter(currentCharacter.id, { activeSummons: updatedSummons });
  };

  return {
    activeSummons: currentCharacter?.activeSummons || [],
    summonCreature,
    summonHomebrew,
    dismissSummon,
    updateSummonHp
  };
}
