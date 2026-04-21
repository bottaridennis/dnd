
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, Heart, Shield, Zap, Sparkles, LogOut, 
  ChevronDown, Wand2, Info, Sword, Ghost, Github, 
  CircleUserRound, Settings2
} from 'lucide-react';
import { useSummons } from '../hooks/useSummons';
import { SUMMONS_DATA } from '../data/summons';
import { ActiveSummon } from '../types/summons';
import * as LucideIcons from 'lucide-react';

interface SummonsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SummonsManager({ isOpen, onClose }: SummonsManagerProps) {
  const { activeSummons, summonCreature, summonHomebrew, dismissSummon, updateSummonHp } = useSummons();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SUMMONS_DATA[0].id);
  const [spellLevel, setSpellLevel] = useState(4);
  const [isHomebrewMode, setIsHomebrewMode] = useState(false);
  
  // Homebrew State
  const [hbName, setHbName] = useState('');
  const [hbHp, setHbHp] = useState(1);
  const [hbAc, setHbAc] = useState(10);
  const [hbSpeed, setHbSpeed] = useState('9m');

  const selectedTemplate = SUMMONS_DATA.find(s => s.id === selectedTemplateId);
  const requiresLevel = selectedTemplate?.category === 'Scaling' && !isHomebrewMode;

  const handleSummon = async () => {
    // In a full app, this would come from character stats
    const playerStats = { spellAttackModifier: 7 }; 
    
    if (isHomebrewMode) {
        if (!hbName) return;
        await summonHomebrew({
            name: hbName,
            maxHp: hbHp,
            ac: hbAc,
            speed: hbSpeed
        });
    } else {
        await summonCreature(selectedTemplateId, spellLevel, playerStats);
    }
    setIsAddOpen(false);
    setIsHomebrewMode(false);
    setHbName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-bg/95 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-panel-bg border border-accent/40 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <header className="p-6 border-b border-border flex justify-between items-center bg-accent/5 shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent text-bg flex items-center justify-center">
                 <Sparkles className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-2xl font-serif font-black text-text-primary tracking-tight">Gestore Evocazioni</h2>
                 <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">D&D 5.5e Summoning Manager</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAddOpen(true)}
                className="hidden md:flex items-center gap-2 bg-accent text-bg px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" /> Nuova Evocazione
              </button>
              <button onClick={onClose} className="p-3 bg-card-bg border border-border rounded-xl text-text-muted hover:text-white transition-colors">
                 <X className="w-6 h-6" />
              </button>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
           {activeSummons.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[2.5rem] bg-black/10 py-20 px-6 text-center">
                 <div className="w-24 h-24 rounded-full bg-accent/5 flex items-center justify-center mb-8">
                    <Github className="w-12 h-12 text-accent/30" />
                 </div>
                 <h3 className="text-3xl font-serif font-black text-text-primary mb-4 italic">Il tuo cerchio è vuoto</h3>
                 <p className="text-text-muted max-w-md mx-auto mb-8 font-medium">Non hai creature evocate al momento. Usa il pulsante "Nuova Evocazione" per iniziare a popolare il tuo esercito magico.</p>
                 <button 
                  onClick={() => setIsAddOpen(true)}
                  className="bg-accent text-bg px-10 py-4 rounded-2xl font-black uppercase tracking-[0.3em] hover:scale-110 active:scale-95 transition-all shadow-xl shadow-accent/20"
                >
                  Inizia Evocazione
                </button>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 <AnimatePresence>
                    {activeSummons.map(summon => (
                      <SummonCard 
                        key={summon.instanceId} 
                        summon={summon} 
                        onDismiss={() => dismissSummon(summon.instanceId)}
                        onHpChange={(hp) => updateSummonHp(summon.instanceId, hp)}
                      />
                    ))}
                 </AnimatePresence>
                 {/* Mobile Add Button Sticker */}
                 <button 
                   onClick={() => setIsAddOpen(true)}
                   className="md:hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-accent/20 rounded-3xl bg-accent/5 text-accent hover:bg-accent/10 transition-colors"
                 >
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Aggiungi</span>
                 </button>
              </div>
           )}
        </div>

        {/* Mobile footer add button */}
        <div className="md:hidden p-4 border-t border-border bg-panel-bg shrink-0">
           <button 
            onClick={() => setIsAddOpen(true)}
            className="w-full bg-accent text-bg py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2"
           >
             <Plus className="w-5 h-5" /> Nuova Evocazione
           </button>
        </div>
      </motion.div>

      {/* Add Summon Modal (Nested) */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-panel-bg border border-accent/40 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Wand2 className="text-accent w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-serif font-black">Evoca Creatura</h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-text-muted" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Tabs für Normal vs Homebrew */}
                <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5 mb-4">
                   <button 
                    onClick={() => setIsHomebrewMode(false)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!isHomebrewMode ? 'bg-accent text-bg shadow-sm' : 'text-text-muted'}`}
                   >
                     Regolamento
                   </button>
                   <button 
                    onClick={() => setIsHomebrewMode(true)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${isHomebrewMode ? 'bg-accent text-bg shadow-sm' : 'text-text-muted'}`}
                   >
                     Homebrew
                   </button>
                </div>

                {!isHomebrewMode ? (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-accent tracking-widest block mb-2 px-1">Tipologia di Evocazione</label>
                      <div className="relative">
                        <select 
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full bg-card-bg border border-border rounded-xl px-4 py-4 text-sm font-bold focus:border-accent outline-none appearance-none pr-10"
                        >
                          <optgroup label="Basic Summons">
                            {SUMMONS_DATA.filter(s => s.category === 'Basic').map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Pact of the Chain">
                            {SUMMONS_DATA.filter(s => s.category === 'Pact').map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Scaling Spirits (Spells)">
                            {SUMMONS_DATA.filter(s => s.category === 'Scaling').map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </optgroup>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      </div>
                    </div>

                    {requiresLevel && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                      >
                        <label className="text-[10px] font-black uppercase text-accent tracking-widest block px-1">Livello Slot Incantesimo</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[4, 5, 6, 7, 8, 9].map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => setSpellLevel(lvl)}
                              className={`py-3 rounded-xl text-xs font-black transition-all border ${
                                spellLevel === lvl ? 'bg-accent text-bg border-accent shadow-lg shadow-accent/20' : 'bg-card-bg text-text-muted border-border hover:border-accent/40'
                              }`}
                            >
                              LVL {lvl}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/10 rounded-xl mt-2">
                           <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                           <p className="text-[9px] text-text-muted leading-relaxed uppercase font-black">Nota: Le statistiche scaleranno automaticamente in base al livello selezionato.</p>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase text-accent tracking-widest block mb-2">Nome Creatura</label>
                        <input 
                          type="text"
                          value={hbName}
                          onChange={(e) => setHbName(e.target.value)}
                          placeholder="es. Drago Tascabile"
                          className="w-full bg-card-bg border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-accent outline-none"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-accent tracking-widest block mb-2">PF Massimi</label>
                           <input 
                              type="number"
                              value={hbHp}
                              onChange={(e) => setHbHp(parseInt(e.target.value) || 1)}
                              className="w-full bg-card-bg border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-accent outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-accent tracking-widest block mb-2">Classe Armatura</label>
                           <input 
                              type="number"
                              value={hbAc}
                              onChange={(e) => setHbAc(parseInt(e.target.value) || 10)}
                              className="w-full bg-card-bg border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-accent outline-none"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase text-accent tracking-widest block mb-2">Velocità</label>
                        <input 
                          type="text"
                          value={hbSpeed}
                          onChange={(e) => setHbSpeed(e.target.value)}
                          placeholder="es. 9m, volo 18m"
                          className="w-full bg-card-bg border border-border rounded-xl px-4 py-3 text-sm font-bold focus:border-accent outline-none"
                        />
                     </div>
                  </div>
                )}

                <div className="pt-6">
                  <button 
                    onClick={handleSummon}
                    className="w-full bg-accent text-bg py-5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                  >
                    <Sparkles className="w-5 h-5" /> Conferma Evocazione
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SummonCard: React.FC<{ 
  summon: ActiveSummon; 
  onDismiss: () => void | Promise<void>;
  onHpChange: (hp: number) => void | Promise<void>;
}> = ({ summon, onDismiss, onHpChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Find icons safely
  const Icon = (LucideIcons as any)[summon.iconName] || LucideIcons.Dog;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-card-bg border border-border rounded-[2rem] overflow-hidden shadow-2xl group flex flex-col h-full"
    >
      <header className={`p-5 transition-colors flex items-center justify-between ${summon.category === 'Homebrew' ? 'bg-purple-500/10' : 'bg-accent/5'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent text-bg flex items-center justify-center shadow-lg shadow-accent/20">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-serif font-black text-text-primary leading-tight">{summon.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase text-accent tracking-[0.2em]">
                {summon.category === 'Scaling' ? `Spell Lvl ${summon.spellLevel}` : summon.category}
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-[8px] font-bold text-text-muted italic">{summon.speed}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onDismiss}
          className="p-3 text-text-muted hover:text-white transition-colors bg-black/30 rounded-xl hover:bg-red-500 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
        {/* Vital Stats */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-panel-bg border border-border p-4 rounded-3xl flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2 text-[9px] font-black uppercase text-text-muted tracking-widest">
                 <Heart className="w-3.5 h-3.5 text-red-500" /> Salute
              </div>
              <div className="flex items-center gap-5 scale-110">
                 <button onClick={() => onHpChange(summon.currentHp - 1)} className="text-red-500 font-black text-2xl hover:scale-125 transition-transform">－</button>
                 <div className="text-2xl font-serif font-black flex flex-col items-center">
                   <span>{summon.currentHp}</span>
                   <span className="text-[10px] text-text-muted font-sans font-bold -mt-1 uppercase tracking-tighter">PF MAX: {summon.maxHp}</span>
                 </div>
                 <button onClick={() => onHpChange(summon.currentHp + 1)} className="text-emerald-500 font-black text-2xl hover:scale-125 transition-transform">＋</button>
              </div>
           </div>
           <div className="bg-panel-bg border border-border p-4 rounded-3xl flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-2 text-[9px] font-black uppercase text-text-muted tracking-widest">
                 <Shield className="w-3.5 h-3.5 text-accent" /> Armatura
              </div>
              <div className="text-3xl font-serif font-black">{summon.ac}</div>
           </div>
        </div>

        {/* Ability Scores Mini */}
        <div className="grid grid-cols-6 gap-1 bg-black/10 p-3 rounded-2xl border border-white/5">
           {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(ab => (
              <div key={ab} className="text-center">
                 <div className="text-[7px] font-black text-accent mb-0.5">{ab}</div>
                 <div className="text-[10px] font-bold text-text-primary">{(summon as any)[ab.toLowerCase()]}</div>
              </div>
           ))}
        </div>

        {/* Actions Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[8px] font-black uppercase text-accent tracking-[0.3em]">Azioni & Tratti</span>
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-[8px] font-bold text-text-muted uppercase hover:text-accent transition-colors">
              {isExpanded ? 'Chiudi' : 'Espandi'}
            </button>
          </div>
          
          <div className={`space-y-2 transition-all overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-24'}`}>
            {summon.actions.map(action => (
              <div key={action.name} className="p-4 bg-accent/5 rounded-2xl border border-accent/10 hover:border-accent/40 transition-all cursor-default">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-black uppercase text-text-primary tracking-tight">{action.name}</span>
                  <Sword className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[10px] text-text-muted leading-tight">{action.desc}</p>
              </div>
            ))}
            {summon.traits.map(trait => (
              <div key={trait.name} className="p-3 bg-black/20 rounded-xl border border-white/5 italic">
                <span className="text-[9px] font-black uppercase text-text-muted/80 block mb-1">{trait.name}</span>
                <p className="text-[9px] text-text-muted/60 leading-relaxed">{trait.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
