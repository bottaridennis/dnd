import React, { useState } from 'react';
import { ShieldAlert, Heart, Tent, Moon, Skull, Check, X, Dices } from 'lucide-react';
import { useCharacterState } from '../hooks/useCharacterState';
import { AnimatePresence, motion } from 'motion/react';

interface CombatAndRestsProps {
  maxHp: number;
  maxHitDice: number;
  conMod: number;
}

export default function CombatAndRests({ maxHp, maxHitDice, conMod }: CombatAndRestsProps) {
  // In a full implementation, these would sync to Context/Firestore
  // For this component sandbox, we use the custom hook locally
  const {
    hp, hitDice, exhaustion, deathSaves, isDead,
    takeDamage, heal, shortRest, longRest, rollDeathSave
  } = useCharacterState(Math.floor(maxHp * 0.8), maxHp, maxHitDice, conMod); // Initially slightly wounded for testing
  
  const [dmgInput, setDmgInput] = useState('');
  const [saveRoll, setSaveRoll] = useState('');

  const handleShortRestClick = () => {
    // Simuliamo di aver speso 1 Dado e tirato un 5
    if (hitDice > 0) {
      shortRest(1, [5]);
    }
  };

  return (
    <div className="bg-panel-bg p-8 border border-border rounded-lg space-y-8 shadow-inner animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <ShieldAlert className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Combattimento e Riposi</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Gestione HP */}
        <div className="space-y-4 p-5 bg-card-bg rounded border border-border/50">
          <div className="flex justify-between items-center mb-6">
             <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Punti Ferita</span>
                <span className="text-4xl font-serif font-black text-text-primary leading-none mt-1">
                  {hp} <span className="text-xl text-text-muted">/ {maxHp}</span>
                </span>
             </div>
             <Heart className={`w-8 h-8 ${hp === 0 ? 'text-red-500 animate-pulse' : 'text-success'}`} />
          </div>

          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Quantità" 
              value={dmgInput}
              onChange={(e) => setDmgInput(e.target.value)}
              className="w-full bg-bg border border-border rounded px-4 text-sm font-bold focus:border-accent/50 outline-none"
            />
            <button 
              onClick={() => { takeDamage(parseInt(dmgInput) || 0); setDmgInput(''); }}
              className="px-4 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-colors"
            >
              Subisci
            </button>
            <button 
              onClick={() => { heal(parseInt(dmgInput) || 0); setDmgInput(''); }}
              className="px-4 py-2 bg-success/20 text-success border border-success/30 rounded text-[10px] font-black uppercase hover:bg-success hover:text-white transition-colors"
            >
              Cura
            </button>
          </div>
        </div>

        {/* Death Saves (Mostrati solo a 0 HP) */}
        <AnimatePresence mode="wait">
          {hp === 0 ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`p-5 rounded border ${isDead ? 'border-red-500 bg-red-500/10' : 'border-red-500/50 bg-card-bg'} relative overflow-hidden`}
             >
                {isDead && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 backdrop-blur-sm z-10">
                    <div className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase"><Skull className="w-8 h-8"/> MORTALE</div>
                  </div>
                )}
                
                <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-4 flex items-center gap-2">
                   <Skull className="w-3 h-3" /> Tiri Salvezza Morte
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-success w-16">Successi</span>
                     <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-5 h-5 rounded-full border border-border flex items-center justify-center ${deathSaves.successes >= i ? 'bg-success border-success' : 'bg-bg'}`}>
                             {deathSaves.successes >= i && <Check className="w-3 h-3 text-white" />}
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] uppercase font-bold text-red-500 w-16">Fallimenti</span>
                     <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-5 h-5 rounded-full border border-border flex items-center justify-center ${deathSaves.failures >= i ? 'bg-red-500 border-red-500' : 'bg-bg'}`}>
                             {deathSaves.failures >= i && <X className="w-3 h-3 text-white" />}
                          </div>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                   <input 
                     type="number" max={20} min={1} placeholder="Tiro d20" 
                     value={saveRoll} onChange={(e) => setSaveRoll(e.target.value)}
                     className="w-20 bg-bg border border-border rounded px-2 text-center font-bold text-sm"
                   />
                   <button 
                     onClick={() => { rollDeathSave(parseInt(saveRoll)); setSaveRoll(''); }}
                     className="flex-1 bg-red-500 text-white rounded text-[10px] font-black uppercase tracking-widest"
                   >
                     Manda Tiro
                   </button>
                </div>
             </motion.div>
          ) : (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="p-5 bg-card-bg rounded border border-border/50 flex flex-col justify-between"
             >
               <div className="flex justify-between items-center mb-6">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Dadi Vita Utili</span>
                    <span className="text-4xl font-serif font-black text-text-primary leading-none mt-1">
                      {hitDice} <span className="text-xl text-text-muted">/ {maxHitDice}</span>
                    </span>
                 </div>
                 <Dices className="w-8 h-8 text-text-muted" />
               </div>

               <div className="flex gap-2">
                  <button 
                    onClick={handleShortRestClick}
                    disabled={hitDice === 0 || hp === maxHp}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-panel-bg border border-border rounded text-[10px] font-black uppercase text-accent hover:border-accent disabled:opacity-30 transition-colors"
                  >
                     <Tent className="w-4 h-4" /> Spendi 1 Dado
                  </button>
                  <button 
                    onClick={() => longRest()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg border border-accent rounded text-[10px] font-black uppercase shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                  >
                     <Moon className="w-4 h-4" /> Riposo Lungo
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
