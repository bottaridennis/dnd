import React, { useState, useEffect } from 'react';
import { useCharacter, CharacterData } from '../contexts/CharacterContext';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { useHomebrew } from '../hooks/useHomebrew';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { subclassesData } from '../data/subclasses';
import { INVOCATIONS } from '../data/invocations';
import { getClassFeaturesUpTo } from '../data/classFeatures';
import { 
  Shield, Heart, Zap, Eye, User, Scroll, 
  Sword, Book, Backpack, Save, Plus, Minus,
  TrendingUp, Dna, MapPin, Hash, Sparkles,
  Info, Search, Star, X, Edit3, Check, Dog, Camera, Lock, Swords
} from 'lucide-react';
import { formatModifier, abilityMap, fixTextEncoding } from '../lib/utils';
import { canCharacterUseSpell, getAvailableSpellLevels, SCHOOL_LABELS } from '../lib/spellEligibility';
import { ABILITY_NAMES, getClassLevels, getInvocationsKnown, getTotalLevel, type ClassLevelMap } from '../lib/characterRules';
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

type SheetTab = 'stats' | 'spells' | 'feats' | 'equipment' | 'mastery';

const TABS: { id: SheetTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'stats', label: 'Abilità', Icon: Scroll },
  { id: 'spells', label: 'Incantesimi', Icon: Sparkles },
  { id: 'mastery', label: 'Attacchi', Icon: Swords },
  { id: 'feats', label: 'Talenti e Privilegi', Icon: Book },
  { id: 'equipment', label: 'Equipaggiamento', Icon: Backpack },
];

export default function CharacterSheet() {
  const { currentCharacter, dispatch } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const homebrew = useHomebrew();
  const [activeTab, setActiveTab] = useState<SheetTab | null>('stats');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItemText, setNewItemText] = useState('');
  const [featureModal, setFeatureModal] = useState<{isOpen: boolean, tab: 'spells'|'talenti'|'invocazioni'}>({ isOpen: false, tab: 'spells' });
  const [featureSearch, setFeatureSearch] = useState('');
  const [featureLevelFilter, setFeatureLevelFilter] = useState<'all' | number>('all');
  const [showIneligible, setShowIneligible] = useState(false);
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
    const eligibility = (item: any) => featureModal.tab === 'spells'
      ? { ok: canCharacterUseSpell(item, currentCharacter), reasons: ['Non disponibile per classe o livello'] }
      : featureModal.tab === 'talenti'
        ? checkFeatPrerequisites(item.prerequisite, currentCharacter)
        : checkInvocationPrerequisites(item.prerequisite, currentCharacter);
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
          <div className="p-4 border-b border-border bg-panel-bg shrink-0">
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
               Mostra non disponibili
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
                 const check = eligibility(item);

                 return (
                   <button
                     key={item.name + idx}
                     onClick={() => {
                        let newList;
                        if (isSelected) {
                          newList = currentList.filter((n: string) => n !== item.name);
                        } else {
                          newList = [...currentList, item.name];
                        }
                        handleUpdate({ [listName]: newList });
                     }}
                     className={`group relative p-6 rounded-lg border text-left transition-all duration-300 ${
                       isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border bg-card-bg hover:border-text-muted'
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
  const cantripCount = knownSpellDetails.filter(s => s.details?.level === 0).length;
  const leveledCount = knownSpellDetails.filter(s => (s.details?.level ?? 1) > 0).length;
  const maxCantrips = math.spellcasting.reduce((acc, c) => acc + c.cantrips, 0);
  const maxPrepared = math.spellcasting.reduce((acc, c) => acc + c.prepared, 0);
  const invocationsKnown = getInvocationsKnown(currentCharacter);
  const speciesTraits = (charSpecies?.traits || []);

  const renderSkills = () => (
    <div className="space-y-4">
      {isEditing && <p className="text-[10px] text-text-muted">Clicca un'abilità per passare da nessuna competenza → competenza → maestria (bonus raddoppiato).</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
        {math.skills.map(skill => {
          const state = isEditing ? editingSkillState(skill.name) : skill;
          return (
            <button
              type="button"
              key={skill.name}
              onClick={() => isEditing && cycleSkill(skill.name)}
              className={`flex items-center justify-between border-b border-border/50 py-3 px-2 rounded-sm transition-colors text-left ${isEditing ? 'hover:bg-accent/10 cursor-pointer' : 'cursor-default hover:bg-accent/5'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full border ${state.isExpert ? 'bg-accent border-accent ring-2 ring-accent/40' : state.isProficient ? 'bg-accent border-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'border-border'}`} />
                <span className={`text-[11px] font-bold tracking-normal ${state.isProficient ? 'text-text-primary' : 'text-text-muted'}`}>{skill.name}</span>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-lg font-serif font-bold text-accent">Incantesimi conosciuti e preparati</h4>
        <div className="flex items-center gap-4">
          {math.spellcasting.length > 0 && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${cantripCount > maxCantrips || leveledCount > maxPrepared ? 'text-danger' : 'text-text-muted'}`}>
              Trucchetti {cantripCount}/{maxCantrips} · Preparati {leveledCount}/{maxPrepared}
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
          <div key={name} className="bg-card-bg border border-border rounded p-4 flex justify-between items-center group">
            <div className="flex flex-col">
              <span className="font-bold text-sm">{details?.displayName || details?.name || name}</span>
              {details && <span className="text-[9px] text-text-muted uppercase font-black tracking-normal">{spellLevelLabel(details.level)} • {SCHOOL_LABELS[details.school] || details.school}{details.concentration ? ' • Concentrazione' : ''}{details.ritual ? ' • Rituale' : ''}</span>}
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
      {(currentCharacter.innateSpells || []).length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border pb-1">Incantesimi della specie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(currentCharacter.innateSpells || []).map(name => {
              const details = getSpellDetails(name);
              return (
                <div key={name} className="bg-card-bg border border-dashed border-accent/30 rounded p-3 flex justify-between items-center">
                  <span className="font-bold text-xs">{details?.displayName || details?.name || name} <span className="text-[9px] text-text-muted uppercase">{spellLevelLabel(details?.level)}</span></span>
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
                {getClassFeaturesUpTo(classId, data.level).map((f, idx) => (
                  <li key={idx} className="flex gap-2"><span className="text-text-muted font-mono w-6 shrink-0">{f.level}</span><span>{f.name === 'Sottoclasse' ? `Sottoclasse${data.subclass ? `: ${data.subclass}` : ' (da scegliere)'}` : f.name}</span></li>
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
      case 'stats': return renderSkills();
      case 'spells': return renderSpells();
      case 'feats': return renderFeats();
      case 'mastery': return <WeaponTracker isEditing={isEditing} />;
      case 'equipment': return <InventoryManager />;
      default: return null;
    }
  };

  const renderStatBox = (ability: string, score: number, mod: number) => (
    <div key={ability} className="relative bg-panel-bg border-2 md:border-4 border-accent/20 rounded-xl w-full pt-4 pb-5 md:pt-5 md:pb-6 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
       <div className="absolute -top-3 bg-panel-bg px-1.5 md:px-3 rounded text-[9px] md:text-[10px] font-black uppercase text-text-primary tracking-widest border border-border whitespace-nowrap">
         {abilityMap[ability] || ability}
       </div>
       {isEditing ? (
         <div className="flex flex-col items-center gap-2 my-1">
            <input
              type="number"
              min={1}
              max={30}
              value={editValues.abilityScores?.[ability as keyof NonNullable<typeof editValues.abilityScores>] ?? 0}
              onChange={(e) => {
                const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 1));
                setEditValues(prev => ({
                  ...prev,
                  abilityScores: { ...(prev.abilityScores as any), [ability]: val }
                }));
              }}
              className="w-16 bg-card-bg border-b border-accent text-center text-xl font-bold focus:outline-none"
            />
            <span className="text-[9px] text-text-muted text-center leading-tight">Base · finale {score}</span>
         </div>
       ) : (
         <>
           <div className="text-3xl md:text-4xl font-serif font-black text-text-primary my-1 md:my-2">
             {mod >= 0 ? `+${mod}` : mod}
           </div>
           <div className="absolute -bottom-3 md:-bottom-4 w-10 md:w-14 h-6 md:h-8 bg-bg border-2 border-accent/40 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-text-primary shadow-sm">
             {score}
           </div>
         </>
       )}
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-bg text-text-primary p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Global Edit Toggle */}
      <div className="flex justify-end sticky top-20 z-40 px-4 md:px-0">
        <button
          onClick={() => isEditing ? handleGlobalSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-105 active:scale-95 ${
            isEditing 
            ? 'bg-success text-bg ring-4 ring-success/20' 
            : 'bg-primary text-white ring-4 ring-primary/20'
          }`}
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4" /> Salva Modifiche
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" /> Modifica Scheda
            </>
          )}
        </button>
      </div>

      {featureModal.isOpen && renderFeatureModal()}
      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-panel-bg border border-accent w-full max-w-lg p-10 rounded-xl shadow-2xl space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-3xl font-serif font-black text-accent">{selectedItem.displayName || selectedItem.name}</h3>
                    {selectedItem.level !== undefined && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">
                        Livello {selectedItem.level} • {selectedItem.school}
                      </div>
                    )}
                 </div>
                 <button onClick={() => setSelectedItem(null)} className="text-text-muted hover:text-white">
                    <Minus className="w-6 h-6 rotate-45" />
                 </button>
              </div>
              
              <div 
                className="text-sm leading-relaxed text-text-muted max-h-[40vh] overflow-y-auto no-scrollbar"
                dangerouslySetInnerHTML={{ __html: fixTextEncoding(selectedItem.description || '') }}
              />

              <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest pt-6 border-t border-border">
                 {selectedItem.range && (
                   <div>
                      <div className="text-accent mb-1">Gittata</div>
                      <div className="text-text-primary">{selectedItem.range}</div>
                   </div>
                 )}
                 {selectedItem.duration && (
                   <div>
                      <div className="text-accent mb-1">Durata</div>
                      <div className="text-text-primary">{selectedItem.duration}</div>
                   </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Info Rail */}
      <header className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-panel-bg p-6 rounded-lg border border-border">
           <div className="relative group/portrait">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-accent/20 flex shrink-0 items-center justify-center text-accent overflow-hidden border border-accent/30 shadow-md">
                 {currentCharacter.portraitUrl ? (
                   <img src={currentCharacter.portraitUrl} alt={currentCharacter.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <User className="w-12 h-12" />
                 )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-bg/60 flex items-center justify-center rounded-xl opacity-0 group-hover/portrait:opacity-100 transition-opacity pointer-events-none">
                  <Camera className="w-6 h-6 text-accent" />
                </div>
              )}
           </div>
           <div className="flex-1 w-full text-center sm:text-left mt-2 sm:mt-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={editValues.name || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-transparent border-b border-accent text-2xl font-serif font-black focus:outline-none"
                    placeholder="Nome Personaggio"
                  />
                  <div className="flex items-center gap-2">
                    <Camera className="w-3 h-3 text-accent shrink-0" />
                    <input 
                      type="text" 
                      value={editValues.portraitUrl || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, portraitUrl: e.target.value }))}
                      className="w-full bg-transparent border-b border-border text-[9px] font-mono focus:border-accent outline-none"
                      placeholder="URL Ritratto"
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_SIZE = 400;
                              let width = img.width;
                              let height = img.height;
                              if (width > height) {
                                if (width > MAX_SIZE) {
                                  height *= MAX_SIZE / width;
                                  width = MAX_SIZE;
                                }
                              } else {
                                if (height > MAX_SIZE) {
                                  width *= MAX_SIZE / height;
                                  height = MAX_SIZE;
                                }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                              setEditValues(prev => ({ ...prev, portraitUrl: dataUrl }));
                            };
                            img.src = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                      id="sheet-portrait-upload"
                    />
                    <label 
                      htmlFor="sheet-portrait-upload"
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 border border-accent/20 rounded text-[9px] font-mono font-black uppercase text-accent hover:bg-accent/20 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      Carica Foto
                    </label>
                  </div>
                </div>
              ) : (
                <h1 className="text-2xl font-serif font-black tracking-normal line-clamp-1">{currentCharacter.name || 'Senza Nome'}</h1>
              )}
              <div className="text-[10px] font-black uppercase text-accent tracking-widest mb-2">
                {isEditing ? (
                  <div className="flex flex-col gap-1 mt-2">
                    <select 
                      value={editValues.speciesId || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, speciesId: e.target.value, speciesSubOption: '' }))}
                      className="bg-bg border border-border rounded px-2 py-1 text-[9px] text-text-primary"
                    >
                      {speciesData.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {(speciesData.find(sp => sp.id === editValues.speciesId) as any)?.subOptions && (
                      <select
                        value={editValues.speciesSubOption ?? (editValues.speciesId === currentCharacter.speciesId ? currentCharacter.speciesSubOption : '') ?? ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, speciesSubOption: e.target.value }))}
                        className="bg-bg border border-border rounded px-2 py-1 text-[9px] text-text-primary"
                      >
                        <option value="">-- Lignaggio --</option>
                        {(speciesData.find(sp => sp.id === editValues.speciesId) as any).subOptions.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    )}
                    {isMulticlass ? (
                      <span className="text-[9px] text-text-muted normal-case tracking-normal">Multiclasse: usa Level Up / Level Down per cambiare i livelli.</span>
                    ) : (
                      <select 
                        value={editValues.classId || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, classId: e.target.value }))}
                        className="bg-bg border border-border rounded px-2 py-1 text-[9px] text-text-primary"
                      >
                        {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                  </div>
                ) : (
                  <>
                    {charSpecies?.name}{' '}
                    {Object.entries(classLevels)
                      .map(([clsId, data]) => `${classesData.find(c => c.id === clsId)?.name || clsId} ${data.level}`)
                      .join(' / ')}
                    {charBackground && <span className="block text-text-muted normal-case tracking-normal font-bold mt-0.5">{charBackground.name}</span>}
                  </>
                )}
              </div>
              
              <div className="flex flex-col gap-1 w-full max-w-full">
                {Object.entries(classLevels)
                  .filter(([clsId, data]) => data.level >= 3 && subclassesData[clsId])
                  .map(([clsId, data]) => (
                    <select
                      key={clsId}
                      value={data.subclass || ''}
                      onChange={(e) => {
                        handleUpdate({
                          classes: { ...classLevels, [clsId]: { ...classLevels[clsId], subclass: e.target.value } },
                          ...(clsId === currentCharacter.classId ? { subclassId: e.target.value } : {})
                        });
                        if (isEditing) setEditValues(prev => ({ ...prev, ...(clsId === currentCharacter.classId ? { subclassId: e.target.value } : {}) }));
                      }}
                      className="bg-bg border border-accent/30 rounded px-2 py-1 text-[10px] font-bold text-accent focus:border-accent outline-none w-full"
                    >
                      <option value="">-- Sottoclasse {classesData.find(c => c.id === clsId)?.name} --</option>
                      {subclassesData[clsId].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  ))
                }
              </div>
           </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-4">
           {/* HP Tracker */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Punti Ferita</span>
                 <Heart className="w-3 h-3 text-success fill-success" />
              </div>
              <div className="flex items-center justify-between">
                 <button onClick={() => adjustHP(-1)} className="p-1 hover:text-accent"><Minus className="w-4 h-4" /></button>
                 <div className="text-2xl font-black text-text-primary">
                    {Math.min(currentCharacter.hpCurrent, math.hpMax)} <span className="text-text-muted text-sm">/ {isEditing ? (
                      <input
                        type="number"
                        min={1}
                        title="PF massimi personalizzati (vuoto = calcolo automatico)"
                        value={editValues.hpMaxOverride ?? ''}
                        placeholder={String(math.hpMax)}
                        onChange={(e) => setEditValues(prev => ({ ...prev, hpMaxOverride: e.target.value === '' ? undefined : Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-14 bg-card-bg border border-accent/30 rounded text-center font-black text-sm"
                      />
                    ) : math.hpMax}</span>
                 </div>
                 <button onClick={() => adjustHP(1)} className="p-1 hover:text-accent"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
                 <div 
                   className="h-full bg-success transition-all" 
 style={{ width: `${Math.min(100, (currentCharacter.hpCurrent / math.hpMax) * 100)}%` }} 
                 />
              </div>
           </div>

           {/* AC & Initiative */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex items-center justify-around">
              <div className="text-center">
                 <Shield className="w-4 h-4 text-accent mx-auto mb-1" />
                 {isEditing ? (
                   <input 
                     type="number"
                     title="CA personalizzata (vuoto = calcolo automatico)"
                     value={editValues.acOverride ?? ''}
                     placeholder={String(math.armorClass.base)}
                     onChange={(e) => setEditValues(prev => ({ ...prev, acOverride: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 }))}
                     className="w-12 bg-card-bg border border-accent/30 rounded text-center font-black text-sm"
                   />
                 ) : (
                   <div className="text-xl font-black" title={`${math.armorClass.source}${math.armorClass.isOverride ? ' (valore manuale)' : ''}`}>{math.acBase}</div>
                 )}
                 <div className="text-[9px] uppercase font-black text-text-muted px-2 py-0.5 border border-border rounded mt-1">AC</div>
              </div>
              <div className="text-center">
                 <Zap className="w-4 h-4 text-accent mx-auto mb-1" />
                 <div className="text-xl font-black">{math.initiative >= 0 ? `+${math.initiative}` : math.initiative}</div>
                 <div className="text-[9px] uppercase font-black text-text-muted px-2 py-0.5 border border-border rounded mt-1">Iniziativa</div>
              </div>
           </div>

           {/* Speed & Proficiency */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex items-center justify-around">
              <div className="text-center">
                 <MapPin className="w-4 h-4 text-accent mx-auto mb-1" />
                 {isEditing ? (
                   <input 
                     type="number"
                     step={1.5}
                     title="Velocità personalizzata in metri (vuoto = calcolo automatico)"
                     value={editValues.speedOverride ?? ''}
                     placeholder={String(math.speedInfo.base)}
                     onChange={(e) => setEditValues(prev => ({ ...prev, speedOverride: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 }))}
                     className="w-12 bg-card-bg border border-accent/30 rounded text-center font-black text-sm"
                   />
                 ) : (
                   <div className="text-xl font-black" title={math.speedInfo.notes.join(' · ')}>{math.speed}m</div>
                 )}
                 <div className="text-[9px] uppercase font-black text-text-muted px-2 py-0.5 border border-border rounded mt-1">Velocità</div>
              </div>
              <div className="text-center">
                 <Hash className="w-4 h-4 text-accent mx-auto mb-1" />
                 {isEditing ? (
                   <input 
                     type="number"
                     title="Bonus di competenza personalizzato (vuoto = calcolo automatico)"
                     value={editValues.proficiencyOverride ?? ''}
                     placeholder={String(math.proficiencyBonus)}
                     onChange={(e) => setEditValues(prev => ({ ...prev, proficiencyOverride: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 }))}
                     className="w-12 bg-card-bg border border-accent/30 rounded text-center font-black text-sm"
                   />
                 ) : (
                   <div className="text-xl font-black">+{math.proficiencyBonus}</div>
                 )}
                 <div className="text-[9px] uppercase font-black text-text-muted px-2 py-0.5 border border-border rounded mt-1">Competenza</div>
              </div>
           </div>

           {/* Level & XP */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                 <span className="text-[10px] font-black uppercase text-accent">
                   Livello {isEditing && !isMulticlass ? editValues.level : math.level}
                 </span>
                 <TrendingUp className="w-3 h-3 text-accent" />
              </div>
              {isEditing && !isMulticlass ? (
                <input 
                  type="number"
                  min="1"
                  max="20"
                  value={editValues.level || 1}
                  onChange={(e) => setEditValues(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-card-bg border border-border rounded py-1 text-center font-bold text-sm"
                />
              ) : (
                <div className="flex gap-2">
                   <button 
                     onClick={handleLevelDown}
                     disabled={math.level <= 1}
                     className="flex-1 py-1 rounded border border-border text-[9px] font-black hover:bg-accent/10"
                   >LEVEL DOWN</button>
                   <button 
                     onClick={() => setIsLevelUpOpen(true)}
                     disabled={math.level >= 20}
                     className="flex-1 py-1 rounded bg-accent text-bg text-[9px] font-black shadow-sm"
                   >LEVEL UP</button>
                </div>
              )}
           </div>

           {/* Summons Quick Access */}
           <button 
             onClick={() => setIsSummonsOpen(true)}
             className={`bg-panel-bg border rounded-lg p-4 flex flex-col items-center justify-center transition-all group relative ${
                (currentCharacter.activeSummons?.length || 0) > 0 
                ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
                : 'border-border hover:border-accent/40'
             }`}
           >
              {(currentCharacter.activeSummons?.length || 0) > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#d4af37]" />
              )}
              <Dog className={`w-5 h-5 mb-1 group-hover:scale-110 transition-transform ${(currentCharacter.activeSummons?.length || 0) > 0 ? 'text-accent' : 'text-text-muted'}`} />
              <div className="text-[10px] font-black uppercase text-text-primary tracking-widest leading-tight">Evocazioni</div>
              <div className={`text-[8px] font-bold mt-0.5 uppercase ${(currentCharacter.activeSummons?.length || 0) > 0 ? 'text-accent' : 'text-text-muted'}`}>
                {(currentCharacter.activeSummons?.length || 0) > 0 ? `${currentCharacter.activeSummons?.length} Attive` : 'Gestione'}
              </div>
           </button>
        </div>
      </header>

      {/* Main Grid: Stats & Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ability Scores Sidebar */}
        <div className="lg:col-span-3 space-y-8 mt-2">
           <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-1 gap-x-2 lg:gap-x-4 gap-y-8">
              {(Object.entries(math.scores) as [string, number][]).map(([ability, score]) => renderStatBox(ability, score, math.mods[ability as keyof typeof math.mods]))}
           </div>

           {/* Tiri Salvezza */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 shadow-sm">
              <div className="text-[10px] font-black uppercase text-text-muted mb-3 tracking-widest">Tiri Salvezza</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                 {math.savingThrows.map(save => (
                   <div key={save.ability} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full border ${save.isProficient ? 'bg-accent border-accent' : 'border-border'}`} />
                         <span className={save.isProficient ? 'font-bold text-text-primary' : 'text-text-muted'}>{abilityMap[save.ability]}</span>
                      </span>
                      <span className={`font-black ${save.isProficient ? 'text-accent' : 'text-text-primary'}`}>{formatSigned(save.mod)}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Sensi */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 shadow-sm space-y-2 text-xs">
              <div className="text-[10px] font-black uppercase text-text-muted mb-1 tracking-widest">Sensi passivi</div>
              <div className="flex justify-between"><span className="text-text-muted">Percezione</span><strong className="text-accent text-base">{math.passivePerception}</strong></div>
              <div className="flex justify-between"><span className="text-text-muted">Intuizione</span><strong>{math.passiveInsight}</strong></div>
              <div className="flex justify-between"><span className="text-text-muted">Indagare</span><strong>{math.passiveInvestigation}</strong></div>
              <div className="flex justify-between border-t border-border/50 pt-2"><span className="text-text-muted">Scurovisione</span><strong>{math.darkvision ? `${math.darkvision}m` : '—'}</strong></div>
              {(math.armorClass.stealthDisadvantage || math.armorClass.untrained || math.d20Penalty > 0) && (
                <div className="border-t border-border/50 pt-2 space-y-1 text-[10px] text-danger">
                  {math.armorClass.stealthDisadvantage && <p>Svantaggio a Furtività (armatura)</p>}
                  {math.armorClass.untrained && <p>Armatura/scudo senza addestramento: Svantaggio alle prove e ai tiri con FOR e DES, niente incantesimi</p>}
                  {math.d20Penalty > 0 && <p>Esaurimento: -{math.d20Penalty} già incluso nei Test di d20</p>}
                </div>
              )}
           </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-9 space-y-6">
           <ConditionTracker />

           {/* Magic Resources Tracker (2024 Rules) */}
           <ResourceTracker />

           {/* Rests & Combat */}
           <CombatAndRests />

           {/* Tab Navigation (Desktop) */}
           <div className="hidden md:flex p-1 bg-panel-bg border border-border rounded overflow-x-auto no-scrollbar">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === t.id ? 'bg-accent text-bg shadow-lg' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <t.Icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
           </div>

           {/* Mobile Accordions */}
           <div className="md:hidden flex flex-col gap-2">
             {TABS.map(t => (
                 <div key={t.id} className="bg-panel-bg border border-border rounded-lg overflow-hidden">
                   <button
                     onClick={() => setActiveTab(activeTab === t.id ? null : t.id)}
                     className={`w-full flex items-center justify-between p-4 transition-colors ${activeTab === t.id ? 'bg-accent/10 border-b border-border' : ''}`}
                   >
                     <div className="flex items-center gap-3 font-black uppercase tracking-widest text-[11px]">
                       <t.Icon className={`w-4 h-4 ${activeTab === t.id ? 'text-accent' : 'text-text-muted'}`} />
                       <span className={activeTab === t.id ? 'text-accent' : 'text-text-primary'}>{t.label}</span>
                     </div>
                     <Plus className={`w-4 h-4 text-text-muted transition-transform duration-300 ${activeTab === t.id ? 'rotate-45 text-accent' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {activeTab === t.id && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                         <div className="p-4 border-t border-border/50 min-h-[100px]">
                           {renderTabContent(t.id)}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
              ))}
           </div>

           {/* Tab Content (Desktop) */}
           <div className="hidden md:block bg-panel-bg border border-border rounded-lg p-8 min-h-[500px]">
              <AnimatePresence mode="wait">
                {activeTab && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {renderTabContent(activeTab)}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>

    <SummonsManager 
      isOpen={isSummonsOpen} 
      onClose={() => setIsSummonsOpen(false)} 
    />
    <LevelUpModal 
      isOpen={isLevelUpOpen}
      onClose={() => setIsLevelUpOpen(false)}
      character={currentCharacter}
      onLevelUp={handleLevelUpConfirm}
    />
    </>
  );
}
