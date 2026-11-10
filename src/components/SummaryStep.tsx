import React from 'react';
import { Shield, Heart, Zap, Eye, User, Footprints, ScrollText, Backpack, Languages, Sparkles } from 'lucide-react';
import { useCharacter, CharacterData } from '../contexts/CharacterContext';
import { ABILITIES, ABILITY_NAMES, computeCharacterStats, getProficiencySummary } from '../lib/characterRules';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { formatModifier } from '../lib/utils';
import { signed } from '../lib/dice';
import { Section, StepHeader, Tag } from './ui';

export default function SummaryStep() {
  const { currentCharacter } = useCharacter();
  if (!currentCharacter) return null;

  const charClass = classesData.find(c => c.id === currentCharacter.classId);
  const charSpecies = speciesData.find(s => s.id === currentCharacter.speciesId) as any;
  const charBackground = backgroundsData.find(b => b.id === currentCharacter.backgroundId);
  const lineage = charSpecies?.subOptions?.find((o: any) => o.id === currentCharacter.speciesSubOption)?.name;

  // Anteprima al 1° livello con lo stesso motore di regole della scheda
  const preview: CharacterData = { ...currentCharacter, level: 1, classes: currentCharacter.classId ? { [currentCharacter.classId]: { level: 1 } } : {} };
  const stats = computeCharacterStats(preview);
  const prof = getProficiencySummary(preview);
  const skills = stats.skills.filter(sk => sk.isProficient);

  return (
    <div className="space-y-6">
      <StepHeader eyebrow="Capitolo 7" title="Riepilogo" description="Controlla il personaggio: puoi tornare a qualsiasi capitolo dalla barra in alto. Premi “Crea personaggio” per salvarlo." />

      <section className="hero-band rounded-[var(--radius-lg)] overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="w-24 h-24 shrink-0 bg-black/40 border-2 border-white/20 grid place-items-center overflow-hidden">
            {currentCharacter.portraitUrl ? <img src={currentCharacter.portraitUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User className="w-10 h-10 text-white/40" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-4xl font-black uppercase leading-none">{currentCharacter.name || 'Senza nome'}</h3>
            <p className="text-white/75 mt-1">{charSpecies?.name}{lineage ? ` (${lineage})` : ''} · {charClass?.name} 1 · {charBackground?.name}{currentCharacter.alignment ? ` · ${currentCharacter.alignment}` : ''}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pb-3">
        {ABILITIES.map(ab => (
          <div key={ab} className="ability-tile">
            <div className="text-[10px] font-black uppercase text-text-muted font-serif truncate">{ABILITY_NAMES[ab]}</div>
            <div className="text-3xl font-display font-black my-1">{formatModifier(stats.scores[ab])}</div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 min-w-10 px-2 h-6 grid place-items-center bg-bg border border-border rounded-full text-sm font-bold">{stats.scores[ab]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { Icon: Heart, label: 'Punti Ferita', value: stats.hpMax, sub: `Dado Vita d${charClass?.hitDie || 8}` },
          { Icon: Shield, label: 'Classe Armatura', value: stats.acBase, sub: stats.armorClass.source },
          { Icon: Zap, label: 'Iniziativa', value: signed(stats.initiative) },
          { Icon: Footprints, label: 'Velocità', value: `${stats.speed} m` },
          { Icon: Eye, label: 'Percezione passiva', value: stats.passivePerception },
        ].map(({ Icon, label, value, sub }) => (
          <div key={label} className="stat-chip p-3 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-text-muted font-serif flex items-center justify-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
            <div className="text-3xl font-display font-black">{value}</div>
            {sub && <div className="text-[11px] text-text-muted truncate">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Section title="Competenze" icon={ScrollText} bodyClassName="p-4 space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">{skills.map(s => <Tag key={s.name} tone="accent">{s.name} {signed(s.mod)}</Tag>)}</div>
          <p><span className="text-text-muted">Tiri salvezza:</span> {stats.savingThrows.filter(s => s.isProficient).map(s => ABILITY_NAMES[s.ability]).join(', ')}</p>
          <p><span className="text-text-muted">Armature:</span> {prof.armor.join(', ') || 'nessuna'}</p>
          <p><span className="text-text-muted">Armi:</span> {prof.weapons.join(', ')}</p>
        </Section>

        <Section title="Origine e talenti" icon={Sparkles} bodyClassName="p-4 space-y-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            {currentCharacter.originFeat && <Tag tone="accent">{currentCharacter.originFeat}</Tag>}
            {currentCharacter.bonusOriginFeat && <Tag tone="accent">{currentCharacter.bonusOriginFeat} (Versatile)</Tag>}
          </div>
          <div className="flex flex-wrap gap-1.5">{(charSpecies?.traits || []).map((t: string) => <Tag key={t}>{t}</Tag>)}</div>
          {(currentCharacter.spells || []).length > 0 && <p><span className="text-text-muted">Incantesimi:</span> {currentCharacter.spells.join(', ')}</p>}
        </Section>

        <Section title="Lingue e strumenti" icon={Languages} bodyClassName="p-4 space-y-3 text-sm">
          <p><span className="text-text-muted">Lingue:</span> {prof.languages.join(', ')}</p>
          <p><span className="text-text-muted">Strumenti:</span> {prof.tools.join(', ') || 'nessuno'}</p>
        </Section>
      </div>

      <Section title="Equipaggiamento" icon={Backpack} actions={<Tag tone="accent">{currentCharacter.currency?.gp || 0} mo</Tag>}>
        {(currentCharacter.inventoryItems || []).length ? (
          <div className="flex flex-wrap gap-1.5">
            {currentCharacter.inventoryItems!.map(item => <Tag key={item.id} tone={item.isEquipped ? 'accent' : 'neutral'}>{item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</Tag>)}
          </div>
        ) : <p className="text-sm text-text-muted">Nessun oggetto: avrai solo le monete d’oro.</p>}
      </Section>
    </div>
  );
}
