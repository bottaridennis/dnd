
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Shield, Zap, Dog, Bird, Cat, Bug, Fish, Sparkles, LogOut } from 'lucide-react';
import { useCharacter } from '../contexts/CharacterContext';
import { characterService } from '../services/characterService';

export interface CompanionStat {
  id: string;
  name: string;
  type: string;
  hp: number;
  ac: number;
  speed: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  skills?: string[];
  senses?: string[];
  traits?: { name: string, desc: string }[];
  actions?: { name: string, desc: string }[];
  icon: any;
}

const FAMILIARS: CompanionStat[] = [
  { 
    id: 'bat', name: 'Pipistrello', type: 'Bestia', hp: 1, ac: 12, speed: '1.5m, volo 9m', 
    str: 2, dex: 15, con: 8, int: 2, wis: 12, cha: 4,
    senses: ['Percezione Cieca 18m'],
    traits: [{ name: 'Udito Affinato', desc: 'Vantaggio alle prove di Saggezza (Percezione) basate sull\'udito.' }],
    icon: Bird 
  },
  { 
    id: 'cat', name: 'Gatto', type: 'Bestia', hp: 2, ac: 12, speed: '12m, scalare 9m', 
    str: 3, dex: 15, con: 10, int: 3, wis: 12, cha: 7,
    skills: ['Percezione +3', 'Furtività +4'],
    traits: [{ name: 'Olfatto Affinato', desc: 'Vantaggio alle prove di Saggezza (Percezione) basate sull\'olfatto.' }],
    icon: Cat 
  },
  { 
    id: 'hawk', name: 'Falco', type: 'Bestia', hp: 1, ac: 13, speed: '3m, volo 18m', 
    str: 2, dex: 16, con: 8, int: 2, wis: 14, cha: 6,
    skills: ['Percezione +4'],
    traits: [{ name: 'Vista Affinata', desc: 'Vantaggio alle prove di Saggezza (Percezione) basate sulla vista.' }],
    icon: Bird 
  },
  { 
    id: 'owl', name: 'Gufo', type: 'Bestia', hp: 1, ac: 11, speed: '1.5m, volo 18m', 
    str: 3, dex: 13, con: 8, int: 2, wis: 12, cha: 7,
    skills: ['Percezione +3', 'Furtività +3'],
    traits: [
        { name: 'Volo Silenzioso', desc: 'Non provoca attacchi di opportunità quando vola via dalla portata di un nemico.' },
        { name: 'Vista e Udito Affinati', desc: 'Vantaggio alle prove di Saggezza (Percezione) basate su vista o udito.' }
    ],
    icon: Bird 
  },
  { 
    id: 'spider', name: 'Ragno', type: 'Bestia', hp: 1, ac: 12, speed: '6m, scalare 6m', 
    str: 2, dex: 14, con: 8, int: 1, wis: 10, cha: 2,
    skills: ['Furtività +4'],
    traits: [
        { name: 'Scalare Ragni', desc: 'Può scalare superfici difficili e soffitti senza prove.' },
        { name: 'Senso della Tela', desc: 'Conosce la posizione di qualsiasi creatura a contatto con la sua tela.' }
    ],
    icon: Bug 
  },
  { 
    id: 'frog', name: 'Rana', type: 'Bestia', hp: 1, ac: 11, speed: '6m, nuoto 6m', 
    str: 1, dex: 13, con: 8, int: 1, wis: 8, cha: 3,
    traits: [
        { name: 'Anfibio', desc: 'Può respirare sia aria che acqua.' },
        { name: 'Salto in Lungo', desc: 'Il suo salto in lungo è fino a 3 metri.' }
    ],
    icon: Fish 
  },
  { 
    id: 'crab', name: 'Granchio', type: 'Bestia', hp: 2, ac: 11, speed: '6m, nuoto 6m', 
    str: 2, dex: 11, con: 10, int: 1, wis: 8, cha: 2,
    senses: ['Percezione Cieca 9m'],
    traits: [{ name: 'Anfibio', desc: 'Può respirare sia aria che acqua.' }],
    icon: Bug 
  }
];

interface CompanionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'familiar' | 'steed' | 'other';
}

export default function CompanionSheet({ isOpen, onClose, initialType = 'familiar' }: CompanionSheetProps) {
  const { currentCharacter, dispatch } = useCharacter();

  const [selectedCompanion, setSelectedCompanion] = useState<CompanionStat | null>(() => {
    if (currentCharacter?.companion?.id) {
      return FAMILIARS.find(f => f.id === currentCharacter.companion.id) || FAMILIARS[1];
    }
    return FAMILIARS[1];
  });

  const [currentHp, setCurrentHp] = useState(() => {
    return currentCharacter?.companion?.currentHp ?? (FAMILIARS.find(f => f.id === currentCharacter?.companion?.id)?.hp || 2);
  });

  // Sync when companion ID changes in context
  useEffect(() => {
    if (currentCharacter?.companion?.id) {
       const companion = FAMILIARS.find(f => f.id === currentCharacter.companion?.id);
       if (companion) {
          setSelectedCompanion(companion);
          setCurrentHp(currentCharacter.companion.currentHp);
       }
    }
  }, [currentCharacter?.companion?.id]);

  const handleUpdateCompanion = async (updates: Partial<{ id: string, currentHp: number, isActive: boolean }>) => {
    if (!currentCharacter) return;
    
    const newCompanion = {
      id: selectedCompanion?.id || 'cat',
      currentHp: currentHp,
      isActive: currentCharacter.companion?.isActive || false,
      ...updates
    };

    dispatch({ type: 'UPDATE_CHARACTER', payload: { companion: newCompanion } });
    try {
      await characterService.updateCharacter(currentCharacter.id, { companion: newCompanion });
    } catch (error) {
      console.error("Failed to update companion:", error);
    }
  };

  const toggleCompanion = async () => {
    if (!currentCharacter) return;
    const nextActive = !currentCharacter.companion?.isActive;
    
    await handleUpdateCompanion({ 
      id: selectedCompanion?.id, 
      currentHp: currentHp,
      isActive: nextActive 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-bg/95 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-panel-bg border border-accent/40 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Sidebar Selezione */}
        <div className="w-full md:w-64 border-r border-border bg-black/20 overflow-y-auto shrink-0 p-4">
           <div className="text-[10px] font-black uppercase text-accent tracking-[0.2em] mb-4">Seleziona Famiglio</div>
           <div className="space-y-2">
              {FAMILIARS.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedCompanion(f);
                    setCurrentHp(f.hp);
                    if (currentCharacter?.companion?.isActive) {
                      handleUpdateCompanion({ id: f.id, currentHp: f.hp });
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selectedCompanion?.id === f.id ? 'bg-accent text-bg border-accent' : 'bg-card-bg text-text-muted border-border hover:border-text-muted'
                  }`}
                >
                  <f.icon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase truncate">{f.name}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Content Area */}
        {selectedCompanion && (
          <div className="flex-1 flex flex-col overflow-y-auto">
             <header className="p-6 border-b border-border flex justify-between items-center bg-accent/5">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                      <selectedCompanion.icon className="w-6 h-6" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">{selectedCompanion.name}</h2>
                      <div className="text-[10px] font-black uppercase text-accent tracking-widest">{selectedCompanion.type} • GS 0</div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={toggleCompanion}
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                       currentCharacter?.companion?.isActive 
                       ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white'
                       : 'bg-accent text-bg shadow-lg hover:scale-105 active:scale-95'
                     }`}
                   >
                     {currentCharacter?.companion?.isActive ? (
                       <><LogOut className="w-3 h-3" /> Congeda</>
                     ) : (
                       <><Sparkles className="w-3 h-3" /> Evoca</>
                     )}
                   </button>
                   <button onClick={onClose} className="p-2 text-text-muted hover:text-white transition-colors border border-border rounded-lg">
                      <X className="w-5 h-5" />
                   </button>
                </div>
             </header>

             <div className="p-8 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                   <div className="bg-card-bg border border-border p-4 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                         <Heart className="w-4 h-4 text-success" />
                         <span className="text-[10px] font-black uppercase text-text-muted">Punti Ferita</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-2">
                         <input 
                           type="number"
                           value={currentHp}
                           onChange={(e) => {
                             const val = parseInt(e.target.value) || 0;
                             setCurrentHp(val);
                             handleUpdateCompanion({ currentHp: val });
                           }}
                           className="w-12 bg-transparent text-2xl font-serif font-black text-center focus:outline-none"
                         />
                         <span className="text-text-muted text-sm italic">/ {selectedCompanion.hp}</span>
                      </div>
                   </div>

                   <div className="bg-card-bg border border-border p-4 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                         <Shield className="w-4 h-4 text-primary" />
                         <span className="text-[10px] font-black uppercase text-text-muted">CA</span>
                      </div>
                      <div className="text-2xl font-serif font-black">{selectedCompanion.ac}</div>
                   </div>

                   <div className="bg-card-bg border border-border p-4 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                         <Zap className="w-4 h-4 text-yellow-500" />
                         <span className="text-[10px] font-black uppercase text-text-muted">Velocità</span>
                      </div>
                      <div className="text-sm font-bold uppercase leading-tight">{selectedCompanion.speed}</div>
                   </div>
                </div>

                {/* Ability Scores */}
                <div className="grid grid-cols-6 gap-2 border-y border-border py-6">
                   {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((ab) => {
                      const score = (selectedCompanion as any)[ab.toLowerCase()];
                      const mod = Math.floor((score - 10) / 2);
                      return (
                        <div key={ab} className="text-center">
                           <div className="text-[10px] font-black uppercase text-text-muted mb-1">{ab}</div>
                           <div className="text-sm font-black">{score}</div>
                           <div className="text-[10px] text-accent font-bold">({mod >= 0 ? `+${mod}` : mod})</div>
                        </div>
                      );
                   })}
                </div>

                {/* Features & Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase text-accent tracking-[0.2em] border-b border-accent/20 pb-2">Tratti e Sensi</h4>
                      {selectedCompanion.senses && (
                        <div className="text-xs text-text-muted">
                           <strong className="text-text-primary uppercase tracking-tighter">Sensi:</strong> {selectedCompanion.senses.join(', ')}
                        </div>
                      )}
                      <div className="space-y-4">
                        {selectedCompanion.traits?.map(trait => (
                           <div key={trait.name}>
                              <div className="text-xs font-black text-text-primary uppercase mb-1 tracking-tight">{trait.name}</div>
                              <p className="text-[11px] text-text-muted leading-relaxed italic">{trait.desc}</p>
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-xs font-black uppercase text-accent tracking-[0.2em] border-b border-accent/20 pb-2">Azioni</h4>
                      <div className="p-4 bg-accent/5 border border-accent/10 rounded-lg">
                         <div className="text-xs font-black text-text-primary uppercase mb-1 flex justify-between">
                            <span>Morso / Artigli</span>
                            <span className="text-accent underline">TxC: +0 / Danni: 1</span>
                         </div>
                         <p className="text-[11px] text-text-muted leading-relaxed">
                            Un famiglio non può attaccare, ma può usare la sua reazione per infliggere danni minimi o scaricare incantesimi a contatto forniti dal padrone.
                         </p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
