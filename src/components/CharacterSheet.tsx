import React, { useState, useEffect } from 'react';
import { useCharacter, CharacterData } from '../contexts/CharacterContext';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { useHomebrew } from '../hooks/useHomebrew';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { subclassesData } from '../data/subclasses';
import { INVOCATIONS } from '../data/invocations';
import { getClassFeaturesUpTo } from '../data/classFeatures';
import { getSubclassFeaturesUpTo, getSubclassSpells } from '../data/subclassFeatures';
import { getInvocationBudget, getSpellBudget } from '../lib/spellBudget';
import { ALL_TOOLS, RARE_LANGUAGES, STANDARD_LANGUAGES } from '../data/languages';
import { 
  Shield, Heart, Zap, Eye, User, Scroll, 
  Sword, Book, Backpack, Save, Plus, Minus,
  TrendingUp, Dna, MapPin, Hash, Sparkles,
  Info, Search, Star, X, Edit3, Check, Dog, Camera, Lock, Swords, Printer, Download
} from 'lucide-react';
import PrintSheet from './PrintSheet';
import CampaignJoin from './CampaignJoin';
import { formatModifier, abilityMap, fixTextEncoding } from '../lib/utils';
import { canCharacterUseSpell, getAvailableSpellLevels, SCHOOL_LABELS } from '../lib/spellEligibility';
import { ABILITY_NAMES, getClassLevels, getInvocationsKnown, getProficiencySummary, getTotalLevel, type ClassLevelMap } from '../lib/characterRules';
import { checkFeatPrerequisites, checkInvocationPrerequisites } from '../lib/featEligibility';
import { applySpeciesChange } from '../lib/species';
import { motion, AnimatePresence } from 'motion/react';
import CombatAndRests from './CombatAndRests';
import ResourceTracker from './ResourceTracker';
import WeaponTracker from './WeaponTracker';
import InventoryManager from './InventoryManager';
import ConditionTracker from './ConditionTracker';
import SummonsManager from './SummonsManager';
import LevelUpModal, { type LevelUpChoice } from './LevelUpModal';
import SpellCastControls from './SpellCastControls';
import { useDice } from '../contexts/DiceContext';

type SheetTab = 'combat' | 'actions' | 'spells' | 'equipment' | 'feats';

const TABS: { id: SheetTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'combat', label: 'Combattimento', Icon: Heart },
  { id: 'actions', label: 'Azioni', Icon: Swords },
  { id: 'spells', label: 'Incantesimi', Icon: Sparkles },
  { id: 'equipment', label: 'Inventario', Icon: Backpack },
  { id: 'feats', label: 'Privilegi', Icon: Book },
];

export default function CharacterSheet(_props: { onBack?: () => void } = {}) {
  const { currentCharacter, dispatch } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const homebrew = useHomebrew();
  const { rollCheck } = useDice();
  const [activeTab, setActiveTab] = useState<SheetTab>('combat');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItemText, setNewItemText] = useState('');
  const [featureModal, setFeatureModal] = useState<{isOpen: boolean, tab: 'spells'|'talenti'|'invocazioni'}>({ isOpen: false, tab: 'spells' });
  const [featureSearch, setFeatureSearch] = useState('');
  const [featureLevelFilter, setFeatureLevelFilter] = useState<'all' | number>('all');
  const [showIneligible, setShowIneligible] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newTool, setNewTool] = useState('');
  const [isSummonsOpen, setIsSummonsOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<CharacterData>>({});

  useEffect(() => {
    if (currentCharacter && isEditing) {
      setEditValues({
        name: currentCharacter.name,
        level: currentCharacter.level,
        abilityScores: { ...currentCharacter.abilityScores },
        classId: currentCharacter.classId,
        speciesId: currentCharacter.speciesId,
        backgroundId: currentCharacter.backgroundId,
        hpCurrent: currentCharacter.hpCurrent,
        hpTemp: currentCharacter.hpTemp,
        acOverride: currentCharacter.acOverride,
        speedOverride: currentCharacter.speedOverride,
        proficiencyOverride: currentCharacter.proficiencyOverride,
        hpMaxOverride: currentCharacter.hpMaxOverride,
        portraitUrl: currentCharacter.portraitUrl,
        proficientSkills: [...(currentCharacter.proficientSkills || [])],
        expertiseSkills: [...(currentCharacter.expertiseSkills || [])],
        subclassId: currentCharacter.subclassId,
      });
    }
    // Inizializza i valori solo all'apertura della modalità modifica
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  if (!currentCharacter || !math) return null;

  const classLevels: ClassLevelMap = getClassLevels(currentCharacter);
  const isMulticlass = Object.keys(classLevels).length > 1;
  const charSpecies = speciesData.find(s => s.id === currentCharacter.speciesId);
  const charBackground = backgroundsData.find(b => b.id === currentCharacter.backgroundId);

  const getSpellDetails = (name: string) => homebrew.spells.find(s => s.name === name || s.originalName === name);
  const getFeatDetails = (name: string) => {
    if (!name) return undefined;
    const exact = homebrew.feats.find(f => f.name === name);
    if (exact) return exact;
    const baseName = name.split(' (')[0];
    return homebrew.feats.find(f => f.name === baseName);
  };
  const getInvocationDetails = (name: string) => INVOCATIONS.find(i => i.name === name);

  const handleUpdate = async (updates: Partial<typeof currentCharacter>) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    // Save to Firestore
    try {
      await characterService.updateCharacter(currentCharacter.id, updates);
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const handleLevelUpConfirm = (choice: LevelUpChoice) => {
    const current = getClassLevels(currentCharacter);
    const newClasses: ClassLevelMap = {
      ...current,
      [choice.classId]: { ...(current[choice.classId] || {}), level: (current[choice.classId]?.level || 0) + 1 },
    };
    const abilityBonuses = { ...(currentCharacter.abilityBonuses || {}) };
    Object.entries(choice.abilityIncrease || {}).forEach(([ability, value]) => {
      const key = ability as keyof typeof abilityBonuses;
      abilityBonuses[key] = (abilityBonuses[key] || 0) + (value || 0);
    });
    handleUpdate({
      level: getTotalLevel(currentCharacter) + 1,
      classes: newClasses,
      hpCurrent: Math.min(currentCharacter.hpCurrent, math.hpMax) + choice.hpGain,
      abilityBonuses,
      ...(choice.feat ? { feats: [...currentCharacter.feats, choice.feat] } : {}),
    });
    setIsLevelUpOpen(false);
    // Nuovi trucchetti/incantesimi dal manuale: apri subito la scelta
    if (choice.spellGain || choice.feat?.startsWith('Iniziato alla Magia')) setFeatureModal({ isOpen: true, tab: 'spells' });
  };

  const handleLevelDown = () => {
    const current = getClassLevels(currentCharacter);
    if (getTotalLevel(currentCharacter) <= 1) return;
    if (!window.confirm('Rimuovere un livello? Gli eventuali aumenti di caratteristica o talenti ottenuti con quel livello vanno corretti a mano.')) return;
    // Rimuove il livello dall'ultima classe aggiunta (multiclasse), altrimenti dalla classe principale
    const ids = Object.keys(current);
    const target = [...ids].reverse().find(id => id !== currentCharacter.classId) || currentCharacter.classId;
    const newClasses: ClassLevelMap = { ...current };
    if (newClasses[target].level <= 1 && target !== currentCharacter.classId) delete newClasses[target];
    else newClasses[target] = { ...newClasses[target], level: newClasses[target].level - 1 };
    const nextLevel = Object.values(newClasses).reduce((acc, c) => acc + c.level, 0);
    handleUpdate({ level: nextLevel, classes: newClasses });
  };

  const exportJson = () => {
    const { userId, createdAt, updatedAt, ...data } = currentCharacter;
    const blob = new Blob([JSON.stringify({ format: 'forge-character', version: 1, character: data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentCharacter.name || 'personaggio').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGlobalSave = async () => {
    const updates: Partial<CharacterData> = { ...editValues };
    const current = getClassLevels(currentCharacter);
    if (!isMulticlass) {
      // Classe singola: classId, livello e sottoclasse restano sincronizzati con la mappa delle classi
      const classId = editValues.classId || currentCharacter.classId;
      const level = Math.max(1, Math.min(20, Number(editValues.level) || 1));
      const subclass = classId === currentCharacter.classId ? (editValues.subclassId ?? current[classId]?.subclass) : '';
      updates.level = level;
      updates.subclassId = subclass || '';
      updates.classes = { [classId]: { level, ...(subclass ? { subclass } : {}) } };
    } else {
      delete updates.level;
      delete updates.classId;
    }
    const nextSpecies = { speciesId: editValues.speciesId || currentCharacter.speciesId, subOption: editValues.speciesSubOption ?? currentCharacter.speciesSubOption };
    if (editValues.speciesId !== currentCharacter.speciesId && editValues.speciesSubOption === undefined) nextSpecies.subOption = '';
    updates.speciesSubOption = nextSpecies.subOption || '';
    if (nextSpecies.speciesId !== currentCharacter.speciesId || nextSpecies.subOption !== currentCharacter.speciesSubOption) {
      Object.assign(updates, applySpeciesChange(currentCharacter, { speciesId: currentCharacter.speciesId, subOption: currentCharacter.speciesSubOption }, nextSpecies));
      if (nextSpecies.speciesId !== currentCharacter.speciesId) updates.speciesSkills = [];
    }
    await handleUpdate(updates);
    setIsEditing(false);
  };

  const renderFeatureModal = () => {
    let base: any[] = [];
    if (featureModal.tab === 'spells') base = homebrew.spells;
    if (featureModal.tab === 'talenti') base = homebrew.feats;
    if (featureModal.tab === 'invocazioni') base = INVOCATIONS;

    const listNameForTab = featureModal.tab === 'spells' ? 'spells' : (featureModal.tab === 'talenti' ? 'feats' : 'invocations');
    const eligibility = (item: any) => {
      if (featureModal.tab === 'spells') {
        const res = spellBudget.check(item);
        return { ok: res.eligible, reasons: [res.reason || 'Non ammesso per classe o livello'] };
      }
      return featureModal.tab === 'talenti'
        ? checkFeatPrerequisites(item.prerequisite, currentCharacter)
        : checkInvocationPrerequisites(item.prerequisite, currentCharacter);
    };
    /** Se l'elemento si può aggiungere ora (manuale + limiti). Quelli già scelti si possono sempre togliere. */
    const availability = (item: any, isSelected: boolean): { ok: boolean; reasons: string[] } => {
      if (isSelected) return { ok: true, reasons: [] };
      if (featureModal.tab === 'spells') {
        const res = spellBudget.check(item);
        return { ok: res.ok, reasons: res.reason ? [res.reason] : [] };
      }
      const res = eligibility(item);
      if (!res.ok) return res;
      if (featureModal.tab === 'invocazioni' && invocationBudget.full) return { ok: false, reasons: ['Limite di suppliche raggiunto'] };
      return { ok: true, reasons: [] };
    };
    const filteredData = base
      .filter((item: any) => (item.name || '').toLowerCase().includes(featureSearch.toLowerCase()) || (item.displayName && item.displayName.toLowerCase().includes(featureSearch.toLowerCase())))
      .filter((item: any) => showIneligible || eligibility(item).ok || ((currentCharacter as any)[listNameForTab] || []).includes(item.name))
      .filter((item: any) => featureModal.tab !== 'spells' || featureLevelFilter === 'all' || item.level === featureLevelFilter)
      .sort((a: any, b: any) => featureModal.tab === 'spells' ? (a.level ?? 0) - (b.level ?? 0) || (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it') : (a.displayName || a.name).localeCompare(b.displayName || b.name, 'it'));

    return (
      <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur flex flex-col animate-in fade-in zoom-in-95 duration-200">
         <div className="flex items-center justify-between p-4 border-b border-border bg-panel-bg shrink-0">
             <div className="flex bg-bg rounded border border-border">
                <button onClick={() => setFeatureModal(prev => ({...prev, tab: 'spells'}))} className={`px-3 md:px-5 py-1.5 rounded-sm text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${featureModal.tab === 'spells' ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>Incantesimi</button>
                <button onClick={() => setFeatureModal(prev => ({...prev, tab: 'talenti'}))} className={`px-3 md:px-5 py-1.5 rounded-sm text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${featureModal.tab === 'talenti' ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>Talenti</button>
                <button onClick={() => setFeatureModal(prev => ({...prev, tab: 'invocazioni'}))} className={`px-3 md:px-5 py-1.5 rounded-sm text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${featureModal.tab === 'invocazioni' ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>Invocazioni</button>
             </div>
             <button onClick={() => setFeatureModal(prev => ({...prev, isOpen: false }))} className="p-2 text-text-muted hover:text-white transition-colors">
                <X className="w-5 h-5" />
             </button>
         </div>
          <div className="p-4 border-b border-border bg-panel-bg shrink-0 space-y-3">
             {featureModal.tab === 'spells' && renderSpellBudget()}
             {featureModal.tab === 'invocazioni' && <div className={`max-w-3xl mx-auto text-[10px] font-black uppercase tracking-widest ${invocationBudget.over ? 'text-danger' : 'text-text-muted'}`}>Suppliche {invocationBudget.used}/{invocationBudget.max}</div>}
             <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl mx-auto">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
               <input 
                 type="text" 
                 placeholder="Cerca per nome..." 
                 value={featureSearch}
                 onChange={(e) => setFeatureSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-card-bg border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-colors"
               />
             </div>
             <label className="flex items-center gap-2 text-[10px] text-text-muted cursor-pointer whitespace-nowrap">
               <input type="checkbox" checked={showIneligible} onChange={e => setShowIneligible(e.target.checked)} className="accent-accent" />
               Mostra non ammessi
             </label>
             {featureModal.tab === 'spells' && (
               <select value={featureLevelFilter} onChange={e => setFeatureLevelFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="bg-card-bg border border-border rounded px-4 py-3 text-xs text-text-primary">
                 <option value="all">Tutti i livelli</option>
                 {getAvailableSpellLevels(currentCharacter).map(level => <option key={level} value={level}>{level === 0 ? 'Trucchetti' : `Livello ${level}`}</option>)}
               </select>
             )}
             </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {filteredData.length > 0 ? filteredData.map((item: any, idx: number) => {
                 const listName = featureModal.tab === 'spells' ? 'spells' : (featureModal.tab === 'talenti' ? 'feats' : 'invocations');
                 const currentList = (currentCharacter as any)[listName] || [];
                 const isSelected = currentList.includes(item.name);
                 const check = availability(item, isSelected);
                 const isExcess = featureModal.tab === 'spells' && spellBudget.excess.includes(item.name);

                 return (
                   <button
                     key={item.name + idx}
                     disabled={!check.ok}
                     onClick={() => {
                        if (!check.ok) return;
                        let newList;
                        if (isSelected) {
                          newList = currentList.filter((n: string) => n !== item.name);
                        } else {
                          newList = [...currentList, item.name];
                        }
                        handleUpdate({ [listName]: newList });
                     }}
                     className={`group relative p-6 rounded-lg border text-left transition-all duration-300 ${
                       isExcess ? 'border-danger bg-danger/5 ring-1 ring-danger/30' : isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : check.ok ? 'border-border bg-card-bg hover:border-text-muted' : 'border-border bg-card-bg opacity-50 cursor-not-allowed'
                     }`}
                   >
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h4 className={`font-serif font-bold text-lg ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{item.displayName || item.name}</h4>
                           {item.level !== undefined && (
                             <span className="text-[10px] uppercase font-mono font-black text-text-muted tracking-normal">
                                {item.level === 0 ? 'Trucchetto' : `Livello ${item.level}`} • {SCHOOL_LABELS[item.school] || item.school}
                             </span>
                           )}
                           {item.prerequisite && <div className="text-[10px] text-accent/60 italic mt-1 font-medium">{item.prerequisite}</div>}
                           {!check.ok && <div className="text-[10px] text-danger mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> {check.reasons.join(' · ')}</div>}
                           {isExcess && <div className="text-[10px] text-danger mt-1 font-bold">In eccesso: tocca per rimuovere</div>}
                        </div>
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-bg">
                             <Star className="w-3 h-3 fill-current" />
                          </div>
                        ) : (
                          <Sparkles className="w-5 h-5 text-text-muted/30 group-hover:text-accent/50 transition-colors" />
                        )}
                     </div>
                     <div 
                       className="text-[11px] text-text-muted line-clamp-3 leading-relaxed"
                       dangerouslySetInnerHTML={{ __html: fixTextEncoding(item.description || '') }}
                     />
                   </button>
                 );
              }) : <div className="col-span-full py-12 text-center text-text-muted">Nessun elemento trovato.</div>}
            </div>
         </div>
      </div>
    );
  };

  const adjustHP = (amount: number) => {
    const nextHP = Math.max(0, Math.min(math.hpMax, Math.min(currentCharacter.hpCurrent, math.hpMax) + amount));
    handleUpdate({ hpCurrent: nextHP, ...(nextHP > 0 ? { deathSaves: { successes: 0, failures: 0 } } : {}) });
  };

  const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

  // Modalità modifica: un clic sull'abilità cicla tra nessuna → competenza → maestria
  const cycleSkill = (skillName: string) => {
    const prof = new Set(editValues.proficientSkills || []);
    const exp = new Set(editValues.expertiseSkills || []);
    const fixed = (charBackground?.skills || []).includes(skillName) || (currentCharacter.speciesSkills || []).includes(skillName);
    if (exp.has(skillName)) {
      exp.delete(skillName);
      prof.delete(skillName);
    } else if (prof.has(skillName) || fixed) {
      exp.add(skillName);
    } else {
      prof.add(skillName);
    }
    setEditValues(prev => ({ ...prev, proficientSkills: Array.from(prof), expertiseSkills: Array.from(exp) }));
  };

  const editingSkillState = (skillName: string) => {
    const fixed = (charBackground?.skills || []).includes(skillName) || (currentCharacter.speciesSkills || []).includes(skillName);
    const isExpert = (editValues.expertiseSkills || []).includes(skillName);
    const isProficient = isExpert || fixed || (editValues.proficientSkills || []).includes(skillName);
    return { isExpert, isProficient };
  };

  const spellLevelLabel = (level?: number) => (level === 0 ? 'Trucchetto' : level ? `Livello ${level}` : '');

  const knownSpellDetails = currentCharacter.spells.map(name => ({ name, details: getSpellDetails(name) }));
  const invocationsKnown = getInvocationsKnown(currentCharacter);
  const subclassSpells = Array.from(new Set(Object.values(classLevels).flatMap(c => getSubclassSpells(c.subclass, c.level))));
  const spellBudget = getSpellBudget(currentCharacter, homebrew.spells);
  const invocationBudget = getInvocationBudget(currentCharacter);
  const renderSpellBudget = () => spellBudget.isCaster ? (
    <div className="max-w-3xl mx-auto space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-black uppercase tracking-widest text-text-muted">
        <span className={spellBudget.cantrips.used > spellBudget.cantrips.max ? 'text-danger' : ''}>Trucchetti {spellBudget.cantrips.used}/{spellBudget.cantrips.max}</span>
        <span className={spellBudget.leveled.used > spellBudget.leveled.max ? 'text-danger' : ''}>Preparati {spellBudget.leveled.used}/{spellBudget.leveled.max}</span>
        {spellBudget.pools.length > 2 && spellBudget.pools.map(pool => (
          <span key={pool.id} className="normal-case font-semibold tracking-normal">{pool.label} · {pool.kind === 'cantrip' ? 'trucchetti' : `fino al ${pool.maxLevel}°`} {pool.used}/{pool.capacity}</span>
        ))}
      </div>
      {spellBudget.excess.length > 0 && (
        <p className="text-xs text-danger border border-danger/40 bg-danger/10 px-3 py-2">Hai più incantesimi di quanti ne consenta il manuale (o alcuni non sono più ammessi): rimuovi quelli evidenziati in rosso. Finché non lo fai non puoi aggiungerne altri.</p>
      )}
    </div>
  ) : (
    <p className="max-w-3xl mx-auto text-xs text-text-muted">Il personaggio non ha privilegi da incantatore: gli incantesimi arrivano da classi incantatrici o da talenti come Iniziato alla Magia.</p>
  );
  const proficiencies = getProficiencySummary(currentCharacter);
  const editList = (field: 'languages' | 'toolProficiencies', value: string, add: boolean) => {
    const list = currentCharacter[field] || [];
    const next = add ? Array.from(new Set([...list, value.trim()])).filter(Boolean) : list.filter(v => v !== value);
    handleUpdate({ [field]: next });
  };
  const speciesTraits = (charSpecies?.traits || []);

  const renderSkills = () => (
    <div className="space-y-4">
      <p className="text-[10px] text-text-muted">{isEditing ? "Clicca un'abilità per passare da nessuna competenza → competenza → maestria (bonus raddoppiato)." : "Clicca un'abilità per tirare la prova (vantaggio/svantaggio dal vassoio dei dadi)."}</p>
      <div className="grid grid-cols-1 gap-y-0.5">
        {math.skills.map(skill => {
          const state = isEditing ? editingSkillState(skill.name) : skill;
          return (
            <button
              type="button"
              key={skill.name}
              onClick={() => (isEditing ? cycleSkill(skill.name) : rollCheck(`Prova di ${skill.name}`, skill.mod))}
              title={isEditing ? undefined : `Tira ${skill.name}`}
              className="flex items-center justify-between gap-2 border-b border-border/50 py-2 px-2 rounded-sm transition-colors text-left hover:bg-accent/10 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full border ${state.isExpert ? 'bg-accent border-accent ring-2 ring-accent/40' : state.isProficient ? 'bg-accent border-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'border-border'}`} />
                <span className={`text-[13px] font-medium tracking-normal ${state.isProficient ? 'text-text-primary' : 'text-text-muted'}`}>{skill.name}</span>
                <span className="text-[10px] text-text-muted/40 font-mono">({abilityMap[skill.ability] || skill.ability})</span>
                {state.isExpert && <span className="text-[8px] font-black uppercase text-accent">Maestria</span>}
              </div>
              <div className={`text-sm font-black ${skill.isProficient ? 'text-accent' : 'text-text-primary'}`}>{formatSigned(skill.mod)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSpells = () => (
    <div className="space-y-6">
      {math.spellcasting.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {math.spellcasting.map(info => (
            <div key={info.classId} className="bg-card-bg border border-accent/20 rounded p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">{info.label} · {ABILITY_NAMES[info.ability]}</div>
              <div className="flex gap-6 text-sm">
                <div><div className="text-[9px] uppercase text-text-muted font-black">CD Salvezza</div><div className="text-2xl font-black">{info.saveDc}</div></div>
                <div><div className="text-[9px] uppercase text-text-muted font-black">Attacco</div><div className="text-2xl font-black">{formatSigned(info.attackBonus)}</div></div>
                <div><div className="text-[9px] uppercase text-text-muted font-black">Trucchetti</div><div className="text-2xl font-black">{info.cantrips}</div></div>
                <div><div className="text-[9px] uppercase text-text-muted font-black">Preparati</div><div className="text-2xl font-black">{info.prepared}</div></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {currentCharacter.concentratingOn && (
        <div className="flex items-center justify-between gap-3 p-3 border border-accent bg-accent/10">
          <span className="text-sm"><strong className="font-serif">Concentrazione:</strong> {currentCharacter.concentratingOn}</span>
          <button onClick={() => handleUpdate({ concentratingOn: '' })} className="secondary-action !py-1 !px-2">Termina</button>
        </div>
      )}
      {spellBudget.excess.length > 0 && (
        <p className="text-xs text-danger border border-danger/40 bg-danger/10 px-3 py-2">Hai più incantesimi di quanti ne consenta il manuale per il tuo livello (o alcuni non sono più ammessi): rimuovi quelli evidenziati.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-serif font-bold text-accent">Incantesimi conosciuti e preparati</h4>
        <div className="flex items-center gap-4">
          {spellBudget.isCaster && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${spellBudget.excess.length ? 'text-danger' : 'text-text-muted'}`}>
              Trucchetti {spellBudget.cantrips.used}/{spellBudget.cantrips.max} · Preparati {spellBudget.leveled.used}/{spellBudget.leveled.max}
            </span>
          )}
          <button onClick={() => setFeatureModal({ isOpen: true, tab: 'spells' })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors">
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {knownSpellDetails.length > 0 ? [...knownSpellDetails]
          .sort((a, b) => (a.details?.level ?? 99) - (b.details?.level ?? 99) || (a.details?.name || a.name).localeCompare(b.details?.name || b.name, 'it'))
          .map(({ name, details }) => (
          <div key={name} className={`bg-card-bg border rounded p-4 flex justify-between items-start group ${spellBudget.excess.includes(name) ? 'border-danger' : 'border-border'}`}>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-sm">{details?.displayName || details?.name || name}</span>
              {spellBudget.excess.includes(name) && <span className="text-[9px] text-danger uppercase font-black tracking-normal">Oltre il limite del manuale o non più ammesso</span>}
              {details && <span className="text-[9px] text-text-muted uppercase font-black tracking-normal">{spellLevelLabel(details.level)} • {SCHOOL_LABELS[details.school] || details.school}{details.concentration ? ' • Concentrazione' : ''}{details.ritual ? ' • Rituale' : ''}</span>}
              {details && <SpellCastControls spellName={name} spell={details} stats={math} />}
            </div>
            <div className="flex items-center gap-3">
              {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent transition-all" aria-label="Dettagli"><Info className="w-4 h-4" /></button>}
              <button onClick={() => handleUpdate({ spells: currentCharacter.spells.filter(spell => spell !== name) })} className="text-text-muted hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100" aria-label="Rimuovi">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
        )) : <div className="col-span-full py-10 text-center text-text-muted italic text-sm">Nessun incantesimo.</div>}
      </div>
      {subclassSpells.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border pb-1">Sempre preparati (sottoclasse) · non contano nel limite</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subclassSpells.map(name => {
              const details = getSpellDetails(name);
              return (
                <div key={name} className="bg-card-bg border border-accent/40 rounded p-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs">{details?.displayName || name} <span className="text-[9px] text-text-muted uppercase">{spellLevelLabel(details?.level)}</span></span>
                    {details && <SpellCastControls spellName={name} spell={details} stats={math} />}
                  </div>
                  {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent" aria-label="Dettagli"><Info className="w-4 h-4" /></button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {(currentCharacter.innateSpells || []).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border pb-1">Incantesimi della specie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(currentCharacter.innateSpells || []).map(name => {
              const details = getSpellDetails(name);
              return (
                <div key={name} className="bg-card-bg border border-dashed border-accent/30 rounded p-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs">{details?.displayName || details?.name || name} <span className="text-[9px] text-text-muted uppercase">{spellLevelLabel(details?.level)}</span></span>
                    {details && <SpellCastControls spellName={name} spell={details} stats={math} />}
                  </div>
                  {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent" aria-label="Dettagli"><Info className="w-4 h-4" /></button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderFeatRow = (name: string, kind: 'feat' | 'invocation', onRemove?: () => void) => {
    const details = kind === 'feat' ? getFeatDetails(name) : getInvocationDetails(name);
    return (
      <div key={`${kind}-${name}`} className={`bg-card-bg border rounded p-4 flex justify-between items-center group ${kind === 'invocation' ? 'border-accent/10 border-dashed' : 'border-border'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${kind === 'invocation' ? 'bg-purple-500' : 'bg-accent'}`} />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-normal">{details?.name || name}</span>
            {kind === 'invocation' && <span className="text-[9px] font-black uppercase text-text-muted tracking-widest">Supplica Occulta</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent transition-all" aria-label="Dettagli"><Info className="w-4 h-4" /></button>}
          {onRemove && (
            <button onClick={onRemove} className="text-text-muted hover:text-red-400 transition-all md:opacity-0 md:group-hover:opacity-100" aria-label="Rimuovi">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFeats = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[currentCharacter.originFeat, currentCharacter.bonusOriginFeat].filter(Boolean).map((feat, idx) => (
          <div key={`${feat}-${idx}`} className="bg-card-bg border border-accent/20 rounded p-5">
            <div className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">{idx === 0 ? "Talento d'Origine" : "Talento d'Origine (Versatile)"}</div>
            <div className="flex justify-between items-center">
              <div className="text-lg font-serif font-bold">{feat}</div>
              {getFeatDetails(feat as string) && (
                <button onClick={() => setSelectedItem(getFeatDetails(feat as string))} className="text-accent underline text-[10px] font-black uppercase tracking-widest">Dettagli</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Talenti</h4>
          <button onClick={() => setFeatureModal({ isOpen: true, tab: 'talenti' })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors">
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {currentCharacter.feats.length ? currentCharacter.feats.map((f, i) => renderFeatRow(f, 'feat', () => handleUpdate({ feats: currentCharacter.feats.filter((_, idx) => idx !== i) })))
            : <p className="text-xs text-text-muted italic">Nessun talento aggiuntivo. I talenti si ottengono con i livelli che concedono l'Aumento dei Punteggi di Caratteristica.</p>}
        </div>
      </div>

      {(classLevels.warlock || currentCharacter.invocations.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Suppliche Occulte <span className={currentCharacter.invocations.length > invocationsKnown ? 'text-danger' : 'text-accent'}>{currentCharacter.invocations.length}/{invocationsKnown}</span></h4>
            <button onClick={() => setFeatureModal({ isOpen: true, tab: 'invocazioni' })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors">
              <Plus className="w-4 h-4" /> Aggiungi
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {currentCharacter.invocations.map(inv => renderFeatRow(inv, 'invocation', () => handleUpdate({ invocations: currentCharacter.invocations.filter(invocation => invocation !== inv) })))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase text-text-muted tracking-widest border-b border-border pb-2">Privilegi di classe</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(classLevels).map(([classId, data]) => (
            <div key={classId} className="bg-card-bg border border-border rounded p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">{classesData.find(c => c.id === classId)?.name} {data.level}{data.subclass ? ` · ${data.subclass}` : ''}</div>
              <ul className="space-y-1 text-xs">
                {getClassFeaturesUpTo(classId, data.level).filter(f => f.name !== 'Privilegio di Sottoclasse' || !data.subclass).map((f, idx) => (
                  <li key={idx} className="flex gap-2"><span className="text-text-muted font-mono w-6 shrink-0">{f.level}</span><span>{f.name === 'Sottoclasse' ? `Sottoclasse${data.subclass ? `: ${data.subclass}` : ' (da scegliere)'}` : f.name}</span></li>
                ))}
                {getSubclassFeaturesUpTo(data.subclass, data.level).map((f, idx) => (
                  <li key={`sub-${idx}`} className="flex gap-2 text-accent"><span className="text-text-muted font-mono w-6 shrink-0">{f.level}</span><span>{f.name}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-black uppercase text-text-muted tracking-widest border-b border-border pb-2">Tratti della specie · {charSpecies?.name}</h4>
        <div className="flex flex-wrap gap-2">
          {speciesTraits.map(trait => <span key={trait} className="px-3 py-1 bg-card-bg border border-border rounded text-xs">{trait}</span>)}
          {(currentCharacter.features || []).filter(f => !speciesTraits.includes(f)).map(f => <span key={f} className="px-3 py-1 bg-card-bg border border-accent/30 rounded text-xs">{f}</span>)}
          {(currentCharacter.resistances || []).length > 0 && <span className="px-3 py-1 bg-card-bg border border-primary/30 rounded text-xs">Resistenze: {currentCharacter.resistances.join(', ')}</span>}
        </div>
      </div>
    </div>
  );

  const renderTabContent = (tab: SheetTab) => {
    switch (tab) {
      case 'combat': return <><CombatAndRests /><ConditionTracker /></>;
      case 'actions': return <><WeaponTracker isEditing={isEditing} /><ResourceTracker /></>;
      case 'spells': return renderSpells();
      case 'feats': return renderFeats();
      case 'equipment': return <InventoryManager />;
      default: return null;
    }
  };

  const handlePortraitFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setEditValues(prev => ({ ...prev, portraitUrl: canvas.toDataURL('image/jpeg', 0.75) }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderAbilityTile = (ability: string, score: number, mod: number) => (
    <div key={ability} className="ability-tile">
      <div className="text-[10px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-normal text-text-muted truncate" title={ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]}>{ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]}</div>
      {isEditing ? (
        <div className="flex flex-col items-center gap-1 mt-1">
          <input
            type="number"
            min={1}
            max={30}
            value={editValues.abilityScores?.[ability as keyof NonNullable<typeof editValues.abilityScores>] ?? 0}
            onChange={(e) => {
              const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
              setEditValues(prev => ({ ...prev, abilityScores: { ...(prev.abilityScores as any), [ability]: val } }));
            }}
            className="w-16 bg-panel-bg border border-border text-center text-xl font-bold py-1"
            aria-label={`Punteggio base di ${ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]}`}
          />
          <span className="text-[10px] text-text-muted">base · finale {score}</span>
        </div>
      ) : (
        <button
          onClick={() => rollCheck(`Prova di ${ABILITY_NAMES[ability as keyof typeof ABILITY_NAMES]}`, mod - math.d20Penalty)}
          title="Tira una prova di caratteristica"
          className="block w-full text-4xl font-display font-black my-1 hover:text-accent transition-colors"
        >
          {formatSigned(mod)}
        </button>
      )}
      {!isEditing && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 min-w-11 px-2 h-7 grid place-items-center bg-bg border border-border rounded-full text-sm font-bold">{score}</div>
      )}
    </div>
  );

  const quickStat = (label: string, value: React.ReactNode, sub?: React.ReactNode, onClick?: () => void, title?: string) => (
    <div className="stat-chip text-center px-2 py-2.5 flex flex-col justify-center min-w-0">
      <div className="text-[10px] font-black uppercase tracking-wider text-text-muted truncate">{label}</div>
      {onClick ? (
        <button onClick={onClick} title={title} className="text-3xl font-display font-black leading-tight hover:text-accent">{value}</button>
      ) : (
        <div className="text-3xl font-display font-black leading-tight" title={title}>{value}</div>
      )}
      {sub && <div className="text-[10px] text-text-muted leading-tight truncate">{sub}</div>}
    </div>
  );

  const editInput = (value: number | undefined, placeholder: number, onChange: (v: number | undefined) => void, label: string, step = 1) => (
    <input
      type="number"
      step={step}
      value={value ?? ''}
      placeholder={String(placeholder)}
      onChange={(e) => onChange(e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
      className="w-16 mx-auto bg-panel-bg border border-border text-center text-2xl font-display font-black"
      aria-label={label}
      title={`${label} personalizzato (vuoto = automatico)`}
    />
  );

  const hpCurrent = Math.min(currentCharacter.hpCurrent, math.hpMax);
  const hpPct = Math.max(0, Math.min(100, (hpCurrent / math.hpMax) * 100));
  const species = speciesData.find(sp => sp.id === (isEditing ? editValues.speciesId : currentCharacter.speciesId)) as any;

  return (
    <>
      <div className="pb-28 animate-in fade-in duration-300 print:hidden">
        {featureModal.isOpen && renderFeatureModal()}

        <AnimatePresence>
          {selectedItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
              <motion.div
                initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }}
                role="dialog" aria-modal="true"
                className="surface-card border-t-4 !border-t-accent w-full max-w-lg p-7 space-y-5"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-2xl uppercase">{selectedItem.displayName || selectedItem.name}</h3>
                    {selectedItem.level !== undefined && (
                      <div className="text-xs uppercase tracking-widest text-accent font-bold mt-1">{spellLevelLabel(selectedItem.level)} · {SCHOOL_LABELS[selectedItem.school] || selectedItem.school}</div>
                    )}
                    {selectedItem.prerequisite && <div className="text-xs text-text-muted mt-1">{selectedItem.prerequisite}</div>}
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="text-text-muted hover:text-text-primary" aria-label="Chiudi"><X className="w-5 h-5" /></button>
                </div>
                {(selectedItem.range || selectedItem.duration || selectedItem.castingTime) && (
                  <div className="grid grid-cols-3 gap-3 text-xs border-y border-border py-3">
                    {[['Tempo', selectedItem.castingTime], ['Gittata', selectedItem.range], ['Durata', selectedItem.duration]].map(([k, v]) => v ? (
                      <div key={k as string}><div className="uppercase font-bold tracking-wider text-text-muted text-[10px]">{k}</div><div className="font-bold">{v}</div></div>
                    ) : <div key={k as string} />)}
                  </div>
                )}
                <div className="text-sm leading-relaxed max-h-[45vh] overflow-y-auto pr-1" dangerouslySetInnerHTML={{ __html: fixTextEncoding(selectedItem.description || '') }} />
                {selectedItem.higherLevelSlot && <p className="text-sm"><strong className="uppercase text-xs tracking-wider text-accent">Livelli superiori.</strong> {selectedItem.higherLevelSlot}</p>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Intestazione del personaggio */}
        <section className="hero-band">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-black/40 border-2 border-white/20 overflow-hidden grid place-items-center">
                  {(isEditing ? editValues.portraitUrl : currentCharacter.portraitUrl)
                    ? <img src={(isEditing ? editValues.portraitUrl : currentCharacter.portraitUrl) as string} alt={currentCharacter.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : <User className="w-12 h-12 text-white/40" />}
                </div>
                {isEditing && (
                  <label className="absolute inset-0 grid place-items-center bg-black/60 text-white cursor-pointer opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" title="Carica ritratto">
                    <Camera className="w-6 h-6" />
                    <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) handlePortraitFile(f); }} />
                  </label>
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                {isEditing ? (
                  <>
                    <input value={editValues.name || ''} onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-black/30 border border-white/20 px-2 py-1 text-2xl font-black uppercase" placeholder="Nome" aria-label="Nome del personaggio" />
                    <input value={editValues.portraitUrl || ''} onChange={e => setEditValues(prev => ({ ...prev, portraitUrl: e.target.value }))} className="w-full bg-black/30 border border-white/20 px-2 py-1 text-xs" placeholder="URL ritratto (oppure clicca l'immagine)" aria-label="URL ritratto" />
                    <div className="flex flex-wrap gap-2 text-xs">
                      <select value={editValues.speciesId || ''} onChange={e => setEditValues(prev => ({ ...prev, speciesId: e.target.value, speciesSubOption: '' }))} className="bg-black/30 border border-white/20 px-2 py-1" aria-label="Specie">
                        {speciesData.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                      </select>
                      {species?.subOptions && (
                        <select value={editValues.speciesSubOption ?? (editValues.speciesId === currentCharacter.speciesId ? currentCharacter.speciesSubOption : '') ?? ''} onChange={e => setEditValues(prev => ({ ...prev, speciesSubOption: e.target.value }))} className="bg-black/30 border border-white/20 px-2 py-1" aria-label="Lignaggio">
                          <option value="">— Lignaggio —</option>
                          {species.subOptions.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      )}
                      {isMulticlass ? (
                        <span className="text-white/60 self-center">Multiclasse: usa Sali/Scendi di livello</span>
                      ) : (
                        <>
                          <select value={editValues.classId || ''} onChange={e => setEditValues(prev => ({ ...prev, classId: e.target.value }))} className="bg-black/30 border border-white/20 px-2 py-1" aria-label="Classe">
                            {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <input type="number" min={1} max={20} value={editValues.level || 1} onChange={e => setEditValues(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))} className="w-16 bg-black/30 border border-white/20 px-2 py-1" aria-label="Livello" />
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl md:text-5xl font-black uppercase leading-none truncate">{currentCharacter.name || 'Senza nome'}</h1>
                    <p className="text-sm text-white/75">
                      {charSpecies?.name}{(charSpecies as any)?.subOptions?.find((o: any) => o.id === currentCharacter.speciesSubOption) ? ` (${(charSpecies as any).subOptions.find((o: any) => o.id === currentCharacter.speciesSubOption).name})` : ''}
                      {' · '}{Object.entries(classLevels).map(([id, d]) => `${classesData.find(c => c.id === id)?.name || id} ${d.level}`).join(' / ')}
                      {charBackground ? ` · ${charBackground.name}` : ''}
                    </p>
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(classLevels).filter(([clsId, data]) => data.level >= 3 && subclassesData[clsId]).map(([clsId, data]) => (
                    <select
                      key={clsId}
                      value={data.subclass || ''}
                      onChange={(e) => {
                        handleUpdate({
                          classes: { ...classLevels, [clsId]: { ...classLevels[clsId], subclass: e.target.value } },
                          ...(clsId === currentCharacter.classId ? { subclassId: e.target.value } : {}),
                        });
                        if (isEditing && clsId === currentCharacter.classId) setEditValues(prev => ({ ...prev, subclassId: e.target.value }));
                      }}
                      className={`text-xs px-2 py-1 border bg-black/30 ${data.subclass ? 'border-white/20 text-white' : 'border-[#ef3340] text-[#ff8a92]'}`}
                      aria-label={`Sottoclasse ${classesData.find(c => c.id === clsId)?.name}`}
                    >
                      <option value="">Scegli sottoclasse ({classesData.find(c => c.id === clsId)?.name})</option>
                      {subclassesData[clsId].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isEditing && (
                <>
                  <button onClick={() => setIsLevelUpOpen(true)} disabled={math.level >= 20} className="primary-action px-4 py-2.5 flex items-center gap-2 disabled:opacity-40"><TrendingUp className="w-4 h-4" /> Sali di livello</button>
                  <button onClick={handleLevelDown} disabled={math.level <= 1} className="secondary-action !bg-white/10 !border-white/20 !text-white disabled:opacity-40" title="Rimuovi un livello">Scendi</button>
                  <button onClick={() => setIsSummonsOpen(true)} className="secondary-action !bg-white/10 !border-white/20 !text-white flex items-center gap-2 relative" title="Evocazioni e compagni">
                    <Dog className="w-4 h-4" /> <span className="hidden sm:inline">Evocazioni</span>
                    {(currentCharacter.activeSummons?.length || 0) > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 grid place-items-center rounded-full bg-[#d4142f] text-[10px] font-bold">{currentCharacter.activeSummons?.length}</span>}
                  </button>
                  <button onClick={exportJson} className="secondary-action !bg-white/10 !border-white/20 !text-white" title="Scarica un backup JSON" aria-label="Backup"><Download className="w-4 h-4" /></button>
                  <button onClick={() => window.print()} className="secondary-action !bg-white/10 !border-white/20 !text-white" title="Stampa o salva come PDF" aria-label="Stampa"><Printer className="w-4 h-4" /></button>
                </>
              )}
              {isEditing && <button onClick={() => setIsEditing(false)} className="secondary-action !bg-white/10 !border-white/20 !text-white">Annulla</button>}
              <button onClick={() => (isEditing ? handleGlobalSave() : setIsEditing(true))} className={`${isEditing ? 'primary-action' : 'secondary-action !bg-white !text-black !border-white'} px-4 py-2.5 flex items-center gap-2`}>
                {isEditing ? <><Check className="w-4 h-4" /> Salva</> : <><Edit3 className="w-4 h-4" /> Modifica</>}
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
          {/* Caratteristiche e valori rapidi */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pb-3">
              {(Object.entries(math.scores) as [string, number][]).map(([ability, score]) => renderAbilityTile(ability, score, math.mods[ability as keyof typeof math.mods]))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pb-3">
              {quickStat('Competenza', isEditing ? editInput(editValues.proficiencyOverride, math.proficiencyBonus, v => setEditValues(prev => ({ ...prev, proficiencyOverride: v })), 'Bonus di competenza') : formatSigned(math.proficiencyBonus))}
              {quickStat('Velocità', isEditing ? editInput(editValues.speedOverride, math.speedInfo.base, v => setEditValues(prev => ({ ...prev, speedOverride: v })), 'Velocità', 1.5) : `${math.speed}m`, math.speedInfo.notes[0], undefined, math.speedInfo.notes.join(' · '))}
              {quickStat('Iniziativa', formatSigned(math.initiative), undefined, () => rollCheck('Iniziativa', math.initiative), "Tira l'iniziativa")}
              {quickStat('Classe Armatura', isEditing ? editInput(editValues.acOverride, math.armorClass.base, v => setEditValues(prev => ({ ...prev, acOverride: v })), 'Classe Armatura') : math.acBase, <span className="line-clamp-1">{math.armorClass.isOverride ? 'Valore manuale' : math.armorClass.source}</span>)}
              <div className="stat-chip col-span-2 sm:col-span-1 px-3 py-2.5">
                <div className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Punti Ferita</div>
                <div className="flex items-center justify-between gap-1">
                  <button onClick={() => adjustHP(-1)} className="p-1 text-text-muted hover:text-danger" aria-label="Togli 1 PF"><Minus className="w-4 h-4" /></button>
                  <div className="text-2xl font-display font-black leading-tight whitespace-nowrap">
                    {hpCurrent}<span className="text-sm text-text-muted">/{isEditing ? (
                      <input type="number" min={1} value={editValues.hpMaxOverride ?? ''} placeholder={String(math.hpMax)} onChange={(e) => setEditValues(prev => ({ ...prev, hpMaxOverride: e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value) || 1) }))} className="w-12 bg-panel-bg border border-border text-center" aria-label="PF massimi personalizzati" />
                    ) : math.hpMax}</span>
                  </div>
                  <button onClick={() => adjustHP(1)} className="p-1 text-text-muted hover:text-success" aria-label="Aggiungi 1 PF"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="h-1.5 bg-panel-bg overflow-hidden mt-1"><div className={`h-full transition-all ${hpPct > 50 ? 'bg-success' : hpPct > 25 ? 'bg-yellow-500' : 'bg-danger'}`} style={{ width: `${hpPct}%` }} /></div>
                {(currentCharacter.hpTemp || 0) > 0 && <div className="text-[10px] text-center text-blue-400 font-bold mt-0.5">+{currentCharacter.hpTemp} temporanei</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[250px_300px_1fr] gap-6 items-start">
            <aside className="space-y-6 xl:contents">
              <div className="space-y-6">
                <section className="sheet-section">
                  <div className="sheet-section-title">Tiri Salvezza</div>
                  <div className="p-2 grid grid-cols-2 gap-1">
                    {math.savingThrows.map(save => (
                      <button key={save.ability} onClick={() => rollCheck(`Tiro Salvezza su ${ABILITY_NAMES[save.ability]}`, save.mod)} title="Tira il tiro salvezza" className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-panel-bg text-left">
                        <span className="flex items-center gap-2 text-xs">
                          <span className={`w-2 h-2 rounded-full border ${save.isProficient ? 'bg-accent border-accent' : 'border-text-muted'}`} />
                          <span className={save.isProficient ? 'font-bold' : 'text-text-muted'}>{abilityMap[save.ability]}</span>
                        </span>
                        <span className="font-display font-black">{formatSigned(save.mod)}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="sheet-section">
                  <div className="sheet-section-title">Sensi</div>
                  <div className="p-3 space-y-1.5 text-sm">
                    {[['Percezione passiva', math.passivePerception], ['Intuizione passiva', math.passiveInsight], ['Indagare passiva', math.passiveInvestigation], ['Scurovisione', math.darkvision ? `${math.darkvision} m` : '—']].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between items-center"><span className="text-text-muted">{k}</span><strong className="font-display text-lg">{v}</strong></div>
                    ))}
                    {(math.armorClass.stealthDisadvantage || math.armorClass.untrained || math.d20Penalty > 0) && (
                      <div className="border-t border-border pt-2 space-y-1 text-xs text-danger">
                        {math.armorClass.stealthDisadvantage && <p>Svantaggio a Furtività (armatura)</p>}
                        {math.armorClass.untrained && <p>Armatura/scudo senza addestramento: Svantaggio alle prove e ai tiri con FOR e DES, niente incantesimi</p>}
                        {math.d20Penalty > 0 && <p>Esaurimento: −{math.d20Penalty} già incluso nei Test di d20</p>}
                      </div>
                    )}
                  </div>
                </section>

                <section className="sheet-section">
                  <div className="sheet-section-title">Competenze e Lingue</div>
                  <div className="p-3 space-y-3 text-xs">
                    <div><span className="text-text-muted uppercase font-bold tracking-wider">Armature</span><div>{proficiencies.armor.length ? proficiencies.armor.join(', ') : 'nessuna'}</div></div>
                    <div><span className="text-text-muted uppercase font-bold tracking-wider">Armi</span><div>{proficiencies.weapons.join(', ')}</div></div>
                    {(['toolProficiencies', 'languages'] as const).map(field => {
                      const shown = field === 'languages' ? proficiencies.languages : proficiencies.tools;
                      const own = currentCharacter[field] || [];
                      const value = field === 'languages' ? newLanguage : newTool;
                      const setValue = field === 'languages' ? setNewLanguage : setNewTool;
                      return (
                        <div key={field} className="space-y-1.5">
                          <div className="text-text-muted uppercase font-bold tracking-wider">{field === 'languages' ? 'Lingue' : 'Strumenti'}</div>
                          <div className="flex flex-wrap gap-1">
                            {shown.length === 0 && <span className="italic text-text-muted">nessuno</span>}
                            {shown.map(item => (
                              <span key={item} className="px-2 py-0.5 bg-panel-bg border border-border flex items-center gap-1">
                                {item}
                                {isEditing && own.includes(item) && <button onClick={() => editList(field, item, false)} className="text-text-muted hover:text-danger" aria-label={`Rimuovi ${item}`}><X className="w-3 h-3" /></button>}
                              </span>
                            ))}
                          </div>
                          {isEditing && (
                            <div className="flex gap-1">
                              <input list={`${field}-options`} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { editList(field, value, true); setValue(''); } }} placeholder="Aggiungi…" className="flex-1 min-w-0 bg-panel-bg border border-border px-2 py-1" aria-label={field === 'languages' ? 'Aggiungi lingua' : 'Aggiungi strumento'} />
                              <datalist id={`${field}-options`}>{(field === 'languages' ? [...STANDARD_LANGUAGES, ...RARE_LANGUAGES] : ALL_TOOLS).map(o => <option key={o} value={o} />)}</datalist>
                              <button onClick={() => { if (value.trim()) { editList(field, value, true); setValue(''); } }} className="px-2 border border-border hover:border-accent" aria-label="Aggiungi"><Plus className="w-3 h-3" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <CampaignJoin />
              </div>

              <section className="sheet-section">
                <div className="sheet-section-title">Abilità</div>
                <div className="p-2">{renderSkills()}</div>
              </section>
            </aside>

            <section className="min-w-0 space-y-4 order-first lg:order-none">
              <div className="flex overflow-x-auto no-scrollbar border-b border-border" role="tablist" aria-label="Sezioni della scheda">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-wider whitespace-nowrap transition-colors font-serif ${activeTab === t.id ? 'text-accent' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    <t.Icon className="w-4 h-4" /> {t.label}
                    {activeTab === t.id && <motion.span layoutId="sheet-tab-underline" className="absolute left-0 right-0 -bottom-px h-[3px] bg-accent" />}
                  </button>
                ))}
              </div>
              <div role="tabpanel" className="space-y-6">
                {renderTabContent(activeTab || 'combat')}
              </div>
            </section>
          </div>
        </div>
      </div>

      <PrintSheet character={currentCharacter} stats={math} findSpell={getSpellDetails} />
      <SummonsManager isOpen={isSummonsOpen} onClose={() => setIsSummonsOpen(false)} />
      <LevelUpModal isOpen={isLevelUpOpen} onClose={() => setIsLevelUpOpen(false)} character={currentCharacter} onLevelUp={handleLevelUpConfirm} />
    </>
  );
}
