import { useMemo, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { BookOpen, Check, Filter, Search, Sparkles, Star, WandSparkles } from 'lucide-react';
import { useHomebrew } from '../hooks/useHomebrew';
import { INVOCATIONS } from '../data/invocations';
import { fixTextEncoding } from '../lib/utils';
import { StepHeader, Counter, ToggleChip, OptionCard, Tag, EmptyState } from './ui';
import { canCharacterUseSpell, CLASS_LABELS, getAvailableSpellLevels, getCharacterClassLevels, SCHOOL_LABELS } from '../lib/spellEligibility';
import { checkFeatPrerequisites, checkInvocationPrerequisites } from '../lib/featEligibility';
import { getSpellBudget } from '../lib/spellBudget';
import { getFeatBudget, getInvocationBudget } from '../lib/featBudget';

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

  const budget = useMemo(() => currentCharacter ? getSpellBudget(currentCharacter, homebrew.spells) : null, [currentCharacter, homebrew.spells]);

  /** Ammesso dal manuale (lista di classe e livello), indipendentemente dai limiti numerici */
  const isCompatible = (item: any) => {
    if (!currentCharacter) return false;
    if (tab === 'incantesimi') return budget ? budget.check(item).eligible : canCharacterUseSpell(item, currentCharacter);
    if (tab === 'talenti') return getFeatBudget(currentCharacter, homebrew.feats).check(item).eligible;
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
      .filter(item => showAllSpells || isCompatible(item) || selected.has(item.name))
      .filter(item => tab !== 'incantesimi' || levelFilter === 'all' || item.level === levelFilter)
      .filter(item => !onlySelected || selected.has(item.name))
      .sort((a, b) => tab === 'incantesimi' ? (a.level ?? 0) - (b.level ?? 0) || (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it') : (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCharacter, budget, homebrew.spells, homebrew.feats, tab, search, showAllSpells, levelFilter, onlySelected]);

  if (!currentCharacter) return null;

  const spellBudget = budget!;
  const invocationBudget = getInvocationBudget(currentCharacter, INVOCATIONS);
  const featBudget = getFeatBudget(currentCharacter, homebrew.feats);
  const isWarlock = Boolean(getCharacterClassLevels(currentCharacter).warlock);
  const listName = tab === 'incantesimi' ? 'spells' : tab === 'talenti' ? 'feats' : 'invocations';
  const currentList: string[] = (currentCharacter as any)[listName] || [];

  /** Può essere aggiunto ora? Gli elementi già scelti si possono sempre togliere. */
  const availability = (item: any): { ok: boolean; reason?: string } => {
    if (currentList.includes(item.name)) return { ok: true };
    if (tab === 'incantesimi') return spellBudget.check(item);
    if (tab === 'talenti') return featBudget.check(item);
    return invocationBudget.check(item);
  };

  const toggleSelection = (item: any) => {
    const isSelected = currentList.includes(item.name);
    if (!isSelected && !availability(item).ok) return;
    dispatch({ type:'UPDATE_CHARACTER', payload:{ [listName]:isSelected ? currentList.filter(name => name !== item.name) : [...currentList, item.name] } });
  };
  const excess = new Set(tab === 'incantesimi' ? spellBudget.excess : tab === 'talenti' ? featBudget.excess : invocationBudget.excess);
  const featSlots = featBudget.slots;

  const tabs = ([['incantesimi', 'Incantesimi'], ['talenti', 'Talenti'], ...(isWarlock ? [['invocazioni', 'Suppliche Occulte']] : [])] as [LibraryTab, string][]);

  return (
    <div className="space-y-6">
      <StepHeader
        eyebrow="Capitolo 5"
        title="Magie e talenti"
        description={casterClasses.length ? `Scegli trucchetti e incantesimi preparati dalla lista: ${casterClasses.map(id => `${CLASS_LABELS[id]} ${classLevels[id]}`).join(' · ')}.` : 'La tua classe non lancia incantesimi al 1° livello: puoi passare oltre o consultare i talenti.'}
        aside={<div className="flex flex-wrap gap-2">
          {spellBudget.cantrips.max > 0 && <Counter value={spellBudget.cantrips.used} max={spellBudget.cantrips.max} label="trucchetti" />}
          {spellBudget.leveled.max > 0 && <Counter value={spellBudget.leveled.used} max={spellBudget.leveled.max} label="preparati" />}
          {featSlots.style.max > 0 && <Counter value={featSlots.style.used} max={featSlots.style.max} label="stili" />}
          {isWarlock && <Counter value={invocationBudget.used} max={invocationBudget.max} label="suppliche" />}
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
        <ToggleChip selected={showAllSpells} onClick={() => setShowAllSpells(v => !v)}><Filter className="w-3.5 h-3.5" /> Mostra non ammessi</ToggleChip>
      </div>
      {tab === 'incantesimi' && spellBudget.pools.length > 0 && (
        <div className="text-xs text-text-muted flex flex-wrap gap-x-4 gap-y-1">
          {spellBudget.pools.map(pool => (
            <span key={pool.id} className={pool.used >= pool.capacity ? 'text-accent' : ''}>
              {pool.label}: {pool.kind === 'cantrip' ? 'trucchetti' : `incantesimi fino al ${pool.maxLevel}° livello`} {pool.used}/{pool.capacity}
            </span>
          ))}
        </div>
      )}
      {tab === 'incantesimi' && spellBudget.excess.length > 0 && (
        <p className="text-sm text-danger border border-danger/40 bg-danger/10 px-3 py-2">
          Hai scelto più incantesimi di quanti ne consenta il manuale o alcuni non sono più ammessi: rimuovi {spellBudget.excess.length === 1 ? 'quello evidenziato' : `i ${spellBudget.excess.length} evidenziati`} per continuare.
        </p>
      )}
      {tab === 'talenti' && <p className="text-sm text-text-muted">Al 1° livello ottieni solo il Talento d’Origine del background{currentCharacter.bonusOriginFeat ? ' e quello del tratto Versatile' : ''}{featSlots.style.max > 0 ? `, più ${featSlots.style.max === 1 ? 'un talento' : `${featSlots.style.max} talenti`} Stile di Combattimento da scegliere qui (${featSlots.style.used}/${featSlots.style.max})` : ''}: gli altri talenti arrivano salendo di livello.</p>}
      {tab !== 'incantesimi' && excess.size > 0 && (
        <p className="text-sm text-danger border border-danger/40 bg-danger/10 px-3 py-2">
          {tab === 'talenti' ? 'Hai più talenti di quanti ne consenta il manuale o alcuni non rispettano più i prerequisiti' : 'Hai più suppliche di quante ne consenta il manuale o alcune non rispettano più i prerequisiti'}: rimuovi {excess.size === 1 ? 'la scelta evidenziata' : `le ${excess.size} scelte evidenziate`} per continuare.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredData.map((item: any, idx: number) => {
          const isSelected = currentList.includes(item.name);
          const check = availability(item);
          const isExcess = excess.has(item.name);
          return (
            <OptionCard
              key={item.name + idx}
              selected={isSelected}
              disabled={!check.ok}
              onClick={() => toggleSelection(item)}
              title={item.displayName || item.name}
              subtitle={item.level !== undefined ? `${item.level === 0 ? 'Trucchetto' : `Livello ${item.level}`} · ${SCHOOL_LABELS[item.school] || item.school || ''}` : item.prerequisite}
              meta={<>
                {item.concentration && <Tag tone="accent">Concentrazione</Tag>}
                {item.ritual && <Tag>Rituale</Tag>}
                {isExcess && <Tag tone="danger">In eccesso: tocca per rimuovere</Tag>}
                {!check.ok && check.reason && <Tag tone="danger">{check.reason}</Tag>}
              </>}
            >
              <span className="line-clamp-3 block" dangerouslySetInnerHTML={{ __html: fixTextEncoding(item.description || 'Contenuto personalizzato.') }} />
            </OptionCard>
          );
        })}
        {filteredData.length === 0 && <div className="col-span-full"><EmptyState icon={BookOpen} title="Nessun risultato">Prova a cambiare filtro o a mostrare anche gli elementi non ammessi.</EmptyState></div>}
      </div>
    </div>
  );
}
