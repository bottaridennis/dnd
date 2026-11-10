import { useMemo, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { BookOpen, Check, Filter, Search, Sparkles, Star, WandSparkles } from 'lucide-react';
import { useHomebrew } from '../hooks/useHomebrew';
import { INVOCATIONS } from '../data/invocations';
import { fixTextEncoding } from '../lib/utils';
import { StepHeader, Counter, ToggleChip, OptionCard, Tag, EmptyState } from './ui';
import { canCharacterUseSpell, CLASS_LABELS, getAvailableSpellLevels, getCharacterClassLevels, SCHOOL_LABELS, type SpellLike } from '../lib/spellEligibility';
import { checkFeatPrerequisites, checkInvocationPrerequisites } from '../lib/featEligibility';
import { computeCharacterStats, getInvocationsKnown } from '../lib/characterRules';

type LibraryTab = 'incantesimi' | 'talenti' | 'invocazioni';

export default function SpellsFeatsStep() {
  const { currentCharacter, dispatch } = useCharacter();
  const homebrew = useHomebrew();
  const [tab, setTab] = useState<LibraryTab>('incantesimi');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | number>('all');
  const [showAllSpells, setShowAllSpells] = useState(false);
  const [onlySelected, setOnlySelected] = useState(false);

  const classLevels = currentCharacter ? getCharacterClassLevels(currentCharacter) : {};
  const casterClasses = Object.keys(classLevels).filter(id => id in CLASS_LABELS);
  const availableLevels = currentCharacter ? getAvailableSpellLevels(currentCharacter) : [0];

  const isCompatible = (item: any) => {
    if (!currentCharacter) return false;
    if (tab === 'incantesimi') return canCharacterUseSpell(item, currentCharacter);
    if (tab === 'talenti') return checkFeatPrerequisites(item.prerequisite, currentCharacter).ok;
    return checkInvocationPrerequisites(item.prerequisite, currentCharacter).ok;
  };

  const filteredData = useMemo(() => {
    if (!currentCharacter) return [];
    let base: any[] = tab === 'incantesimi' ? homebrew.spells : tab === 'talenti' ? homebrew.feats : INVOCATIONS;
    const listName = tab === 'incantesimi' ? 'spells' : tab === 'talenti' ? 'feats' : 'invocations';
    const selected = new Set((currentCharacter as any)[listName] || []);
    const needle = search.trim().toLocaleLowerCase('it');

    return base
      .filter(item => !needle || item.name?.toLocaleLowerCase('it').includes(needle) || item.displayName?.toLocaleLowerCase('it').includes(needle) || item.school?.toLocaleLowerCase('it').includes(needle))
      .filter(item => showAllSpells || isCompatible(item))
      .filter(item => tab !== 'incantesimi' || levelFilter === 'all' || item.level === levelFilter)
      .filter(item => !onlySelected || selected.has(item.name))
      .sort((a, b) => tab === 'incantesimi' ? (a.level ?? 0) - (b.level ?? 0) || (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it') : (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCharacter, homebrew.spells, homebrew.feats, tab, search, showAllSpells, levelFilter, onlySelected]);

  if (!currentCharacter) return null;

  const stats = computeCharacterStats(currentCharacter);
  const selectedSpells = (currentCharacter.spells || []).map(name => homebrew.spells.find(s => s.name === name));
  const cantripCount = selectedSpells.filter(s => s?.level === 0).length;
  const leveledCount = selectedSpells.filter(s => (s?.level ?? 1) > 0).length;
  const maxCantrips = stats.spellcasting.reduce((acc, c) => acc + c.cantrips, 0);
  const maxPrepared = stats.spellcasting.reduce((acc, c) => acc + c.prepared, 0);
  const isWarlock = Boolean(getCharacterClassLevels(currentCharacter).warlock);
  const listName = tab === 'incantesimi' ? 'spells' : tab === 'talenti' ? 'feats' : 'invocations';
  const currentList: string[] = (currentCharacter as any)[listName] || [];
  const toggleSelection = (item: any) => {
    const isSelected = currentList.includes(item.name);
    dispatch({ type:'UPDATE_CHARACTER', payload:{ [listName]:isSelected ? currentList.filter(name => name !== item.name) : [...currentList, item.name] } });
  };

  const tabs = ([['incantesimi', 'Incantesimi'], ['talenti', 'Talenti'], ...(isWarlock ? [['invocazioni', 'Suppliche Occulte']] : [])] as [LibraryTab, string][]);

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Capitolo 5"
        title="Magie e talenti"
        description={casterClasses.length ? `Scegli trucchetti e incantesimi preparati dalla lista: ${casterClasses.map(id => `${CLASS_LABELS[id]} ${classLevels[id]}`).join(' · ')}.` : 'La tua classe non lancia incantesimi al 1° livello: puoi passare oltre o consultare i talenti.'}
        aside={<div className="flex flex-wrap gap-2">
          {stats.spellcasting.length > 0 && <Counter value={cantripCount} max={maxCantrips} label="trucchetti" />}
          {stats.spellcasting.length > 0 && <Counter value={leveledCount} max={maxPrepared} label="preparati" />}
          {isWarlock && <Counter value={(currentCharacter.invocations || []).length} max={getInvocationsKnown(currentCharacter)} label="suppliche" />}
        </div>}
      />

      <div className="flex border-b border-border overflow-x-auto no-scrollbar" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setLevelFilter('all'); }}
            className={`relative px-4 py-3 text-sm font-black uppercase tracking-wider font-serif whitespace-nowrap ${tab === id ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}>
            {label}
            {tab === id && <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-accent" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <label className="field-shell flex-1"><Search className="w-4 h-4 text-text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome o scuola" className="w-full bg-transparent py-2.5 outline-none" aria-label="Cerca" /></label>
        {tab === 'incantesimi' && (
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="field-shell py-2.5 text-sm" aria-label="Filtra per livello">
            <option value="all">Tutti i livelli</option>
            {availableLevels.map(level => <option key={level} value={level}>{level === 0 ? 'Trucchetti' : `Livello ${level}`}</option>)}
          </select>
        )}
        <ToggleChip selected={onlySelected} onClick={() => setOnlySelected(v => !v)}>Solo scelti</ToggleChip>
        <ToggleChip selected={showAllSpells} onClick={() => setShowAllSpells(v => !v)}><Filter className="w-3.5 h-3.5" /> Anche non disponibili</ToggleChip>
      </div>
      {tab === 'talenti' && <p className="text-sm text-text-muted">Al 1° livello ottieni solo il Talento d’Origine del background{currentCharacter.bonusOriginFeat ? ' e quello del tratto Versatile' : ''}: gli altri talenti arrivano salendo di livello.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredData.map((item: any, idx: number) => {
          const isSelected = currentList.includes(item.name);
          const compatible = isCompatible(item as SpellLike);
          const reasons = compatible ? [] : tab === 'incantesimi' ? ['Non disponibile per classe o livello'] : (tab === 'talenti' ? checkFeatPrerequisites(item.prerequisite, currentCharacter) : checkInvocationPrerequisites(item.prerequisite, currentCharacter)).reasons;
          return (
            <OptionCard
              key={item.name + idx}
              selected={isSelected}
              disabled={!compatible && !isSelected}
              onClick={() => toggleSelection(item)}
              title={item.displayName || item.name}
              subtitle={item.level !== undefined ? `${item.level === 0 ? 'Trucchetto' : `Livello ${item.level}`} · ${SCHOOL_LABELS[item.school] || item.school || ''}` : item.prerequisite}
              meta={<>
                {item.concentration && <Tag tone="accent">Concentrazione</Tag>}
                {item.ritual && <Tag>Rituale</Tag>}
                {!compatible && <Tag tone="danger">{reasons.join(' · ')}</Tag>}
              </>}
            >
              <span className="line-clamp-3 block" dangerouslySetInnerHTML={{ __html: fixTextEncoding(item.description || 'Contenuto personalizzato.') }} />
            </OptionCard>
          );
        })}
        {filteredData.length === 0 && <div className="col-span-full"><EmptyState icon={BookOpen} title="Nessun risultato">Prova a cambiare filtro o a mostrare anche gli elementi non disponibili.</EmptyState></div>}
      </div>
    </div>
  );
}
