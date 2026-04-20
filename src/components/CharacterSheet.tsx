import React, { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { subclassesData } from '../data/subclasses';
import { RAW_SPELLS } from '../data/spells';
import { FEATURES } from '../data/features';
import { INVOCATIONS } from '../data/invocations';
import { 
  Shield, Heart, Zap, Eye, User, Scroll, 
  Sword, Book, Backpack, Save, Plus, Minus,
  TrendingUp, Dna, MapPin, Hash, Sparkles,
  Info, Search, Star, X
} from 'lucide-react';
import { formatModifier, abilityMap } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import CombatAndRests from './CombatAndRests';

export default function CharacterSheet() {
  const { currentCharacter, dispatch } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const [activeTab, setActiveTab] = useState<'stats' | 'spells' | 'feats' | 'equipment' | null>('stats');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItemText, setNewItemText] = useState('');
  const [featureModal, setFeatureModal] = useState<{isOpen: boolean, tab: 'spells'|'talenti'|'invocazioni'}>({ isOpen: false, tab: 'spells' });
  const [featureSearch, setFeatureSearch] = useState('');

  if (!currentCharacter || !math) return null;

  const charClass = classesData.find(c => c.id === currentCharacter.classId);
  const charSpecies = speciesData.find(s => s.id === currentCharacter.speciesId);
  const charBackground = backgroundsData.find(b => b.id === currentCharacter.backgroundId);

  const getSpellDetails = (name: string) => RAW_SPELLS.find(s => s.name === name);
  const getFeatDetails = (name: string) => {
    if (!name) return undefined;
    const exact = FEATURES.find(f => f.name === name);
    if (exact) return exact;
    const baseName = name.split(' (')[0];
    return FEATURES.find(f => f.name === baseName);
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

  const renderFeatureModal = () => {
    let base = [];
    if (featureModal.tab === 'spells') base = RAW_SPELLS;
    if (featureModal.tab === 'talenti') base = FEATURES;
    if (featureModal.tab === 'invocazioni') base = INVOCATIONS;

    const filteredData = base.filter((item: any) => 
      item.name.toLowerCase().includes(featureSearch.toLowerCase()) || 
      (item.displayName && item.displayName.toLowerCase().includes(featureSearch.toLowerCase()))
    );

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
            <div className="relative w-full max-w-2xl mx-auto">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
               <input 
                 type="text" 
                 placeholder="Cerca per nome..." 
                 value={featureSearch}
                 onChange={(e) => setFeatureSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-card-bg border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent/40 transition-colors"
               />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {filteredData.length > 0 ? filteredData.map((item: any, idx: number) => {
                 const listName = featureModal.tab === 'spells' ? 'spells' : (featureModal.tab === 'talenti' ? 'feats' : 'invocations');
                 const currentList = (currentCharacter as any)[listName] || [];
                 const isSelected = currentList.includes(item.name);

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
                             <span className="text-[10px] uppercase font-mono font-black text-text-muted tracking-tighter">
                               {item.level === 0 ? 'Trucchetto' : `Livello ${item.level}`} • {item.school}
                             </span>
                           )}
                           {item.prerequisite && <div className="text-[10px] text-accent/60 italic mt-1 font-medium">{item.prerequisite}</div>}
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
                       dangerouslySetInnerHTML={{ __html: item.description }}
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
    const nextHP = Math.max(0, Math.min(math.hpMax, currentCharacter.hpCurrent + amount));
    handleUpdate({ hpCurrent: nextHP });
  };

  const StatBox = ({ score, mod, ability }: any) => (
    <div className="relative bg-panel-bg border-2 md:border-4 border-accent/20 rounded-xl w-full pt-4 pb-5 md:pt-5 md:pb-6 flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105">
       <div className="absolute -top-3 bg-panel-bg px-1.5 md:px-3 rounded text-[9px] md:text-[10px] font-black uppercase text-text-primary tracking-widest border border-border whitespace-nowrap">
         {abilityMap[ability] || ability}
       </div>
       <div className="text-3xl md:text-4xl font-serif font-black text-text-primary my-1 md:my-2">
         {mod >= 0 ? `+${mod}` : mod}
       </div>
       <div className="absolute -bottom-3 md:-bottom-4 w-10 md:w-14 h-6 md:h-8 bg-bg border-2 border-accent/40 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-text-primary shadow-sm">
         {score}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg text-text-primary p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
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
                dangerouslySetInnerHTML={{ __html: selectedItem.description }}
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
        <div className="lg:col-span-1 flex items-center gap-4 bg-panel-bg p-6 rounded-lg border border-border">
           <div className="w-16 h-16 rounded-full bg-accent/20 flex shrink-0 items-center justify-center text-accent">
              <User className="w-8 h-8" />
           </div>
           <div className="flex-1">
              <h1 className="text-2xl font-serif font-black tracking-tight line-clamp-1">{currentCharacter.name || 'Senza Nome'}</h1>
              <div className="text-[10px] font-black uppercase text-accent tracking-widest mb-2">
                {charSpecies?.name} {charClass?.name}
              </div>
              {currentCharacter.level >= 3 && currentCharacter.classId && subclassesData[currentCharacter.classId] && (
                <select
                  value={currentCharacter.subclassId || ''}
                  onChange={(e) => handleUpdate({ subclassId: e.target.value })}
                  className="bg-bg border border-accent/30 rounded px-2 py-1 text-[10px] font-bold text-accent focus:border-accent outline-none w-full max-w-full"
                >
                  <option value="">-- Seleziona Sottoclasse --</option>
                  {subclassesData[currentCharacter.classId].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              )}
           </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* HP Tracker */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Punti Ferita</span>
                 <Heart className="w-3 h-3 text-success fill-success" />
              </div>
              <div className="flex items-center justify-between">
                 <button onClick={() => adjustHP(-1)} className="p-1 hover:text-accent"><Minus className="w-4 h-4" /></button>
                 <div className="text-2xl font-black text-text-primary">
                    {currentCharacter.hpCurrent} <span className="text-text-muted text-sm">/ {math.hpMax}</span>
                 </div>
                 <button onClick={() => adjustHP(1)} className="p-1 hover:text-accent"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
                 <div 
                   className="h-full bg-success transition-all" 
                   style={{ width: `${(currentCharacter.hpCurrent / math.hpMax) * 100}%` }} 
                 />
              </div>
           </div>

           {/* AC & Initiative */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex items-center justify-around">
              <div className="text-center">
                 <Shield className="w-4 h-4 text-accent mx-auto mb-1" />
                 <div className="text-xl font-black">{math.acBase}</div>
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
                 <div className="text-xl font-black">{math.speed}m</div>
                 <div className="text-[9px] uppercase font-black text-text-muted px-2 py-0.5 border border-border rounded mt-1">Velocità</div>
              </div>
              <div className="text-center">
                 <Hash className="w-4 h-4 text-accent mx-auto mb-1" />
                 <div className="text-xl font-black">+{math.proficiencyBonus}</div>
                 <div className="text-[9px] uppercase font-black text-text-muted px-2 py-0.5 border border-border rounded mt-1">Competenza</div>
              </div>
           </div>

           {/* Level & XP */}
           <div className="bg-panel-bg border border-border rounded-lg p-4 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1">
                 <span className="text-[10px] font-black uppercase text-accent">Livello {currentCharacter.level}</span>
                 <TrendingUp className="w-3 h-3 text-accent" />
              </div>
              <div className="flex gap-2">
                 <button 
                   onClick={() => handleUpdate({ level: Math.max(1, currentCharacter.level - 1) })}
                   className="flex-1 py-1 rounded border border-border text-[9px] font-black hover:bg-accent/10"
                 >LEVEL DOWN</button>
                 <button 
                   onClick={() => handleUpdate({ level: currentCharacter.level + 1 })}
                   className="flex-1 py-1 rounded bg-accent text-bg text-[9px] font-black shadow-sm"
                 >LEVEL UP</button>
              </div>
           </div>
        </div>
      </header>

      {/* Main Grid: Stats & Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ability Scores Sidebar */}
        <div className="lg:col-span-3 space-y-8 mt-2">
           <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-1 gap-x-2 lg:gap-x-4 gap-y-8">
              {Object.entries(math.scores).map(([ability, score]) => (
                <StatBox 
                  key={ability}
                  ability={ability}
                  score={score}
                  mod={math.mods[ability as keyof typeof math.mods]}
                />
              ))}
           </div>
           
           <div className="bg-panel-bg border border-border rounded-lg p-4 text-center shadow-sm">
              <div className="text-xs font-black uppercase text-text-muted mb-1 tracking-widest">Saggezza Passiva</div>
              <div className="text-3xl font-serif font-black text-accent">{math.passivePerception}</div>
           </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-9 space-y-6">

           {/* Rests & Combat Interactive Panel Sandbox */}
           <CombatAndRests 
              maxHp={math.hpMax} 
              maxHitDice={currentCharacter.level}
              conMod={math.mods.CON}
           />

           {/* Tab Navigation (Desktop) */}
           <div className="hidden md:flex p-1 bg-panel-bg border border-border rounded overflow-x-auto no-scrollbar">
              {[
                { id: 'stats', label: 'Abilità', Icon: Scroll },
                { id: 'spells', label: 'Incantesimi', Icon: Sparkles },
                { id: 'feats', label: 'Talenti', Icon: Book },
                { id: 'equipment', label: 'Equipaggiamento', Icon: Backpack },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
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
             {[
                { id: 'stats', label: 'Abilità', Icon: Scroll },
                { id: 'spells', label: 'Incantesimi', Icon: Sparkles },
                { id: 'feats', label: 'Talenti', Icon: Book },
                { id: 'equipment', label: 'Equipaggiamento', Icon: Backpack },
              ].map(t => (
                 <div key={t.id} className="bg-panel-bg border border-border rounded-lg overflow-hidden">
                   <button
                     onClick={() => setActiveTab(activeTab === t.id ? null as any : t.id as any)}
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
                         <div className="p-4 border-t border-border/50">
                           {/* Mobile Content wrapper */}
                           <div className="min-h-[100px]">
                              {/* Inject the relevant content immediately below using the same logic as desktop tab */}
                              {t.id === 'stats' && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                   {math.skills.map(skill => (
                                     <div key={skill.name} className="flex items-center justify-between border-b border-border/50 py-3 group hover:bg-accent/5 px-2 rounded-sm transition-colors">
                                        <div className="flex items-center gap-3">
                                           <div className={`w-2 h-2 rounded-full border ${skill.isProficient ? 'bg-accent border-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'border-border'}`} />
                                           <span className={`text-[11px] font-bold tracking-tight ${skill.isProficient ? 'text-text-primary' : 'text-text-muted'}`}>{skill.name}</span>
                                           <span className="text-[10px] text-text-muted/40 font-mono">({abilityMap[skill.ability] || skill.ability})</span>
                                        </div>
                                        <div className={`text-sm font-black ${skill.isProficient ? 'text-accent' : 'text-text-primary'}`}>
                                           {skill.mod >= 0 ? `+${skill.mod}` : skill.mod}
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                              )}
                              {t.id === 'spells' && (
                                 <div className="space-y-4">
                                   <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-sm font-serif font-bold text-accent">Libro degli Incantesimi</h4>
                                      <button onClick={() => setFeatureModal({ isOpen: true, tab: 'spells' })} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-accent">
                                         <Plus className="w-3 h-3" /> Aggiungi
                                      </button>
                                   </div>
                                   <div className="grid grid-cols-1 gap-2">
                                      {currentCharacter.spells.length > 0 ? currentCharacter.spells.map((s, i) => {
                                         const details = getSpellDetails(s);
                                         return (
                                           <div key={i} className="bg-card-bg border border-border rounded p-3 flex justify-between items-center group">
                                              <div className="flex flex-col">
                                                 <span className="font-bold text-xs">{details?.displayName || s}</span>
                                                 {details && <span className="text-[8px] text-text-muted uppercase font-black tracking-tighter">Livello {details.level} • {details.school}</span>}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                 <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent p-1">
                                                    <Info className="w-4 h-4" />
                                                 </button>
                                                 <button onClick={() => {
                                                    handleUpdate({ spells: currentCharacter.spells.filter(spell => spell !== s) });
                                                 }} className="text-text-muted hover:text-red-400 p-1">
                                                    <Plus className="w-3 h-3 rotate-45" />
                                                 </button>
                                              </div>
                                           </div>
                                         );
                                      }) : <div className="py-6 text-center text-text-muted italic text-[11px]">Nessun incantesimo.</div>}
                                   </div>
                                 </div>
                              )}
                              {t.id === 'feats' && (
                                 <div className="space-y-6">
                                    <div className="bg-card-bg border border-accent/20 rounded p-4">
                                       <div className="text-[9px] font-black uppercase text-accent tracking-widest mb-1">Talento d'Origine</div>
                                       <div className="flex justify-between items-center">
                                          <div className="text-sm font-serif font-bold">{currentCharacter.originFeat || 'Nessuno'}</div>
                                          {getFeatDetails(currentCharacter.originFeat) && (
                                            <button onClick={() => setSelectedItem(getFeatDetails(currentCharacter.originFeat))} className="text-accent underline text-[9px] font-black uppercase tracking-widest">Dettagli</button>
                                          )}
                                       </div>
                                    </div>
                                    <div className="space-y-3">
                                       <div className="flex items-center justify-between border-b border-border pb-1">
                                          <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest">Talenti e Invocazioni</h4>
                                          <button onClick={() => setFeatureModal({ isOpen: true, tab: 'talenti' })} className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-accent">
                                             <Plus className="w-3 h-3" /> Aggiungi
                                          </button>
                                       </div>
                                       <div className="grid grid-cols-1 gap-2">
                                          {currentCharacter.feats.map((f, i) => {
                                             const details = getFeatDetails(f);
                                             return (
                                               <div key={i} className="bg-card-bg border border-border rounded p-3 flex justify-between items-center group">
                                                  <div className="flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                                     <span className="font-bold text-xs tracking-tight">{details?.name || f}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                     {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent p-1"><Info className="w-3 h-3" /></button>}
                                                     <button onClick={() => handleUpdate({ feats: currentCharacter.feats.filter(feat => feat !== f) })} className="text-text-muted hover:text-red-400 p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                                                        <Plus className="w-3 h-3 rotate-45" />
                                                     </button>
                                                  </div>
                                               </div>
                                             );
                                          })}
                                          {currentCharacter.invocations.map((inv, i) => {
                                             const details = getInvocationDetails(inv);
                                             return (
                                               <div key={`inv-${i}`} className="bg-card-bg border border-accent/10 border-dashed rounded p-3 flex justify-between items-center group">
                                                  <div className="flex items-center gap-2">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                     <div className="flex flex-col">
                                                        <span className="font-bold text-[11px] tracking-tight">{details?.name || inv}</span>
                                                        <span className="text-[8px] font-black uppercase text-text-muted">Invocazione</span>
                                                     </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                     {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent p-1"><Info className="w-3 h-3" /></button>}
                                                     <button onClick={() => handleUpdate({ invocations: currentCharacter.invocations.filter(invocation => invocation !== inv) })} className="text-text-muted hover:text-red-400 p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                                                        <Plus className="w-3 h-3 rotate-45" />
                                                     </button>
                                                  </div>
                                               </div>
                                             );
                                          })}
                                       </div>
                                    </div>
                                 </div>
                              )}
                              {t.id === 'equipment' && (
                                 <div className="space-y-6">
                                    <div className="grid grid-cols-4 gap-2">
                                       {Object.entries(currentCharacter.currency).map(([type, value]) => (
                                          <div key={type} className="bg-card-bg border border-border rounded p-2 text-center">
                                             <div className="text-[9px] font-black uppercase text-text-muted mb-1">{type}</div>
                                             <input 
                                               type="number" 
                                               value={value} 
                                               onChange={(e) => handleUpdate({ currency: { ...currentCharacter.currency, [type]: parseInt(e.target.value) || 0 } })}
                                               className="w-full bg-transparent text-center text-sm font-black text-text-primary focus:outline-none"
                                             />
                                          </div>
                                       ))}
                                    </div>
              
                                    <div className="space-y-3">
                                       <div className="flex items-center justify-between">
                                          <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest">Inventario</h4>
                                       </div>
                                       <div className="grid grid-cols-1 gap-1.5">
                                          {currentCharacter.equipment.map((item, i) => (
                                             <div key={i} className="flex justify-between items-center bg-card-bg border border-border rounded px-3 py-1.5 text-[11px] font-medium">
                                                {item}
                                                <button onClick={() => {
                                                   handleUpdate({ equipment: currentCharacter.equipment.filter((_, idx) => idx !== i) });
                                                }} className="text-text-muted hover:text-accent"><Plus className="w-2 h-2 rotate-45" /></button>
                                             </div>
                                          ))}
                                       </div>
                                       <div className="flex gap-2">
                                          <input 
                                            type="text" 
                                            value={newItemText} 
                                            onChange={e => setNewItemText(e.target.value)} 
                                            placeholder="Nuovo oggetto..." 
                                            className="flex-1 bg-card-bg border border-border text-[11px] px-3 py-1.5 rounded focus:outline-none focus:border-accent font-medium text-text-primary"
                                            onKeyDown={e => {
                                              if (e.key === 'Enter' && newItemText.trim()) {
                                                handleUpdate({ equipment: [...currentCharacter.equipment, newItemText.trim()] });
                                                setNewItemText('');
                                              }
                                            }}
                                          />
                                          <button 
                                            onClick={() => {
                                              if (newItemText.trim()) {
                                                handleUpdate({ equipment: [...currentCharacter.equipment, newItemText.trim()] });
                                                setNewItemText('');
                                              }
                                            }}
                                            disabled={!newItemText.trim()}
                                            className="bg-accent text-bg px-2 py-1 rounded disabled:opacity-50 transition-colors flex items-center justify-center"
                                          >
                                            <Plus className="w-3 h-3" />
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
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
                 {activeTab === 'stats' && (
                   <motion.div 
                     key="stats"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4"
                   >
                     {math.skills.map(skill => (
                       <div key={skill.name} className="flex items-center justify-between border-b border-border/50 py-3 group hover:bg-accent/5 px-2 rounded-sm transition-colors">
                          <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full border ${skill.isProficient ? 'bg-accent border-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'border-border'}`} />
                             <span className={`text-[11px] font-bold tracking-tight ${skill.isProficient ? 'text-text-primary' : 'text-text-muted'}`}>{skill.name}</span>
                             <span className="text-[10px] text-text-muted/40 font-mono">({abilityMap[skill.ability] || skill.ability})</span>
                          </div>
                          <div className={`text-sm font-black ${skill.isProficient ? 'text-accent' : 'text-text-primary'}`}>
                             {skill.mod >= 0 ? `+${skill.mod}` : skill.mod}
                          </div>
                       </div>
                     ))}
                   </motion.div>
                 )}

                 {activeTab === 'spells' && (
                   <motion.div 
                     key="spells"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="space-y-4"
                   >
                     <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-serif font-bold text-accent">Libro degli Incantesimi</h4>
                        <button onClick={() => setFeatureModal({ isOpen: true, tab: 'spells' })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors">
                           <Plus className="w-3 h-3" /> Aggiungi
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentCharacter.spells.length > 0 ? currentCharacter.spells.map((s, i) => {
                           const details = getSpellDetails(s);
                           return (
                             <div key={i} className="bg-card-bg border border-border rounded p-4 flex justify-between items-center group">
                                <div className="flex flex-col">
                                   <span className="font-bold text-sm">{details?.displayName || s}</span>
                                   {details && <span className="text-[9px] text-text-muted uppercase font-black tracking-tighter">Livello {details.level} • {details.school}</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                   <button 
                                     onClick={() => setSelectedItem(details)}
                                     className="text-text-muted hover:text-accent transition-all"
                                   >
                                      <Info className="w-4 h-4" />
                                   </button>
                                   <button 
                                     onClick={() => {
                                        handleUpdate({ spells: currentCharacter.spells.filter(spell => spell !== s) });
                                     }}
                                     className="text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                   >
                                      <Plus className="w-4 h-4 rotate-45" />
                                   </button>
                                </div>
                             </div>
                           );
                        }) : <div className="col-span-full py-10 text-center text-text-muted italic text-sm">Nessun incantesimo memorizzato.</div>}
                     </div>
                   </motion.div>
                 )}

                 {activeTab === 'feats' && (
                   <motion.div 
                     key="feats"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="space-y-6"
                   >
                      <div className="bg-card-bg border border-accent/20 rounded p-6">
                         <div className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">Talento d'Origine</div>
                         <div className="flex justify-between items-center">
                            <div className="text-xl font-serif font-bold">{currentCharacter.originFeat || 'Nessuno'}</div>
                            {getFeatDetails(currentCharacter.originFeat) && (
                              <button onClick={() => setSelectedItem(getFeatDetails(currentCharacter.originFeat))} className="text-accent underline text-[10px] font-black uppercase tracking-widest hover:text-white">Dettagli</button>
                            )}
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between border-b border-border pb-2">
                            <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Talenti e Invocazioni</h4>
                            <button onClick={() => setFeatureModal({ isOpen: true, tab: 'talenti' })} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-accent transition-colors">
                               <Plus className="w-4 h-4" /> Aggiungi
                            </button>
                         </div>
                         <div className="grid grid-cols-1 gap-3">
                            {currentCharacter.feats.map((f, i) => {
                               const details = getFeatDetails(f);
                               return (
                                 <div key={i} className="bg-card-bg border border-border rounded p-4 flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                       <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#d4af37]" />
                                       <span className="font-bold text-sm tracking-tight">{details?.name || f}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent transition-all"><Info className="w-4 h-4" /></button>}
                                       <button onClick={() => handleUpdate({ feats: currentCharacter.feats.filter(feat => feat !== f) })} className="text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                          <Plus className="w-5 h-5 rotate-45" />
                                       </button>
                                    </div>
                                 </div>
                               );
                            })}
                            {currentCharacter.invocations.map((inv, i) => {
                               const details = getInvocationDetails(inv);
                               return (
                                 <div key={`inv-${i}`} className="bg-card-bg border border-accent/10 border-dashed rounded p-4 flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                       <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
                                       <div className="flex flex-col">
                                          <span className="font-bold text-sm tracking-tight">{details?.name || inv}</span>
                                          <span className="text-[9px] font-black uppercase text-text-muted tracking-widest">Invocazione</span>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       {details && <button onClick={() => setSelectedItem(details)} className="text-text-muted hover:text-accent transition-all"><Info className="w-4 h-4" /></button>}
                                       <button onClick={() => handleUpdate({ invocations: currentCharacter.invocations.filter(invocation => invocation !== inv) })} className="text-text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                          <Plus className="w-5 h-5 rotate-45" />
                                       </button>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                   </motion.div>
                 )}

                 {activeTab === 'equipment' && (
                   <motion.div 
                     key="equipment"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="space-y-8"
                   >
                      <div className="grid grid-cols-4 gap-4">
                         {Object.entries(currentCharacter.currency).map(([type, value]) => (
                            <div key={type} className="bg-card-bg border border-border rounded p-4 text-center">
                               <div className="text-[10px] font-black uppercase text-text-muted mb-1">{type}</div>
                               <input 
                                 type="number" 
                                 value={value} 
                                 onChange={(e) => handleUpdate({ currency: { ...currentCharacter.currency, [type]: parseInt(e.target.value) || 0 } })}
                                 className="w-full bg-transparent text-center text-lg font-black text-text-primary focus:outline-none"
                               />
                            </div>
                         ))}
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Inventario</h4>
                         </div>
                         <div className="grid grid-cols-1 gap-2">
                            {currentCharacter.equipment.map((item, i) => (
                               <div key={i} className="flex justify-between items-center bg-card-bg border border-border rounded px-4 py-2 text-xs font-medium">
                                  {item}
                                  <button onClick={() => {
                                      handleUpdate({ equipment: currentCharacter.equipment.filter((_, idx) => idx !== i) });
                                  }} className="text-text-muted hover:text-accent"><Plus className="w-3 h-3 rotate-45" /></button>
                               </div>
                            ))}
                         </div>
                         <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newItemText} 
                              onChange={e => setNewItemText(e.target.value)} 
                              placeholder="Nuovo oggetto..." 
                              className="flex-1 bg-card-bg border border-border text-xs px-4 py-2 rounded focus:outline-none focus:border-accent font-medium text-text-primary"
                              onKeyDown={e => {
                                if (e.key === 'Enter' && newItemText.trim()) {
                                  handleUpdate({ equipment: [...currentCharacter.equipment, newItemText.trim()] });
                                  setNewItemText('');
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                if (newItemText.trim()) {
                                  handleUpdate({ equipment: [...currentCharacter.equipment, newItemText.trim()] });
                                  setNewItemText('');
                                }
                              }}
                              disabled={!newItemText.trim()}
                              className="bg-accent text-bg px-4 py-2 rounded disabled:opacity-50 transition-colors flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                   </motion.div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
