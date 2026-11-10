import React, { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { weaponMasteryData, DAMAGE_TYPES } from '../constants/weaponMastery';
import {
  Sword,
  Info,
  ShieldCheck,
  X,
  Plus,
  Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { characterService } from '../services/characterService';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { findWeapon, standardWeapons } from '../data/weaponsData';
import { getWeaponMasteryCount } from '../lib/characterRules';
import { abilityMap } from '../lib/utils';
import { useDice } from '../contexts/DiceContext';

const PROPERTY_LABELS: Record<string, string> = {
  Finesse: 'Accurata', Light: 'Leggera', Heavy: 'Pesante', Reach: 'Portata', 'Two-Handed': 'A Due Mani',
  Loading: 'Ricarica', Thrown: 'Da Lancio', Versatile: 'Versatile', Ammunition: 'Munizioni',
};

const translateProperty = (prop: string) => {
  const [key, rest] = [prop.split(' (')[0], prop.includes('(') ? ` (${prop.split(' (').slice(1).join(' (')}` : ''];
  return `${PROPERTY_LABELS[key] || key}${rest}`;
};

export default function WeaponTracker({ isEditing = false }: { isEditing?: boolean }) {
  const { currentCharacter, dispatch } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const { rollCheck, rollDamage } = useDice();
  const [selectedMastery, setSelectedMastery] = useState<string | null>(null);
  const [activeDefTab, setActiveDefTab] = useState<'res' | 'imm' | 'vul'>('res');
  const [newMasteryWeapon, setNewMasteryWeapon] = useState('');

  if (!currentCharacter || !math) return null;

  const resistances = currentCharacter.resistances || [];
  const immunities = currentCharacter.immunities || [];
  const vulnerabilities = currentCharacter.vulnerabilities || [];
  const charWeaponMasteries = currentCharacter.weaponMasteries || {};
  const masteryLimit = getWeaponMasteryCount(currentCharacter);
  const masteredCount = Object.keys(charWeaponMasteries).length;

  const save = async (updates: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    try {
      await characterService.updateCharacter(currentCharacter.id, updates);
    } catch (error) {
      console.error('Salvataggio non riuscito:', error);
    }
  };

  const toggleDefense = (type: string, category: 'resistances' | 'immunities' | 'vulnerabilities') => {
    const list: string[] = (currentCharacter as any)[category] || [];
    save({ [category]: list.includes(type) ? list.filter(r => r !== type) : [...list, type] });
  };

  // PHB 2024: la proprietà di Maestria è fissa per ogni tipo di arma; la classe sceglie su quali tipi usarla
  const setMastery = (weaponName: string, mastery: string | null) => {
    const next = { ...charWeaponMasteries };
    if (mastery === null) delete next[weaponName];
    else next[weaponName] = mastery;
    save({ weaponMasteries: next });
  };

  const ownedWeapons: string[] = Array.from(new Set<string>(
    (currentCharacter.inventoryItems || [])
      .filter(item => item.damage || findWeapon(item.name))
      .map(item => findWeapon(item.name)?.name || item.name)
  ));
  const weaponList: string[] = Array.from(new Set<string>([...ownedWeapons, ...Object.keys(charWeaponMasteries)]));

  return (
    <div className="space-y-8">
      {/* Attacchi */}
      <div className="sheet-section overflow-hidden">
        <div className="sheet-section-title">
          <Crosshair className="w-3.5 h-3.5" /> Attacchi
          <span className="ml-auto text-[10px] normal-case tracking-normal font-sans font-normal">Clicca colpire o danni per tirare</span>
        </div>
        {math.attacks.length > 0 ? (
          <div className="divide-y divide-border/40">
            {math.attacks.map(attack => (
              <div key={attack.itemId} className="px-5 py-3 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                <div>
                  <div className="font-bold text-sm text-text-primary">{attack.name}</div>
                  <div className="text-[10px] text-text-muted">
                    {abilityMap[attack.ability]} · {attack.properties.map(translateProperty).join(', ') || 'Nessuna proprietà'}
                    {!attack.proficient && <span className="text-danger"> · Non competente</span>}
                    {attack.masteryActive && attack.mastery && <span className="text-accent"> · Maestria: {attack.mastery}</span>}
                  </div>
                </div>
                <button
                  onClick={() => rollCheck(`${attack.name}: tiro per colpire`, attack.attackBonus, { followUp: { label: `${attack.name}: danni ${attack.damageType}`, formula: attack.damage } })}
                  title="Tira per colpire"
                  className="text-center px-2 py-1 border border-transparent hover:border-accent"
                >
                  <div className="text-[9px] uppercase font-black text-text-muted">Colpire</div>
                  <div className="text-lg font-black text-accent">{attack.attackBonus >= 0 ? `+${attack.attackBonus}` : attack.attackBonus}</div>
                </button>
                <button
                  onClick={() => rollDamage(`${attack.name}: danni ${attack.damageType}`, attack.damage)}
                  title="Tira i danni"
                  className="text-center min-w-[90px] px-2 py-1 border border-transparent hover:border-accent"
                >
                  <div className="text-[9px] uppercase font-black text-text-muted">Danni</div>
                  <div className="text-sm font-black text-text-primary">{attack.damage}</div>
                  <div className="text-[9px] text-text-muted">{attack.damageType}</div>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-6 text-xs text-text-muted italic">Nessuna arma equipaggiata. Equipaggia un'arma dalla scheda Equipaggiamento per vedere tiro per colpire e danni.</p>
        )}
      </div>

      {/* Maestrie */}
      <div className="sheet-section">
        <div className="sheet-section-title">
          <Sword className="w-3.5 h-3.5" /> Maestria nelle armi
          <span className={`ml-auto text-[10px] font-black uppercase ${masteredCount > masteryLimit ? 'text-danger' : 'text-accent'}`}>{masteredCount} / {masteryLimit}</span>
        </div>
        <div className="p-4 space-y-4">
        {masteryLimit === 0 && <p className="text-xs text-text-muted">Le tue classi non concedono la Maestria nelle Armi (Barbaro, Guerriero, Paladino, Ranger e Ladro la ottengono al 1° livello; il talento Maestro d’Armi ne aggiunge una).</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {weaponList.map(name => {
            const data = findWeapon(name);
            const isMastered = name in charWeaponMasteries;
            const masteryName = charWeaponMasteries[name] || data?.mastery || '';
            const disabled = !isMastered && masteredCount >= masteryLimit;
            return (
              <div key={name} className={`p-4 rounded border ${isMastered ? 'border-accent bg-accent/5' : 'border-border bg-bg'}`}>
                <div className="flex items-center justify-between gap-2">
                  <label className={`flex items-center gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      className="accent-accent"
                      checked={isMastered}
                      disabled={disabled}
                      onChange={() => setMastery(name, isMastered ? null : (data?.mastery || 'Vex'))}
                    />
                    <span className="text-sm font-bold text-text-primary">{name}</span>
                  </label>
                  {masteryName && (
                    <button onClick={() => setSelectedMastery(masteryName)} className="flex items-center gap-1 text-[10px] font-black uppercase text-accent" title="Info Maestria">
                      {masteryName} <Info className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {!data && isMastered && (
                  <select value={masteryName} onChange={(e) => setMastery(name, e.target.value)} className="mt-2 w-full bg-card-bg border border-border rounded px-2 py-1 text-xs">
                    {Object.keys(weaponMasteryData).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                {masteryName && weaponMasteryData[masteryName] && <p className="text-[10px] text-text-muted mt-2">{weaponMasteryData[masteryName].description}</p>}
              </div>
            );
          })}
          {weaponList.length === 0 && <p className="text-xs text-text-muted italic col-span-full">Aggiungi armi all'inventario per sceglierne la Maestria.</p>}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-2 border-t border-border/50">
            <input
              list="weapon-names"
              type="text"
              placeholder="Aggiungi un tipo di arma (es. Mazza)…"
              value={newMasteryWeapon}
              onChange={(e) => setNewMasteryWeapon(e.target.value)}
              className="flex-1 bg-bg border border-border rounded px-3 py-2 text-xs"
            />
            <datalist id="weapon-names">{standardWeapons.map(w => <option key={w.id} value={w.name} />)}</datalist>
            <button
              onClick={() => {
                const name = newMasteryWeapon.trim();
                if (!name) return;
                const data = findWeapon(name);
                setMastery(data?.name || name, data?.mastery || 'Vex');
                setNewMasteryWeapon('');
              }}
              disabled={!newMasteryWeapon.trim()}
              className="px-3 rounded bg-accent text-bg disabled:opacity-30"
              aria-label="Aggiungi maestria"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Resistances, Immunities & Vulnerabilities Panel */}
      <div className="sheet-section overflow-hidden">
        <div className="sheet-section-title">
          <ShieldCheck className="w-3.5 h-3.5" /> Resistenze, immunità e vulnerabilità
        </div>
        <div className="p-4">
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
                    px-2 py-2.5 rounded border text-[9px] font-black uppercase tracking-normal transition-all duration-200
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
                  <h2 className="text-3xl font-serif font-black text-white uppercase tracking-normal leading-none">
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
