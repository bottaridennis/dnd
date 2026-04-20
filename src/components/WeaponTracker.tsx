
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { characterService } from '../services/characterService';

export default function WeaponTracker() {
  const { currentCharacter, dispatch } = useCharacter();
  const [selectedMastery, setSelectedMastery] = useState<string | null>(null);

  if (!currentCharacter) return null;

  // Resistances Logic
  const resistances = currentCharacter.resistances || [];
  const charWeaponMasteries = currentCharacter.weaponMasteries || {};

  const toggleResistance = async (type: string) => {
    const newResistances = resistances.includes(type)
      ? resistances.filter(r => r !== type)
      : [...resistances, type];

    dispatch({ type: 'UPDATE_CHARACTER', payload: { resistances: newResistances } });
    
    try {
      await characterService.updateCharacter(currentCharacter.id, { resistances: newResistances });
    } catch (error) {
      console.error("Failed to update resistances:", error);
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
          {(currentCharacter.equipment || []).map((item, idx) => {
            const masteryName = charWeaponMasteries[item] || defaultWeaponMasteries[item] || "";

            return (
              <div key={idx} className="bg-card-bg border border-border rounded-lg p-4 flex flex-col gap-3 group hover:border-accent/40 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-text-primary">{item}</span>
                  <Sword className="w-4 h-4 text-border group-hover:text-accent/20 transition-colors" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={masteryName}
                      onChange={(e) => updateWeaponMastery(item, e.target.value)}
                      className="flex-1 bg-bg border border-border rounded px-2 py-1 text-[10px] font-black uppercase text-text-primary focus:border-accent outline-none"
                    >
                      <option value="">Nessuna Maestria</option>
                      {Object.keys(weaponMasteryData).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {masteryName && (
                      <button
                        onClick={() => setSelectedMastery(masteryName)}
                        className="p-1.5 rounded bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                        title="Info Maestria"
                      >
                        <Info className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {masteryName && (
                    <div className="text-[9px] text-text-muted italic line-clamp-1">
                      {weaponMasteryData[masteryName].description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {(!currentCharacter.equipment || currentCharacter.equipment.length === 0) && (
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
          <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Resistenze e Difese</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAMAGE_TYPES.map((type) => {
              const isActive = resistances.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleResistance(type)}
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
            <div className="flex flex-col gap-1 items-center p-3 rounded-lg bg-bg/50 border border-border">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Resistenze</span>
              <span className="text-xl font-serif font-black text-text-primary">{resistances.length}</span>
            </div>
            <div className="flex flex-col gap-1 items-center p-3 rounded-lg bg-bg/50 border border-border">
              <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Immunità</span>
              <span className="text-xl font-serif font-black text-text-primary">0</span>
            </div>
            <div className="flex flex-col gap-1 items-center p-3 rounded-lg bg-bg/50 border border-border">
              <span className="text-[10px] font-black uppercase text-red-500/70 tracking-widest">Vulnerabilità</span>
              <span className="text-xl font-serif font-black text-text-primary">0</span>
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
