
import React, { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { weaponMasteryData, DAMAGE_TYPES } from '../constants/weaponMastery';
import { 
  ShieldAlert, 
  Sword, 
  Info, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { characterService } from '../services/characterService';

export default function WeaponTracker({ isEditing = false }: { isEditing?: boolean }) {
  const { currentCharacter, dispatch } = useCharacter();
  const [selectedMastery, setSelectedMastery] = useState<string | null>(null);
  const [activeDefTab, setActiveDefTab] = useState<'res' | 'imm' | 'vul'>('res');
  const [newMasteryWeapon, setNewMasteryWeapon] = useState('');

  if (!currentCharacter) return null;

  // Resistances Logic
  const resistances = currentCharacter.resistances || [];
  const immunities = currentCharacter.immunities || [];
  const vulnerabilities = currentCharacter.vulnerabilities || [];
  const charWeaponMasteries = currentCharacter.weaponMasteries || {};

  const toggleDefense = async (type: string, category: 'resistances' | 'immunities' | 'vulnerabilities') => {
    const list = (currentCharacter as any)[category] || [];
    const newList = list.includes(type)
      ? list.filter((r: string) => r !== type)
      : [...list, type];

    dispatch({ type: 'UPDATE_CHARACTER', payload: { [category]: newList } });
    
    try {
      await characterService.updateCharacter(currentCharacter.id, { [category]: newList });
    } catch (error) {
      console.error(`Failed to update ${category}:`, error);
    }
  };

  const updateWeaponMastery = async (weaponName: string, mastery: string) => {
    const newMasteries = { ...charWeaponMasteries, [weaponName]: mastery };
    dispatch({ type: 'UPDATE_CHARACTER', payload: { weaponMasteries: newMasteries } });
    try {
      await characterService.updateCharacter(currentCharacter.id, { weaponMasteries: newMasteries });
    } catch (error) {
      console.error("Failed to update weapon mastery:", error);
    }
  };

  // Predefined weapon-mastery mapping as fallback
  const defaultWeaponMasteries: Record<string, string> = {
    "Spada Lunga": "Sap",
    "Pugnale": "Nick",
    "Spadone": "Cleave",
    "Arco Lungo": "Slow",
    "Alabarda": "Topple",
    "Martello da Guerra": "Push",
    "Ascia da Battaglia": "Topple",
    "Rapiere": "Vex"
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Weapon Mastery Panel */}
      <div className="bg-panel-bg border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-accent/10 px-6 py-4 border-b border-border flex items-center gap-3">
          <Sword className="w-5 h-5 text-accent" />
          <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Maestrie delle Armi</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Display all mastered weapons (from character data or equipment) */}
          {Array.from(new Set([...(currentCharacter.equipment || []), ...Object.keys(charWeaponMasteries)])).map((item, idx) => {
            const masteryName = charWeaponMasteries[item] || defaultWeaponMasteries[item] || "";

            return (
              <div key={idx} className="bg-card-bg border border-border rounded-lg p-5 flex flex-col gap-4 group hover:border-accent/40 transition-all shadow-sm hover:shadow-md">
                <div className="flex justify-between items-center pb-2 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <Sword className="w-4 h-4 text-accent/40 group-hover:text-accent transition-colors shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-tight text-text-primary line-clamp-1">{item}</span>
                  </div>
                  {isEditing && charWeaponMasteries[item] && (
                     <button 
                       onClick={() => {
                          const newMasteries = { ...charWeaponMasteries };
                          delete newMasteries[item];
                          dispatch({ type: 'UPDATE_CHARACTER', payload: { weaponMasteries: newMasteries } });
                          characterService.updateCharacter(currentCharacter.id, { weaponMasteries: newMasteries });
                       }}
                       className="p-1 text-text-muted hover:text-red-500 transition-colors"
                       title="Rimuovi Maestria"
                     >
                       <X className="w-3.5 h-3.5" />
                     </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={masteryName}
                      onChange={(e) => updateWeaponMastery(item, e.target.value)}
                      className="flex-1 bg-bg/50 border border-border rounded px-3 py-1.5 text-[10px] font-black uppercase text-text-primary focus:border-accent focus:bg-bg outline-none transition-all cursor-pointer"
                    >
                      <option value="">Nessuna Maestria</option>
                      {Object.keys(weaponMasteryData).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {masteryName && (
                      <button
                        onClick={() => setSelectedMastery(masteryName)}
                        className="p-2 rounded bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all shadow-sm shrink-0"
                        title="Info Maestria"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {masteryName && (
                    <div className="text-[10px] text-text-muted italic leading-relaxed line-clamp-2 px-1">
                      {weaponMasteryData[masteryName].description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {isEditing && (
            <div className="bg-card-bg border border-accent/20 border-dashed rounded-lg p-4 flex flex-col gap-3 group hover:border-accent/40 transition-all">
              <div className="text-[10px] font-black uppercase text-accent tracking-widest">Aggiungi Arma Manuale</div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Nome arma (es. Mazza)..."
                  value={newMasteryWeapon}
                  onChange={(e) => setNewMasteryWeapon(e.target.value)}
                  className="flex-1 bg-bg border border-border rounded px-2 py-1 text-[10px] font-black uppercase text-text-primary focus:border-accent outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMasteryWeapon.trim()) {
                      updateWeaponMastery(newMasteryWeapon.trim(), "Slow");
                      setNewMasteryWeapon('');
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    if (newMasteryWeapon.trim()) {
                      updateWeaponMastery(newMasteryWeapon.trim(), "Slow");
                      setNewMasteryWeapon('');
                    }
                  }}
                  className="bg-accent text-bg p-1.5 rounded disabled:opacity-50"
                  disabled={!newMasteryWeapon.trim()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[8px] text-text-muted italic">Aggiungi un'arma per assegnarle una maestria personalizzata.</p>
            </div>
          )}
          {(!currentCharacter.equipment || currentCharacter.equipment.length === 0) && !isEditing && (
            <div className="col-span-full py-8 text-center text-text-muted italic text-sm">
              Nessuna arma equipaggiata con Maestria
            </div>
          )}
        </div>
      </div>

      {/* Resistances, Immunities & Vulnerabilities Panel */}
      <div className="bg-panel-bg border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-primary/10 px-6 py-4 border-b border-border flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Difese Speciali</h3>
        </div>
        <div className="p-6">
          <div className="flex bg-bg rounded border border-border p-1 w-full max-w-sm mb-6 mx-auto sm:mx-0 overflow-x-auto no-scrollbar">
             <button 
               onClick={() => setActiveDefTab('res')}
               className={`flex-1 px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeDefTab === 'res' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
             >Resistenza</button>
             <button 
               onClick={() => setActiveDefTab('imm')}
               className={`flex-1 px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeDefTab === 'imm' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
             >Immunità</button>
             <button 
               onClick={() => setActiveDefTab('vul')}
               className={`flex-1 px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all whitespace-nowrap ${activeDefTab === 'vul' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
             >Vulnerabilità</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAMAGE_TYPES.map((type) => {
              const currentList = activeDefTab === 'res' ? resistances : (activeDefTab === 'imm' ? immunities : vulnerabilities);
              const category = activeDefTab === 'res' ? 'resistances' : (activeDefTab === 'imm' ? 'immunities' : 'vulnerabilities');
              const isActive = currentList.includes(type);
              
              return (
                <button
                  key={type}
                  onClick={() => toggleDefense(type, category)}
                  className={`
                    px-2 py-2.5 rounded border text-[9px] font-black uppercase tracking-tighter transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105 z-10' 
                      : 'bg-bg text-text-muted border-border hover:border-primary/50 hover:text-primary'}
                  `}
                >
                  {type}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-6">
            <div className={`flex flex-col gap-1 items-center p-3 rounded-lg bg-bg/50 border transition-all ${activeDefTab === 'res' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Resistenze</span>
              <span className="text-xl font-serif font-black text-text-primary">{resistances.length}</span>
            </div>
            <div className={`flex flex-col gap-1 items-center p-3 rounded-lg bg-bg/50 border transition-all ${activeDefTab === 'imm' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
              <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Immunità</span>
              <span className="text-xl font-serif font-black text-text-primary">{immunities.length}</span>
            </div>
            <div className={`flex flex-col gap-1 items-center p-3 rounded-lg bg-bg/50 border transition-all ${activeDefTab === 'vul' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
              <span className="text-[10px] font-black uppercase text-red-500/70 tracking-widest">Vulnerabilità</span>
              <span className="text-xl font-serif font-black text-text-primary">{vulnerabilities.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mastery Info Modal */}
      <AnimatePresence>
        {selectedMastery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] border-2 border-accent rounded-xl max-w-md w-full p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedMastery(null)}
                className="absolute top-4 right-4 text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 flex items-center gap-4">
                <div className="bg-accent/20 p-3 rounded-lg border border-accent/40">
                  <Sword className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-black text-white uppercase tracking-tighter leading-none">
                    {weaponMasteryData[selectedMastery].name}
                  </h2>
                  <p className="text-xs text-accent font-black uppercase tracking-widest mt-1">
                    Proprietà di Maestria
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                  <p className="text-sm italic text-gray-300 leading-relaxed">
                    "{weaponMasteryData[selectedMastery].description}"
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Effetto Meccanico</h4>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {weaponMasteryData[selectedMastery].effect}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMastery(null)}
                className="w-full mt-8 py-3 bg-accent text-white font-black uppercase tracking-widest rounded shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
              >
                Chiudi
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
