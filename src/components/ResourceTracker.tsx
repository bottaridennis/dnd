
import React, { useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { characterService } from '../services/characterService';
import { getClassResources, type ClassResource } from '../data/classResources';
import { useResourceTracker } from '../hooks/useResourceTracker';
import { 
  Sparkles, 
  Zap, 
  Flame, 
  Info,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ResourceTracker() {
  const {
    maxResources,
    currentResources,
    expendSpellSlot,
    recoverSpellSlot,
    expendSorceryPoint,
    recoverSorceryPoint,
    expendChannelDivinity,
    recoverChannelDivinity,
    expendPactSlot,
    recoverPactSlot,
  } = useResourceTracker();

  const { currentCharacter, dispatch } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const classResources = currentCharacter && math ? getClassResources(currentCharacter, math.mods) : [];
  const spentMap = currentCharacter?.classResourcesSpent || {};
  const [poolAmounts, setPoolAmounts] = useState<Record<string, string>>({});

  const setSpent = (id: string, value: number, max: number) => {
    if (!currentCharacter) return;
    const next = { ...spentMap, [id]: Math.max(0, Math.min(max, value)) };
    dispatch({ type: 'UPDATE_CHARACTER', payload: { classResourcesSpent: next } });
    characterService.updateCharacter(currentCharacter.id, { classResourcesSpent: next }).catch(err => console.error('Salvataggio risorse non riuscito:', err));
  };

  const recoveryLabel = (r: ClassResource) => r.recovery === 'long' ? 'Riposo Lungo' : r.recovery === 'short' ? 'Riposo Breve' : '1 al Riposo Breve, tutte al Lungo';

  const hasAnyResources = classResources.length > 0 || 
    maxResources.spellSlots.some(s => s > 0) || 
    maxResources.pactMagic.count > 0 || 
    maxResources.sorceryPoints > 0 || 
    maxResources.channelDivinity > 0;

  if (!hasAnyResources) return null;

  return (
    <div className="bg-panel-bg border border-border rounded-lg px-4 py-6 sm:p-6 space-y-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-accent" />
          <h3 className="font-serif font-black text-xl text-text-primary uppercase tracking-normal">Risorse</h3>
        </div>
        <p className="text-[9px] text-text-muted uppercase font-black tracking-widest">I riposi si gestiscono dal pannello Combattimento e Riposi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spell Slots */}
        {maxResources.spellSlots.some(s => s > 0) && (
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase text-text-muted tracking-widest mb-2 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Slot Incantesimo
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {maxResources.spellSlots.map((max, index) => {
                if (max <= 0) return null;
                const level = index + 1;
                const spent = currentResources.spentSpellSlots[level] || 0;
                
                return (
                  <div key={level} className="bg-card-bg border border-border rounded-lg p-3 group hover:border-accent/30 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-accent uppercase tracking-normal">Livello {level}</span>
                      <span className="text-[9px] font-mono text-text-muted">{max - spent} / {max} Rimanenti</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 sm:gap-1.5">
                      {Array.from({ length: max }).map((_, i) => {
                        const isSpent = i < spent;
                        return (
                          <button
                            key={i}
                            onClick={() => isSpent ? recoverSpellSlot(level) : expendSpellSlot(level)}
                            className="bg-transparent hover:scale-110 transition-transform p-0.5 sm:p-0"
                          >
                            {isSpent ? (
                              <Circle className="w-6 h-6 sm:w-4 sm:h-4 text-border" />
                            ) : (
                              <CheckCircle2 className="w-6 h-6 sm:w-4 sm:h-4 text-accent fill-accent/10" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Resources */}
        <div className="space-y-6">
          {/* Pact Magic */}
          {maxResources.pactMagic.count > 0 && (
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="text-[10px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-2">
                  <Flame className="w-3 h-3" /> Magia del Patto
                </div>
                <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                  Livello {maxResources.pactMagic.level}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-wrap gap-3 sm:gap-2">
                  {Array.from({ length: maxResources.pactMagic.count }).map((_, i) => {
                    const isSpent = i < currentResources.spentPactSlots;
                    return (
                      <button
                        key={i}
                        onClick={() => isSpent ? recoverPactSlot() : expendPactSlot()}
                        className="hover:scale-110 transition-transform"
                      >
                        {isSpent ? (
                          <Circle className="w-8 h-8 sm:w-6 sm:h-6 text-border" />
                        ) : (
                          <CheckCircle2 className="w-8 h-8 sm:w-6 sm:h-6 text-purple-500 fill-purple-500/10 shadow-[0_0_8px_rgba(168,85,247,0.2)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-text-muted italic">Slot recuperati al riposo breve</div>
              </div>
            </div>
          )}

          {/* Sorcery Points */}
          {maxResources.sorceryPoints > 0 && (
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[10px] font-black uppercase text-accent tracking-widest">Punti Stregoneria</div>
                <span className="text-xl font-black text-text-primary">
                  {maxResources.sorceryPoints - currentResources.spentSorceryPoints} / {maxResources.sorceryPoints}
                </span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={expendSorceryPoint}
                  disabled={currentResources.spentSorceryPoints >= maxResources.sorceryPoints}
                  className="flex-1 py-1.5 rounded bg-bg border border-border text-[9px] font-black uppercase tracking-widest hover:border-accent hover:text-accent disabled:opacity-20 transition-all"
                >
                  Usa Punto
                </button>
                <button 
                  onClick={recoverSorceryPoint}
                  disabled={currentResources.spentSorceryPoints <= 0}
                  className="flex-1 py-1.5 rounded bg-bg border border-border text-[9px] font-black uppercase tracking-widest hover:border-accent hover:text-accent disabled:opacity-20 transition-all"
                >
                  Ripristina
                </button>
              </div>
            </div>
          )}

          {/* Channel Divinity */}
          {maxResources.channelDivinity > 0 && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="text-[10px] font-black uppercase text-primary tracking-widest">Incanalare Divinità</div>
                <span className="text-xl font-black text-text-primary">
                  {maxResources.channelDivinity - currentResources.spentChannelDivinity} / {maxResources.channelDivinity}
                </span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={expendChannelDivinity}
                  disabled={currentResources.spentChannelDivinity >= maxResources.channelDivinity}
                  className="flex-1 py-1.5 rounded bg-bg border border-border text-[9px] font-black uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-20 transition-all"
                >
                  Usa Carica
                </button>
                <button 
                  onClick={recoverChannelDivinity}
                  disabled={currentResources.spentChannelDivinity <= 0}
                  className="flex-1 py-1.5 rounded bg-bg border border-border text-[9px] font-black uppercase tracking-widest hover:border-primary hover:text-primary disabled:opacity-20 transition-all"
                >
                  Ripristina
                </button>
              </div>
              <div className="text-[9px] text-text-muted mt-3 text-center uppercase font-black tracking-widest">
                1 uso recuperato al riposo breve (Regole 2024)
              </div>
            </div>
          )}
        </div>
      </div>
      {classResources.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase text-text-muted tracking-widest">Privilegi di classe</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {classResources.map(r => {
              const spent = Math.min(r.max, spentMap[r.id] || 0);
              const left = r.max - spent;
              return (
                <div key={r.id} className="bg-card-bg border border-border rounded p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-text-primary">{r.name}</div>
                      <div className="text-[9px] uppercase tracking-wider text-text-muted">{recoveryLabel(r)}</div>
                    </div>
                    <span className="font-display text-lg leading-none">{left}<span className="text-xs text-text-muted"> / {r.max}</span></span>
                  </div>
                  {r.kind === 'uses' && r.max <= 10 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: r.max }).map((_, i) => {
                        const isSpent = i < spent;
                        return (
                          <button key={i} onClick={() => setSpent(r.id, isSpent ? spent - 1 : spent + 1, r.max)} aria-label={isSpent ? `Recupera ${r.name}` : `Usa ${r.name}`} className="hover:scale-110 transition-transform">
                            {isSpent ? <Circle className="w-5 h-5 text-border" /> : <CheckCircle2 className="w-5 h-5 text-accent fill-accent/10" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={poolAmounts[r.id] ?? '1'}
                        onChange={e => setPoolAmounts(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="w-14 bg-bg border border-border rounded text-center text-xs"
                        aria-label={`Quantità ${r.name}`}
                      />
                      <button onClick={() => setSpent(r.id, spent + Math.max(1, parseInt(poolAmounts[r.id] ?? '1', 10) || 1), r.max)} disabled={left <= 0} className="flex-1 py-1 rounded bg-bg border border-border text-[9px] font-black uppercase tracking-widest hover:border-accent hover:text-accent disabled:opacity-30">Spendi</button>
                      <button onClick={() => setSpent(r.id, spent - Math.max(1, parseInt(poolAmounts[r.id] ?? '1', 10) || 1), r.max)} disabled={spent <= 0} className="flex-1 py-1 rounded bg-bg border border-border text-[9px] font-black uppercase tracking-widest hover:border-accent hover:text-accent disabled:opacity-30">Recupera</button>
                    </div>
                  )}
                  {r.note && <div className="text-[10px] text-text-muted italic">{r.note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
