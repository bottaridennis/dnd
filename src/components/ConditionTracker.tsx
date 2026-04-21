
import React from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { characterService } from '../services/characterService';
import { AlertCircle, Skull, Zap, EyeOff, ShieldOff, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CONDITIONS = [
  { id: 'accecato', name: 'Accecato', icon: EyeOff },
  { id: 'affascinato', name: 'Affascinato', icon: HeartIcon },
  { id: 'assordato', name: 'Assordato', icon: VolumeXIcon },
  { id: 'spaventato', name: 'Spaventato', icon: GhostIcon },
  { id: 'afferrato', name: 'Afferrato', icon: HandIcon },
  { id: 'incapacitato', name: 'Incapacitato', icon: ShieldOff },
  { id: 'invisibile', name: 'Invisibile', icon: GhostIcon },
  { id: 'paralizzato', name: 'Paralizzato', icon: ZapOffIcon },
  { id: 'pietrificato', name: 'Pietrificato', icon: MountainIcon },
  { id: 'avvelenato', name: 'Avvelenato', icon: Skull },
  { id: 'prono', name: 'Prono', icon: ChevronDownIcon },
  { id: 'immobilizzato', name: 'Immobilizzato', icon: AnchorIcon },
  { id: 'stordito', name: 'Stordito', icon: Zap },
  { id: 'privo_di_sensi', name: 'Privo di Sensi', icon: MoonIcon },
];

export default function ConditionTracker() {
  const { currentCharacter, dispatch } = useCharacter();

  if (!currentCharacter) return null;

  const activeConditions = currentCharacter.conditions || [];
  const exhaustion = currentCharacter.exhaustion || 0;

  const toggleCondition = (conditionId: string) => {
    const newConditions = activeConditions.includes(conditionId)
      ? activeConditions.filter(c => c !== conditionId)
      : [...activeConditions, conditionId];
    
    handleUpdate({ conditions: newConditions });
  };

  const updateExhaustion = (val: number) => {
    const nextVal = Math.max(0, Math.min(6, val));
    handleUpdate({ exhaustion: nextVal });
    
    if (nextVal === 6) {
      // Small delay to allow state to settle
      setTimeout(() => alert("Il personaggio è morto per esaurimento (Livello 6)."), 100);
    }
  };

  const handleUpdate = async (updates: any) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    await characterService.updateCharacter(currentCharacter.id, updates);
  };

  return (
    <div className="bg-panel-bg border border-border rounded-xl p-6 shadow-sm space-y-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-accent" />
          <h3 className="font-serif font-black text-lg text-text-primary uppercase tracking-tight">Condizioni ed Esaurimento</h3>
        </div>
        {exhaustion > 0 && (
           <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
             <AlertCircle className="w-3 h-3" />
             Malus: -{exhaustion * 2} d20 / -{exhaustion * 1.5}m Speed
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tracker Esaurimento */}
        <div className="space-y-4">
           <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex justify-between items-center">
             <span>Esaurimento</span>
             <span className={exhaustion >= 5 ? 'text-red-500' : 'text-text-primary'}>Livello {exhaustion} / 6</span>
           </div>
           
           <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((lv) => (
                <button
                  key={lv}
                  onClick={() => updateExhaustion(lv)}
                  className={`flex-1 h-12 rounded-lg border transition-all flex flex-col items-center justify-center ${
                    exhaustion >= lv 
                      ? (lv === 6 ? 'bg-red-600 border-red-700 text-white' : 'bg-accent/20 border-accent text-accent') 
                      : 'bg-card-bg border-border text-text-muted hover:border-text-muted'
                  }`}
                >
                  <span className="text-sm font-bold">{lv}</span>
                  {lv === 6 && <Skull className="w-3 h-3 mt-1" />}
                </button>
              ))}
           </div>
           
           <p className="text-[10px] text-text-muted italic leading-relaxed">
             Ogni livello sottrae 2 ad ogni D20 Test e riduce la velocità di 1.5m. Al livello 6 il personaggio muore.
           </p>
        </div>

        {/* Lista Condizioni */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CONDITIONS.map((cond) => {
            const isActive = activeConditions.includes(cond.id);
            const Icon = cond.icon;
            return (
              <button
                key={cond.id}
                onClick={() => toggleCondition(cond.id)}
                className={`flex items-center gap-2 p-2.5 rounded border transition-all text-left ${
                  isActive 
                    ? 'bg-accent text-bg border-accent shadow-sm' 
                    : 'bg-card-bg text-text-muted border-border hover:border-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold tracking-tight uppercase truncate">{cond.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Simple Icons since lucide might not have all or I want to avoid breaking if they are missing
function HeartIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>; }
function VolumeXIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L5.413 8.587A2 2 0 0 1 4 9.122H2V15h2a2 2 0 0 1 1.413.535l4.384 4.383a.707.707 0 0 0 1.203-.5V4.702Z"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>; }
function GhostIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>; }
function HandIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/><path d="M6 10.5V5a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/></svg>; }
function ZapOffIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12.41 6.75 13 2 10.57 4.92"/><polyline points="18.57 12.91 21 10 15.66 10"/><polyline points="8 8 3 14 12 14 11 22 16 16"/><line x1="2" x2="22" y1="2" y2="22"/></svg>; }
function MountainIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>; }
function ChevronDownIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>; }
function AnchorIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M19 12 17 14"/><path d="M5 12 7 14"/></svg>; }
function MoonIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>; }
