
import React, { useState, useEffect } from 'react';
import { useCharacter, Ability } from '../contexts/CharacterContext';
import { backgroundsData } from '../data/rules2024';
import { getModifier, formatModifier, abilityMap } from '../lib/utils';
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

const ABILITIES: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

export default function AbilityScoresStep() {
  const { currentCharacter, dispatch } = useCharacter();
  const [method, setMethod] = useState<'standard' | 'pointbuy' | 'manual'>('pointbuy');
  const [tempScores, setTempScores] = useState(currentCharacter?.abilityScores || { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 });
  const [boostType, setBoostType] = useState<'2/1' | '1/1/1'>('2/1');
  const [selectedBoosts, setSelectedBoosts] = useState<Ability[]>(currentCharacter?.selectedBoosts || []);

  const background = backgroundsData.find(b => b.id === currentCharacter?.backgroundId);
  const allowedBoosts = background?.boosts || [];

  useEffect(() => {
    if (currentCharacter) {
      setTempScores(currentCharacter.abilityScores);
      setSelectedBoosts(currentCharacter.selectedBoosts);
    }
  }, [currentCharacter?.id]);

  const updateScore = (ability: Ability, value: number) => {
    const nextScores = { ...tempScores, [ability]: Math.max(8, Math.min(method === 'pointbuy' ? 15 : 20, value)) };
    setTempScores(nextScores);
    dispatch({ type: 'UPDATE_CHARACTER', payload: { abilityScores: nextScores } });
  };

  const handleBoostToggle = (ability: Ability) => {
    let nextBoosts = [...selectedBoosts];
    if (nextBoosts.includes(ability)) {
      nextBoosts = nextBoosts.filter(a => a !== ability);
    } else {
      const max = boostType === '2/1' ? 2 : 3;
      if (nextBoosts.length < max) {
        nextBoosts.push(ability);
      } else {
        nextBoosts = [ability];
      }
    }
    setSelectedBoosts(nextBoosts);
    dispatch({ type: 'UPDATE_CHARACTER', payload: { selectedBoosts: nextBoosts } });
  };

  const getFinalScore = (ability: Ability) => {
    let score = tempScores[ability];
    if (selectedBoosts.includes(ability)) {
      if (boostType === '2/1') {
        const index = selectedBoosts.indexOf(ability);
        score += (index === 0 ? 2 : 1);
      } else {
        score += 1;
      }
    }
    return score;
  };

  const calculatePointsUsed = () => {
    return (Object.values(tempScores) as number[]).reduce((acc, score) => acc + (POINT_BUY_COSTS[score] || 0), 0);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-text-primary">Caratteristiche</h2>
          <p className="text-text-muted mt-1 text-sm">Usa il <b>Point Buy (27 punti)</b> o un altro metodo per definire i tuoi punteggi.</p>
        </div>
        <div className="flex p-1 bg-panel-bg rounded border border-border">
          {(['standard', 'pointbuy', 'manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-4 py-1.5 rounded-sm transition-all text-xs font-bold uppercase tracking-wider ${
                method === m ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {m === 'standard' ? 'Standard' : m === 'pointbuy' ? 'Point Buy' : 'Manuale'}
            </button>
          ))}
        </div>
      </div>

      {method === 'pointbuy' && (
        <div className="bg-panel-bg border border-border rounded-lg p-6 flex items-center justify-around shadow-inner">
          <div className="text-center">
             <div className="text-3xl font-bold text-text-primary">{27 - calculatePointsUsed()}</div>
             <div className="text-[10px] uppercase tracking-widest text-text-muted font-black">Punti Rimanenti</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
             <div className="text-3xl font-bold text-accent">{(Object.values(tempScores) as number[]).reduce((a, b) => a + b, 0)}</div>
             <div className="text-[10px] uppercase tracking-widest text-text-muted font-black">Totale Base</div>
          </div>
          <button 
            onClick={() => setTempScores({ STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 })}
            className="flex flex-col items-center gap-1 group"
          >
            <RotateCcw className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
            <span className="text-[9px] uppercase tracking-tighter text-text-muted group-hover:text-text-primary">Reset</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ABILITIES.map((ability) => {
          const base = tempScores[ability];
          const final = getFinalScore(ability);
          const mod = getModifier(final);
          const isBoosted = selectedBoosts.includes(ability);
          const isAllowed = allowedBoosts.includes(ability);

          return (
            <div 
              key={ability}
              className={`score-card bg-card-bg border rounded-lg p-5 flex items-center justify-between transition-all duration-300 ${
                isBoosted ? 'border-accent shadow-[0_0_15px_rgba(212,175,55,0.05)]' : 'border-border'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">{abilityMap[ability]}</span>
                <span className={`text-lg font-bold ${isBoosted ? 'text-accent' : 'text-text-primary'}`}>
                  {ability === 'STR' ? 'Forza' : ability === 'DEX' ? 'Destrezza' : ability === 'CON' ? 'Costituzione' : ability === 'INT' ? 'Intelligenza' : ability === 'WIS' ? 'Saggezza' : 'Carisma'}
                </span>
                {isBoosted && <span className="text-[10px] text-success font-bold mt-1 tracking-tight">+ Background Bonus</span>}
              </div>

              <div className="flex items-center gap-5">
                <div className={`w-11 h-11 rounded border flex items-center justify-center text-lg font-black transition-colors ${
                  mod >= 0 ? 'bg-bg text-accent border-accent/40' : 'bg-bg text-text-muted border-border'
                }`}>
                  {formatModifier(final)}
                </div>

                <div className="flex flex-col gap-2">
                   <div className="flex items-center bg-bg border border-border rounded overflow-hidden">
                      <button 
                        onClick={() => updateScore(ability, base - 1)}
                        className="p-1 px-2 hover:bg-panel-bg text-text-muted disabled:opacity-30"
                        disabled={base <= 8}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <input 
                        type="text" 
                        readOnly 
                        value={base} 
                        className="w-10 text-center bg-transparent text-sm font-bold text-text-primary border-x border-border py-1"
                      />
                      <button 
                        onClick={() => updateScore(ability, base + 1)}
                        className="p-1 px-2 hover:bg-panel-bg text-text-muted disabled:opacity-30"
                        disabled={method === 'pointbuy' && base >= 15}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                   </div>
                   
                   {isAllowed && (
                     <button
                       onClick={() => handleBoostToggle(ability)}
                       className={`text-[9px] font-black uppercase tracking-widest py-1 border rounded transition-all ${
                         isBoosted ? 'bg-accent border-accent text-bg shadow-lg' : 'border-border text-text-muted hover:border-accent hover:text-accent'
                       }`}
                     >
                       {isBoosted ? 'Bonus Attivo' : 'Applica Bonus'}
                     </button>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-panel-bg border border-border rounded-lg p-8">
        <div className="flex items-center gap-4 mb-8 border-b border-border pb-4">
           <h4 className="text-text-primary font-bold uppercase text-xs tracking-widest">Opzioni Bonus Background</h4>
           <div className="text-[10px] text-text-muted italic">Basato su: {background?.name}</div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
           <button 
             onClick={() => setBoostType('2/1')}
             className={`p-5 rounded border text-left transition-all ${
               boostType === '2/1' ? 'border-accent bg-accent/5' : 'border-border bg-card-bg hover:border-text-muted'
             }`}
           >
             <div className="text-xl font-serif font-bold text-text-primary mb-1">+2 / +1</div>
             <p className="text-xs text-text-muted leading-relaxed">Scegli due abilità dal tuo background. Una riceve +2, l'altra +1.</p>
           </button>
           <button 
             onClick={() => setBoostType('1/1/1')}
             className={`p-5 rounded border text-left transition-all ${
               boostType === '1/1/1' ? 'border-accent bg-accent/5' : 'border-border bg-card-bg hover:border-text-muted'
             }`}
           >
              <div className="text-xl font-serif font-bold text-text-primary mb-1">+1 / +1 / +1</div>
              <p className="text-xs text-text-muted leading-relaxed">Scegli tre abilità dal tuo background per ricevere ciascuna +1.</p>
           </button>
        </div>
      </div>
    </div>
  );
}
