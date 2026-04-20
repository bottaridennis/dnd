import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCharacter } from '../contexts/CharacterContext';
import { characterService } from '../services/characterService';
import { CharacterData } from '../contexts/CharacterContext';
import { Plus, Power, Users, ChevronRight, Wand2, Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  onNewCharacter: () => void;
  onOpenSheet: (id: string) => void;
}

export default function Dashboard({ onNewCharacter, onOpenSheet }: DashboardProps) {
  const { user, logout } = useAuth();
  const { state, dispatch } = useCharacter();
  const { characters, loading } = state;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // We no longer need local subscription here as it's handled in CharacterContext

  const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await characterService.deleteCharacter(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleSelect = (id: string) => {
    dispatch({ type: 'SELECT_CHARACTER', payload: id });
    onOpenSheet(id);
  };

  return (
    <div className="min-h-screen bg-bg p-8 md:p-16 flex flex-col items-center">
      
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card-bg border border-red-500/50 rounded-xl max-w-md w-full p-8 shadow-2xl relative"
            >
              <button onClick={cancelDelete} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
                 <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-6 text-red-500">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-xl font-black uppercase tracking-widest">Elimina Eroe</h3>
              </div>
              
              <p className="text-text-primary mb-8 leading-relaxed">
                Sei sicuro di voler eliminare permanentemente questo personaggio? Questa azione non può essere annullata.
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={cancelDelete}
                  className="px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-panel-bg hover:text-text-primary transition-colors"
                >
                  Annulla
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  Conferma Elimina
                </button>
              </div>
            </motion.div>
          </div>
         )}
      </AnimatePresence>

      <main className="w-full max-w-6xl">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Card */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewCharacter}
              className="group border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-4 text-text-muted hover:border-accent hover:text-accent transition-all h-[240px]"
            >
               <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <Plus className="w-8 h-8" />
               </div>
               <span className="text-sm font-black uppercase tracking-[0.2em]">Crea Personaggio</span>
            </motion.button>

            {/* Character Cards */}
            {characters.map((char) => (
              <motion.div 
                key={char.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleSelect(char.id)}
                className="group relative bg-panel-bg border border-border rounded-xl p-8 cursor-pointer hover:border-accent transition-all h-[240px] flex flex-col justify-between overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button onClick={(e) => handleDeleteRequest(e, char.id)} className="text-text-muted hover:text-red-500 bg-card-bg/80 backdrop-blur-sm p-2 rounded-full border border-border">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
                 
                 <div>
                    <h2 className="text-2xl font-serif font-black text-text-primary mb-1 group-hover:text-accent transition-colors">{char.name || 'Senza Nome'}</h2>
                    <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-4">Livello {char.level} • {char.alignment || 'Senza Allineamento'}</div>
                    
                    <div className="flex gap-2 relative z-0">
                       <span className="px-3 py-1 bg-bg border border-border rounded text-[10px] font-bold text-text-muted">{char.classId}</span>
                       <span className="px-3 py-1 bg-bg border border-border rounded text-[10px] font-bold text-text-muted">{char.speciesId}</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">Apri Scheda</span>
                    <ChevronRight className="w-4 h-4 text-accent transform group-hover:translate-x-1 transition-transform" />
                 </div>

                 <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />
              </motion.div>
            ))}
         </div>

         {loading && characters.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 animate-pulse">
              <Wand2 className="w-12 h-12 text-accent mb-4" />
              <p className="text-text-muted font-bold text-xs uppercase tracking-widest">Invocando i tuoi eroi...</p>
           </div>
         )}
      </main>
    </div>
  );
}
