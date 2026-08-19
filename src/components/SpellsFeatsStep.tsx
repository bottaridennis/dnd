import { useMemo, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { BookOpen, Check, Filter, Search, Sparkles, Star, WandSparkles } from 'lucide-react';
import { useHomebrew } from '../hooks/useHomebrew';
import { INVOCATIONS } from '../data/invocations';
import { fixTextEncoding } from '../lib/utils';
import { canCharacterUseSpell, CLASS_LABELS, getAvailableSpellLevels, getCharacterClassLevels, SCHOOL_LABELS, type SpellLike } from '../lib/spellEligibility';

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

  const filteredData = useMemo(() => {
    if (!currentCharacter) return [];
    let base: any[] = tab === 'incantesimi' ? homebrew.spells : tab === 'talenti' ? homebrew.feats : INVOCATIONS;
    const listName = tab === 'incantesimi' ? 'spells' : tab === 'talenti' ? 'feats' : 'invocations';
    const selected = new Set((currentCharacter as any)[listName] || []);
    const needle = search.trim().toLocaleLowerCase('it');

    return base
      .filter(item => !needle || item.name?.toLocaleLowerCase('it').includes(needle) || item.displayName?.toLocaleLowerCase('it').includes(needle) || item.school?.toLocaleLowerCase('it').includes(needle))
      .filter(item => tab !== 'incantesimi' || showAllSpells || canCharacterUseSpell(item, currentCharacter))
      .filter(item => tab !== 'incantesimi' || levelFilter === 'all' || item.level === levelFilter)
      .filter(item => !onlySelected || selected.has(item.name))
      .sort((a, b) => tab === 'incantesimi' ? (a.level ?? 0) - (b.level ?? 0) || (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it') : (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it'));
  }, [currentCharacter, homebrew.spells, homebrew.feats, tab, search, showAllSpells, levelFilter, onlySelected]);

  if (!currentCharacter) return null;

  const listName = tab === 'incantesimi' ? 'spells' : tab === 'talenti' ? 'feats' : 'invocations';
  const currentList: string[] = (currentCharacter as any)[listName] || [];
  const toggleSelection = (item: any) => {
    const isSelected = currentList.includes(item.name);
    dispatch({ type:'UPDATE_CHARACTER', payload:{ [listName]:isSelected ? currentList.filter(name => name !== item.name) : [...currentList, item.name] } });
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">
      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div><p className="eyebrow mb-2">Biblioteca personale</p><h3 className="font-serif text-3xl">Scegli poteri compatibili</h3><p className="text-xs text-text-muted mt-2">{casterClasses.length ? `Liste disponibili: ${casterClasses.map(id => `${CLASS_LABELS[id]} ${classLevels[id]}`).join(' · ')}` : 'La classe scelta non dispone di una lista di incantesimi base.'}</p></div>
          <div className="flex items-center gap-3"><div className="text-right"><strong className="font-serif text-3xl font-normal">{currentList.length}</strong><p className="eyebrow !text-[7px]">Selezionati</p></div><div className="w-11 h-11 rounded-full bg-primary text-card-bg grid place-items-center"><WandSparkles className="w-5 h-5"/></div></div>
        </div>
      </section>

      <div className="flex flex-col gap-4 border-b border-border pb-6">
        <div className="flex flex-wrap gap-2">
          {([['incantesimi','Incantesimi'],['talenti','Talenti'],['invocazioni','Invocazioni']] as const).map(([id,label]) => <button key={id} onClick={()=>{setTab(id);setLevelFilter('all')}} className={`secondary-action ${tab===id?'!bg-primary !text-card-bg !border-primary':''}`}>{label}</button>)}
        </div>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
          <label className="field-shell"><Search className="w-4 h-4 text-accent"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, scuola o parola chiave…" className="w-full bg-transparent py-3 outline-none text-sm"/></label>
          {tab==='incantesimi'&&<select value={levelFilter} onChange={e=>setLevelFilter(e.target.value==='all'?'all':Number(e.target.value))} className="bg-card-bg border border-border px-4 py-2 text-xs"><option value="all">Tutti i livelli</option>{availableLevels.map(level=><option key={level} value={level}>{level===0?'Trucchetti':`Livello ${level}`}</option>)}</select>}
          <button onClick={()=>setOnlySelected(value=>!value)} className={`secondary-action flex items-center justify-center gap-2 ${onlySelected?'!border-accent !text-accent':''}`}><Check className="w-3.5 h-3.5"/> Solo scelti</button>
        </div>
        {tab==='incantesimi'&&<label className="flex items-center gap-3 text-xs text-text-muted cursor-pointer w-fit"><input type="checkbox" checked={showAllSpells} onChange={e=>setShowAllSpells(e.target.checked)} className="accent-accent"/><Filter className="w-3.5 h-3.5"/> Mostra anche magie non disponibili per classe o livello</label>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((item:any,idx:number)=>{
          const isSelected=currentList.includes(item.name);
          const spell=item as SpellLike;
          const compatible=tab!=='incantesimi'||canCharacterUseSpell(spell,currentCharacter);
          return <button key={item.name+idx} onClick={()=>toggleSelection(item)} disabled={!compatible&&!isSelected} className={`group relative p-6 border text-left transition-all ${isSelected?'border-accent bg-accent/5':'border-border bg-card-bg hover:border-accent'} ${!compatible&&!isSelected?'opacity-45 cursor-not-allowed':''}`}>
            <div className="flex justify-between items-start gap-4 mb-4"><div><h4 className={`font-serif text-2xl ${isSelected?'text-accent':'text-text-primary'}`}>{item.displayName||item.name}</h4>{item.level!==undefined&&<p className="text-[9px] uppercase font-extrabold text-text-muted tracking-[.14em] mt-1">{item.level===0?'Trucchetto':`Livello ${item.level}`} · {SCHOOL_LABELS[item.school]||item.school}{item.ritual?' · Rituale':''}{item.concentration?' · Concentrazione':''}</p>}{item.prerequisite&&<p className="text-[10px] text-accent mt-1">{item.prerequisite}</p>}</div>{isSelected?<span className="w-7 h-7 rounded-full bg-accent text-card-bg grid place-items-center"><Star className="w-3 h-3 fill-current"/></span>:<Sparkles className="w-5 h-5 text-border group-hover:text-accent"/>}</div>
            {!compatible&&<p className="text-[9px] uppercase tracking-widest font-bold text-danger mb-3">Non disponibile per classe o livello</p>}
            <div className="text-xs text-text-muted line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{__html:fixTextEncoding(item.description||'Contenuto personalizzato.')}}/>
          </button>;
        })}
        {filteredData.length===0&&<div className="col-span-full py-20 text-center border border-dashed border-border"><BookOpen className="w-10 h-10 mx-auto mb-4 text-border"/><p className="font-serif text-2xl">Nessun elemento corrisponde ai filtri.</p><p className="text-xs text-text-muted mt-2">Prova a cambiare livello o a mostrare tutte le magie.</p></div>}
      </div>
    </div>
  );
}
