import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp } from 'lucide-react';
import { CharacterData } from '../contexts/CharacterContext';
import { classesData } from '../data/rules2024';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterData;
  onLevelUp: (classId: string) => void;
}

export default function LevelUpModal({ isOpen, onClose, character, onLevelUp }: LevelUpModalProps) {
  if (!isOpen) return null;

  const currentClasses = character.classes || { [character.classId]: { level: character.level } };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-panel-bg border border-border rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full flex flex-col"
          style={{ maxHeight: 'calc(100vh - 40px)' }}
        >
          <div className="flex items-center justify-between p-6 border-b border-border bg-card-bg">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                 <TrendingUp className="w-5 h-5" />
               </div>
               <div>
                 <h2 className="text-xl font-serif font-black text-text-primary">Livello {character.level + 1}</h2>
                 <p className="text-sm text-text-muted">In quale classe vuoi avanzare?</p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-8">
             {/* Classi Attuali */}
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-accent tracking-widest px-2 relative after:content-[''] after:absolute after:top-1/2 after:left-32 after:right-0 after:h-px after:bg-border/50">Classi Attuali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.entries(currentClasses).map(([clsId, data]) => {
                      const classDef = classesData.find(c => c.id === clsId);
                      if (!classDef) return null;
                      return (
                        <button
                          key={clsId}
                          onClick={() => onLevelUp(clsId)}
                          className="group bg-card-bg border border-border rounded-lg p-6 hover:border-accent hover:bg-accent/5 transition-all text-left flex items-start justify-between"
                        >
                           <div>
                             <div className="font-serif font-black text-lg text-text-primary group-hover:text-accent transition-colors">{classDef.name}</div>
                             <div className="text-[11px] font-mono text-text-muted uppercase mt-1 tracking-tighter">
                               Diventa Livello {data.level + 1}
                             </div>
                           </div>
                           <TrendingUp className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all" />
                        </button>
                      );
                   })}
                </div>
             </div>

             {/* Multiclasse */}
             <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase text-text-muted tracking-widest px-2 relative after:content-[''] after:absolute after:top-1/2 after:left-32 after:right-0 after:h-px after:bg-border/50">Nuova Classe (Multiclasse)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {classesData.filter(c => !currentClasses[c.id]).map(classDef => (
                     <button
                       key={classDef.id}
                       onClick={() => onLevelUp(classDef.id)}
                       className="group bg-card-bg border border-border/50 rounded-lg p-4 hover:border-accent/50 hover:bg-accent/5 transition-all text-left flex items-center justify-between"
                     >
                        <div>
                          <div className="font-serif font-bold text-text-primary group-hover:text-text-primary transition-colors">{classDef.name}</div>
                        </div>
                        <span className="text-[9px] font-black uppercase text-accent opacity-0 group-hover:opacity-100 transition-all">Aggiungi</span>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
