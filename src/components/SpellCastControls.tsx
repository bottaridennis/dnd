import React, { useState } from 'react';
import { Sparkles, Crosshair, Flame, BookOpen } from 'lucide-react';
import { useCharacter } from '../contexts/CharacterContext';
import { useDice } from '../contexts/DiceContext';
import { useResourceTracker } from '../hooks/useResourceTracker';
import { characterService } from '../services/characterService';
import type { CharacterStats } from '../lib/characterRules';
import { ABILITY_SAVE_LABEL, getEffectFormula, getSpellMechanics } from '../lib/spellCasting';
import { signed } from '../lib/dice';

interface Props {
  spellName: string;
  spell: any;
  stats: CharacterStats;
}

/** Controlli per lanciare un incantesimo: scelta dello slot, Concentrazione e tiri automatici. */
export default function SpellCastControls({ spellName, spell, stats }: Props) {
  const { currentCharacter, dispatch } = useCharacter();
  const { rollCheck, rollDamage, addNote } = useDice();
  const { maxResources, currentResources, expendSpellSlot, expendPactSlot } = useResourceTracker();
  const [choosing, setChoosing] = useState(false);

  if (!currentCharacter || !spell) return null;
  const level: number = spell.level ?? 0;
  const label = spell.displayName || spell.name || spellName;
  const mechanics = getSpellMechanics(spell);

  // Usa la classe incantatrice che possiede l'incantesimo (o la migliore disponibile)
  const casting = stats.spellcasting.find(c => (spell.classes || []).includes(c.classId))
    || [...stats.spellcasting].sort((a, b) => b.attackBonus - a.attackBonus)[0];
  const attackBonus = casting?.attackBonus ?? stats.proficiencyBonus;
  const saveDc = casting?.saveDc ?? 8 + stats.proficiencyBonus;
  const spellMod = casting ? stats.mods[casting.ability] : 0;

  const slotOptions: { key: string; label: string; slotLevel: number; spend: () => void }[] = [];
  if (level > 0) {
    maxResources.spellSlots.forEach((max, idx) => {
      const slotLevel = idx + 1;
      const left = max - (currentResources.spentSpellSlots[slotLevel] || 0);
      if (slotLevel >= level && left > 0) slotOptions.push({ key: `s${slotLevel}`, label: `${slotLevel}° (${left})`, slotLevel, spend: () => expendSpellSlot(slotLevel) });
    });
    const pactLeft = maxResources.pactMagic.count - currentResources.spentPactSlots;
    if (maxResources.pactMagic.level >= level && pactLeft > 0) {
      slotOptions.push({ key: 'pact', label: `Patto ${maxResources.pactMagic.level}° (${pactLeft})`, slotLevel: maxResources.pactMagic.level, spend: expendPactSlot });
    }
  }

  const resolveEffect = (slotLevel?: number) => {
    const effect = getEffectFormula(spell, { slotLevel, characterLevel: stats.level, spellMod });
    if (!effect) return;
    if (mechanics.attack) {
      rollCheck(`${label}: tiro per colpire`, attackBonus, { followUp: { label: `${label}: ${effect.label}`, formula: effect.formula } });
    } else {
      rollDamage(`${label}: ${effect.label}${mechanics.save ? ` · TS ${ABILITY_SAVE_LABEL[mechanics.save]} CD ${saveDc}` : ''}`, effect.formula);
    }
  };

  const cast = (option?: { slotLevel: number; spend: () => void; label: string }, ritual = false) => {
    option?.spend();
    setChoosing(false);
    const notes: string[] = [];
    if (option) notes.push(`slot di ${option.slotLevel}° livello`);
    if (ritual) notes.push('come rituale (+10 minuti, nessuno slot)');
    if (mechanics.save) notes.push(`TS ${ABILITY_SAVE_LABEL[mechanics.save]} CD ${saveDc}`);
    if (spell.concentration) {
      const previous = currentCharacter.concentratingOn;
      if (previous && previous !== label) notes.push(`termina la Concentrazione su ${previous}`);
      notes.push('Concentrazione');
      dispatch({ type: 'UPDATE_CHARACTER', payload: { concentratingOn: label } });
      characterService.updateCharacter(currentCharacter.id, { concentratingOn: label }).catch(err => console.error(err));
    }
    addNote(`Lanci ${label}`, notes.join(' · ') || (level === 0 ? 'Trucchetto' : ''));
    if (mechanics.effect) resolveEffect(option?.slotLevel ?? (level || undefined));
    else if (mechanics.attack) rollCheck(`${label}: tiro per colpire`, attackBonus);
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex flex-wrap gap-1.5 text-[9px] uppercase font-bold tracking-wider">
        {mechanics.attack && <span className="px-1.5 py-0.5 border border-gold/60">Attacco {signed(attackBonus)}</span>}
        {mechanics.save && <span className="px-1.5 py-0.5 border border-gold/60">TS {ABILITY_SAVE_LABEL[mechanics.save]} CD {saveDc}</span>}
        {mechanics.effect && <span className="px-1.5 py-0.5 border border-gold/60">{getEffectFormula(spell, { characterLevel: stats.level, spellMod })?.formula}{mechanics.effect.kind === 'healing' ? ' cura' : ` ${mechanics.effect.damageType || ''}`}</span>}
        {spell.concentration && <span className="px-1.5 py-0.5 border border-accent/60 text-accent">Concentrazione</span>}
      </div>

      {!choosing ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => (level === 0 ? cast() : setChoosing(true))}
            disabled={level > 0 && slotOptions.length === 0 && !spell.ritual}
            className="secondary-action !py-1 !px-2.5 flex items-center gap-1 disabled:opacity-40"
            title={level > 0 && slotOptions.length === 0 ? 'Nessuno slot disponibile' : undefined}
          >
            <Sparkles className="w-3 h-3" /> Lancia
          </button>
          {mechanics.attack && (
            <button onClick={() => rollCheck(`${label}: tiro per colpire`, attackBonus)} className="secondary-action !py-1 !px-2.5 flex items-center gap-1"><Crosshair className="w-3 h-3" /> Colpire</button>
          )}
          {mechanics.effect && (
            <button onClick={() => resolveEffect(level || undefined)} className="secondary-action !py-1 !px-2.5 flex items-center gap-1"><Flame className="w-3 h-3" /> {mechanics.effect.kind === 'healing' ? 'Cura' : 'Danni'}</button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5 p-2 border border-accent/50 bg-bg">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-1">Slot:</span>
          {slotOptions.map(opt => (
            <button key={opt.key} onClick={() => cast(opt)} className="px-2 py-1 border border-gold text-[11px] font-bold hover:bg-accent hover:text-bg">{opt.label}</button>
          ))}
          {spell.ritual && (
            <button onClick={() => cast(undefined, true)} className="px-2 py-1 border border-gold text-[11px] font-bold hover:bg-accent hover:text-bg flex items-center gap-1"><BookOpen className="w-3 h-3" /> Rituale</button>
          )}
          {slotOptions.length === 0 && !spell.ritual && <span className="text-[11px] text-danger">Nessuno slot disponibile</span>}
          <button onClick={() => setChoosing(false)} className="ml-auto text-[10px] uppercase font-bold text-text-muted hover:text-accent">Annulla</button>
        </div>
      )}
    </div>
  );
}
