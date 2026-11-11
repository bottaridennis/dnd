import React from 'react';
import { useCharacter, Ability, CharacterData } from '../contexts/CharacterContext';
import { backgroundsData } from '../data/rules2024';
import { formatModifier } from '../lib/utils';
import { Section, OptionCard, StepHeader, Counter } from './ui';
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
    <div className="space-y-6">
      <StepHeader
        eyebrow="Capitolo 3"
        title="Caratteristiche"
        description="Genera i sei punteggi base, poi applica gli aumenti del background (+2/+1 oppure +1/+1/+1)."
        aside={method === 'pointbuy' ? <Counter value={pointsUsed} max={POINT_BUY_BUDGET} label="punti spesi" /> : undefined}
      />

      <div data-guide="scores" className="grid grid-cols-1 md:grid-cols-3 gap-2 scroll-mt-40" role="radiogroup" aria-label="Metodo di generazione">
        {([
          ['standard', 'Serie standard', '15, 14, 13, 12, 10, 8 da assegnare'],
          ['pointbuy', 'Acquisto a punti', '27 punti, valori da 8 a 15'],
          ['manual', 'Tiro di dadi', '4d6 scartando il più basso'],
        ] as const).map(([id, title, sub]) => (
          <OptionCard key={id} selected={method === id} onClick={() => changeMethod(id)} title={title} subtitle={sub} className="!p-3" />
        ))}
      </div>

      {method === 'pointbuy' && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
          <span>Costi: 8→0 · 9→1 · 10→2 · 11→3 · 12→4 · 13→5 · 14→7 · 15→9</span>
          <button onClick={() => update({ abilityScores: DEFAULT_SCORES })} className="secondary-action flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Azzera</button>
        </div>
      )}
      {method === 'manual' && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
          <span>Inserisci i tuoi tiri (3–18) oppure lascia tirare l’app.</span>
          <button onClick={rollAll} className="primary-action px-4 py-2 flex items-center gap-2"><Dices className="w-4 h-4" /> Tira 4d6 ×6</button>
        </div>
      )}
      {error && <p className="text-sm text-danger font-bold" role="alert">{error}</p>}

      <div data-guide="boosts" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 scroll-mt-40">
        {ABILITIES.map((ability) => {
          const base = scores[ability];
          const final = finalScores[ability];
          const bonus = getBackgroundBonus(currentCharacter, ability);
          const isAllowed = allowedBoosts.includes(ability);
          const nextCost = method === 'pointbuy' && base < 15 ? (POINT_BUY_COSTS[base + 1] - POINT_BUY_COSTS[base]) : 0;
          const canIncrease = method === 'pointbuy' ? base < 15 && pointsUsed + nextCost <= POINT_BUY_BUDGET : method === 'manual' ? base < 18 : false;
          return (
            <div key={ability} className={`ability-tile !pb-3 flex flex-col items-center gap-2 ${bonus ? '!border-accent' : ''}`}>
              <div className="text-[10px] font-black uppercase text-text-muted font-serif">{ABILITY_NAMES[ability]}</div>
              <div className="text-4xl font-display font-black leading-none">{formatModifier(final)}</div>
              <div className="text-xs text-text-muted">Punteggio <strong className="text-text-primary">{final}</strong>{bonus ? <span className="text-accent"> (+{bonus})</span> : null}</div>
              {method === 'standard' ? (
                <select value={base} onChange={(e) => assignStandard(ability, Number(e.target.value))} className="w-full bg-panel-bg border border-border px-2 py-1 text-sm font-bold text-center" aria-label={`Valore base di ${ABILITY_NAMES[ability]}`}>
                  {STANDARD_ARRAY.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              ) : (
                <div className="flex items-center w-full border border-border bg-panel-bg">
                  <button onClick={() => setScore(ability, base - 1)} disabled={base <= (method === 'manual' ? 3 : 8)} className="px-2 py-1 disabled:opacity-30" aria-label={`Diminuisci ${ABILITY_NAMES[ability]}`}><ChevronDown className="w-4 h-4" /></button>
                  <input
                    type="number" readOnly={method !== 'manual'} min={3} max={18} value={base}
                    onChange={(e) => setScore(ability, parseInt(e.target.value, 10) || 3)}
                    className="w-full min-w-0 text-center bg-transparent font-bold py-1"
                    aria-label={`Valore base di ${ABILITY_NAMES[ability]}`}
                  />
                  <button onClick={() => setScore(ability, base + 1)} disabled={!canIncrease} className="px-2 py-1 disabled:opacity-30" aria-label={`Aumenta ${ABILITY_NAMES[ability]}`}><ChevronUp className="w-4 h-4" /></button>
                </div>
              )}
              {isAllowed ? (
                <button onClick={() => toggleBoost(ability)} aria-pressed={bonus > 0} className={`w-full text-[10px] font-black uppercase py-1 border font-serif transition-colors ${bonus ? 'bg-accent border-accent text-white' : 'border-border text-text-muted hover:border-accent hover:text-accent'}`}>
                  {bonus ? `Bonus +${bonus}` : 'Applica bonus'}
                </button>
              ) : <div className="h-[26px] text-[10px] text-text-muted/60 grid place-items-center">—</div>}
            </div>
          );
        })}
      </div>

      <Section title={`Aumenti del background${background ? ` · ${background.name}` : ''}`} actions={<Counter value={selectedBoosts.length} max={boostMode === '2/1' ? 2 : 3} label="assegnati" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <OptionCard selected={boostMode === '2/1'} onClick={() => setBoostMode('2/1')} title="+2 / +1" subtitle="Il primo bonus scelto vale +2, il secondo +1." className="!p-3" />
          <OptionCard selected={boostMode === '1/1/1'} onClick={() => setBoostMode('1/1/1')} title="+1 / +1 / +1" subtitle="Tutte e tre le caratteristiche del background ricevono +1." className="!p-3" />
        </div>
        <p className="text-xs text-text-muted mt-3">
          {background ? <>Caratteristiche disponibili: <strong>{allowedBoosts.map(a => ABILITY_NAMES[a]).join(', ')}</strong>. Nessun punteggio può superare 20.</> : 'Scegli prima un background nel capitolo Origine.'}
        </p>
      </Section>
    </div>
  );
}
