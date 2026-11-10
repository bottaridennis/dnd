import React from 'react';
import { useCharacter, Ability, CharacterData } from '../contexts/CharacterContext';
import { backgroundsData } from '../data/rules2024';
import { getModifier, formatModifier, abilityMap } from '../lib/utils';
import { ChevronUp, ChevronDown, RotateCcw, Dices } from 'lucide-react';
import {
  ABILITIES, ABILITY_NAMES, POINT_BUY_BUDGET, POINT_BUY_COSTS, STANDARD_ARRAY, getBackgroundBonus, getBoostMode, getFinalScores,
} from '../lib/characterRules';
import { rollDie } from '../lib/rests';

type Method = 'standard' | 'pointbuy' | 'manual';

const DEFAULT_SCORES: Record<Ability, number> = { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 };
const STANDARD_DEFAULT: Record<Ability, number> = { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 };

export function pointBuyCost(scores: Record<Ability, number>): number {
  return ABILITIES.reduce((acc, a) => acc + (POINT_BUY_COSTS[scores[a]] ?? 99), 0);
}

/** Validazione dei punteggi base secondo il metodo scelto (usata dal wizard). */
export function validateAbilityScores(method: Method, scores: Record<Ability, number>): string | null {
  if (method === 'pointbuy') {
    if (ABILITIES.some(a => scores[a] < 8 || scores[a] > 15)) return 'Con il Point Buy i punteggi vanno da 8 a 15.';
    if (pointBuyCost(scores) > POINT_BUY_BUDGET) return `Hai superato i ${POINT_BUY_BUDGET} punti disponibili.`;
  }
  if (method === 'standard') {
    const sorted = ABILITIES.map(a => scores[a]).sort((x, y) => y - x);
    if (sorted.join(',') !== [...STANDARD_ARRAY].sort((x, y) => y - x).join(',')) return 'Assegna ogni valore della serie standard (15, 14, 13, 12, 10, 8) una sola volta.';
  }
  if (method === 'manual' && ABILITIES.some(a => scores[a] < 3 || scores[a] > 18)) return 'I punteggi tirati vanno da 3 a 18.';
  return null;
}

export default function AbilityScoresStep() {
  const { currentCharacter, dispatch } = useCharacter();
  if (!currentCharacter) return null;

  const method: Method = currentCharacter.abilityMethod || 'pointbuy';
  const scores = currentCharacter.abilityScores || DEFAULT_SCORES;
  const boostMode = getBoostMode(currentCharacter);
  const selectedBoosts = currentCharacter.selectedBoosts || [];
  const background = backgroundsData.find(b => b.id === currentCharacter.backgroundId);
  const allowedBoosts = (background?.boosts || []) as Ability[];
  const finalScores = getFinalScores({ ...currentCharacter, abilityBonuses: {} });
  const pointsUsed = pointBuyCost(scores);
  const error = validateAbilityScores(method, scores);

  const update = (payload: Partial<CharacterData>) => dispatch({ type: 'UPDATE_CHARACTER', payload });

  const changeMethod = (next: Method) => {
    if (next === method) return;
    update({ abilityMethod: next, abilityScores: next === 'standard' ? STANDARD_DEFAULT : next === 'pointbuy' ? DEFAULT_SCORES : { ...scores } });
  };

  const setScore = (ability: Ability, value: number) => {
    const limits = method === 'pointbuy' ? [8, 15] : method === 'manual' ? [3, 18] : [8, 15];
    const clamped = Math.max(limits[0], Math.min(limits[1], value));
    const next = { ...scores, [ability]: clamped };
    if (method === 'pointbuy' && pointBuyCost(next) > POINT_BUY_BUDGET) return;
    update({ abilityScores: next });
  };

  // Serie standard: scambia i valori fra caratteristiche per mantenerla sempre valida
  const assignStandard = (ability: Ability, value: number) => {
    const holder = ABILITIES.find(a => a !== ability && scores[a] === value);
    const next = { ...scores, [ability]: value };
    if (holder) next[holder] = scores[ability];
    update({ abilityScores: next });
  };

  const rollAll = () => {
    const roll4d6 = () => {
      const dice = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)].sort((a, b) => a - b);
      return dice[1] + dice[2] + dice[3];
    };
    update({ abilityScores: ABILITIES.reduce((acc, a) => ({ ...acc, [a]: roll4d6() }), {} as Record<Ability, number>) });
  };

  const setBoostMode = (mode: '2/1' | '1/1/1') => {
    const max = mode === '2/1' ? 2 : 3;
    update({ boostMode: mode, selectedBoosts: selectedBoosts.slice(0, max) });
  };

  const toggleBoost = (ability: Ability) => {
    let next = [...selectedBoosts];
    if (next.includes(ability)) next = next.filter(a => a !== ability);
    else if (next.length < (boostMode === '2/1' ? 2 : 3)) next.push(ability);
    else next = [...next.slice(1), ability];
    update({ selectedBoosts: next, boostMode });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-text-primary">Caratteristiche</h2>
          <p className="text-text-muted mt-1 text-sm">Scegli il metodo: serie standard, acquisto a punti (27) o tiro di 4d6.</p>
        </div>
        <div className="flex p-1 bg-panel-bg rounded border border-border">
          {(['standard', 'pointbuy', 'manual'] as const).map((m) => (
            <button
              key={m}
              onClick={() => changeMethod(m)}
              className={`px-4 py-1.5 rounded-sm transition-all text-xs font-bold uppercase tracking-wider ${method === m ? 'bg-accent text-bg shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              {m === 'standard' ? 'Serie Standard' : m === 'pointbuy' ? 'Point Buy' : 'Tiro / Manuale'}
            </button>
          ))}
        </div>
      </div>

      {method === 'pointbuy' && (
        <div className="bg-panel-bg border border-border rounded-lg p-6 flex items-center justify-around shadow-inner">
          <div className="text-center">
            <div className={`text-3xl font-bold ${pointsUsed > POINT_BUY_BUDGET ? 'text-danger' : 'text-text-primary'}`}>{POINT_BUY_BUDGET - pointsUsed}</div>
            <div className="text-[10px] uppercase tracking-widest text-text-muted font-black">Punti rimanenti</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-[10px] text-text-muted leading-relaxed max-w-xs">Costi: 8→0 · 9→1 · 10→2 · 11→3 · 12→4 · 13→5 · 14→7 · 15→9</div>
          <button onClick={() => update({ abilityScores: DEFAULT_SCORES })} className="flex flex-col items-center gap-1 group">
            <RotateCcw className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
            <span className="text-[9px] uppercase tracking-tighter text-text-muted group-hover:text-text-primary">Reset</span>
          </button>
        </div>
      )}

      {method === 'manual' && (
        <div className="bg-panel-bg border border-border rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">Tira 4d6 e scarta il dado più basso per ogni caratteristica, oppure inserisci i tuoi tiri (3–18).</p>
          <button onClick={rollAll} className="flex items-center gap-2 px-4 py-2 rounded bg-accent text-bg text-[10px] font-black uppercase tracking-widest">
            <Dices className="w-4 h-4" /> Tira 4d6
          </button>
        </div>
      )}

      {error && <p className="text-xs text-danger font-bold">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ABILITIES.map((ability) => {
          const base = scores[ability];
          const final = finalScores[ability];
          const bonus = getBackgroundBonus(currentCharacter, ability);
          const isBoosted = bonus > 0;
          const isAllowed = allowedBoosts.includes(ability);
          const nextCost = method === 'pointbuy' && base < 15 ? (POINT_BUY_COSTS[base + 1] - POINT_BUY_COSTS[base]) : 0;
          const canIncrease = method === 'pointbuy' ? base < 15 && pointsUsed + nextCost <= POINT_BUY_BUDGET : method === 'manual' ? base < 18 : false;

          return (
            <div key={ability} className={`score-card bg-card-bg border rounded-lg p-5 flex items-center justify-between transition-all duration-300 ${isBoosted ? 'border-accent' : 'border-border'}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-0.5">{abilityMap[ability]}</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-lg font-bold ${isBoosted ? 'text-accent' : 'text-text-primary'}`}>{ABILITY_NAMES[ability]}</span>
                  <span className="text-2xl font-black text-text-primary">{final}</span>
                </div>
                {isBoosted && <span className="text-[10px] text-success font-bold mt-1 tracking-tight">+{bonus} dal background</span>}
              </div>

              <div className="flex items-center gap-5">
                <div className={`w-11 h-11 rounded border flex items-center justify-center text-lg font-black transition-colors ${getModifier(final) >= 0 ? 'bg-bg text-accent border-accent/40' : 'bg-bg text-text-muted border-border'}`}>
                  {formatModifier(final)}
                </div>

                <div className="flex flex-col gap-2">
                  {method === 'standard' ? (
                    <select value={base} onChange={(e) => assignStandard(ability, Number(e.target.value))} className="bg-bg border border-border rounded px-2 py-1 text-sm font-bold" aria-label={`Valore ${ABILITY_NAMES[ability]}`}>
                      {STANDARD_ARRAY.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center bg-bg border border-border rounded overflow-hidden">
                      <button onClick={() => setScore(ability, base - 1)} className="p-1 px-2 hover:bg-panel-bg text-text-muted disabled:opacity-30" disabled={base <= (method === 'manual' ? 3 : 8)} aria-label="Diminuisci">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {method === 'manual' ? (
                        <input type="number" min={3} max={18} value={base} onChange={(e) => setScore(ability, parseInt(e.target.value, 10) || 3)} className="w-12 text-center bg-transparent text-sm font-bold text-text-primary border-x border-border py-1" />
                      ) : (
                        <input type="text" readOnly value={base} className="w-10 text-center bg-transparent text-sm font-bold text-text-primary border-x border-border py-1" />
                      )}
                      <button onClick={() => setScore(ability, base + 1)} className="p-1 px-2 hover:bg-panel-bg text-text-muted disabled:opacity-30" disabled={!canIncrease} aria-label="Aumenta">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isAllowed && (
                    <button
                      onClick={() => toggleBoost(ability)}
                      className={`text-[9px] font-black uppercase tracking-widest py-1 border rounded transition-all ${isBoosted ? 'bg-accent border-accent text-bg shadow-lg' : 'border-border text-text-muted hover:border-accent hover:text-accent'}`}
                    >
                      {isBoosted ? `Bonus +${bonus}` : 'Applica bonus'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-panel-bg border border-border rounded-lg p-8">
        <div className="flex flex-wrap items-center gap-4 mb-8 border-b border-border pb-4">
          <h4 className="text-text-primary font-bold uppercase text-xs tracking-widest">Bonus del background</h4>
          <div className="text-[10px] text-text-muted italic">
            {background ? `${background.name}: ${allowedBoosts.map(a => ABILITY_NAMES[a]).join(', ')}` : 'Scegli prima un background'}
          </div>
          <div className="ml-auto text-[10px] font-black uppercase text-accent">{selectedBoosts.length}/{boostMode === '2/1' ? 2 : 3} scelti</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button onClick={() => setBoostMode('2/1')} className={`p-5 rounded border text-left transition-all ${boostMode === '2/1' ? 'border-accent bg-accent/5' : 'border-border bg-card-bg hover:border-text-muted'}`}>
            <div className="text-xl font-serif font-bold text-text-primary mb-1">+2 / +1</div>
            <p className="text-xs text-text-muted leading-relaxed">Due caratteristiche del background: la prima scelta riceve +2, la seconda +1.</p>
          </button>
          <button onClick={() => setBoostMode('1/1/1')} className={`p-5 rounded border text-left transition-all ${boostMode === '1/1/1' ? 'border-accent bg-accent/5' : 'border-border bg-card-bg hover:border-text-muted'}`}>
            <div className="text-xl font-serif font-bold text-text-primary mb-1">+1 / +1 / +1</div>
            <p className="text-xs text-text-muted leading-relaxed">Tutte e tre le caratteristiche del background ricevono +1.</p>
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-4">Nessun punteggio può superare 20 con questi bonus.</p>
      </div>
    </div>
  );
}
