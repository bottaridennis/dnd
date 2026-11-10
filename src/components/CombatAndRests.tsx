import React, { useState } from 'react';
import { ShieldAlert, Heart, Tent, Moon, Skull, Check, X, Dices, ShieldPlus, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CharacterData, useCharacter } from '../contexts/CharacterContext';
import { characterService } from '../services/characterService';
import { useCharacterMath } from '../hooks/useCharacterMath';
import { getLongRestUpdates, getShortRestUpdates, rollDie } from '../lib/rests';
import { useDice } from '../contexts/DiceContext';

/**
 * Pannello Combattimento e Riposi (PHB 2024) — tutto viene salvato sul personaggio.
 * - I danni consumano prima i PF temporanei.
 * - A 0 PF: Tiri Salvezza contro la Morte (20 naturale = 1 PF, 1 naturale = 2 fallimenti).
 * - Danni subiti a 0 PF = 1 fallimento; danno residuo ≥ PF massimi = morte istantanea.
 * - Riposo Breve: spesa dei Dadi Vita; Riposo Lungo: recupero completo e -1 Esaurimento.
 */
export default function CombatAndRests() {
  const { currentCharacter, dispatch } = useCharacter();
  const math = useCharacterMath(currentCharacter);
  const [amount, setAmount] = useState('');
  const [saveRoll, setSaveRoll] = useState('');
  const [log, setLog] = useState<string | null>(null);
  const [concentrationDc, setConcentrationDc] = useState<number | null>(null);
  const { rollCheck } = useDice();

  if (!currentCharacter || !math) return null;

  const hp = Math.min(currentCharacter.hpCurrent ?? math.hpMax, math.hpMax);
  const tempHp = currentCharacter.hpTemp || 0;
  const deathSaves = currentCharacter.deathSaves || { successes: 0, failures: 0 };
  const isDead = deathSaves.failures >= 3 || (currentCharacter.exhaustion || 0) >= 6;
  const isStable = hp === 0 && deathSaves.successes >= 3 && !isDead;
  const value = Math.max(0, parseInt(amount, 10) || 0);

  const save = async (updates: Partial<CharacterData>, message?: string) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    if (message) setLog(message);
    try {
      await characterService.updateCharacter(currentCharacter.id, updates);
    } catch (error) {
      console.error('Salvataggio combattimento non riuscito:', error);
    }
  };

  const takeDamage = (dmg: number) => {
    if (dmg <= 0) return;
    // Concentrazione (PHB 2024): TS Costituzione CD 10 o metà del danno (max 30); a 0 PF termina
    if (currentCharacter.concentratingOn) {
      const dropsToZero = dmg >= hp + tempHp;
      setConcentrationDc(dropsToZero ? null : Math.min(30, Math.max(10, Math.floor(dmg / 2))));
      if (dropsToZero) save({ concentratingOn: '' });
    }
    const absorbed = Math.min(tempHp, dmg);
    const remaining = dmg - absorbed;
    const updates: Partial<CharacterData> = { hpTemp: tempHp - absorbed };
    if (hp === 0 && remaining > 0) {
      // Danni a 0 PF: un fallimento, o morte se il danno eguaglia i PF massimi
      const failures = remaining >= math.hpMax ? 3 : Math.min(3, deathSaves.failures + 1);
      updates.deathSaves = { ...deathSaves, failures };
      save(updates, failures >= 3 ? 'Il personaggio è morto.' : 'Danno a 0 PF: +1 fallimento.');
      return;
    }
    const nextHp = Math.max(0, hp - remaining);
    const overflow = remaining - hp;
    updates.hpCurrent = nextHp;
    if (nextHp === 0) {
      updates.deathSaves = { successes: 0, failures: overflow >= math.hpMax ? 3 : 0 };
      save(updates, overflow >= math.hpMax ? 'Danno massiccio: morte istantanea.' : 'A 0 PF: il personaggio è Privo di Sensi.');
      return;
    }
    save(updates, absorbed > 0 ? `${absorbed} danni assorbiti dai PF temporanei.` : undefined);
  };

  const heal = (amountToHeal: number) => {
    if (amountToHeal <= 0 || isDead) return;
    save({ hpCurrent: Math.min(math.hpMax, hp + amountToHeal), deathSaves: { successes: 0, failures: 0 } });
  };

  const setTemporary = (temp: number) => {
    // I PF temporanei non si sommano: si tiene il valore più alto
    save({ hpTemp: Math.max(tempHp, temp) }, temp <= tempHp ? 'I PF temporanei non si cumulano: mantenuto il valore più alto.' : undefined);
  };

  const applyDeathSave = (roll: number) => {
    if (hp > 0 || isDead || roll < 1 || roll > 20) return;
    if (roll === 20) {
      save({ hpCurrent: 1, deathSaves: { successes: 0, failures: 0 } }, '20 naturale! Il personaggio torna a 1 PF.');
      return;
    }
    const next = { ...deathSaves };
    if (roll === 1) next.failures = Math.min(3, next.failures + 2);
    else if (roll >= 10) next.successes = Math.min(3, next.successes + 1);
    else next.failures = Math.min(3, next.failures + 1);
    const message = next.failures >= 3 ? 'Tre fallimenti: il personaggio è morto.' : next.successes >= 3 ? 'Tre successi: il personaggio è Stabile.' : `Tiro: ${roll}`;
    save({ deathSaves: next }, message);
  };

  const spendHitDie = (die: number) => {
    const pool = math.hitDice.find(p => p.die === die);
    if (!pool || pool.available <= 0 || hp >= math.hpMax) return;
    const roll = rollDie(die);
    const gained = Math.max(1, roll + math.mods.CON);
    const spent = { ...(currentCharacter.hitDiceSpent || {}), [die]: pool.spent + 1 };
    save(
      { hitDiceSpent: spent, hpCurrent: Math.min(math.hpMax, hp + gained), deathSaves: { successes: 0, failures: 0 } },
      `d${die}: ${roll} ${math.mods.CON >= 0 ? '+' : '−'} ${Math.abs(math.mods.CON)} = ${gained} PF recuperati`,
    );
  };

  const shortRest = () => save(getShortRestUpdates(currentCharacter), 'Riposo Breve completato: slot del Patto, Incanalare Divinità e risorse di classe recuperati secondo le regole.');
  const longRest = () => {
    if (hp === 0 && !isStable && !isDead) {
      setLog('Serve almeno 1 PF per iniziare un Riposo Lungo.');
      return;
    }
    save(getLongRestUpdates(currentCharacter), 'Riposo Lungo completato: PF, Dadi Vita e risorse ripristinati, -1 Esaurimento.');
  };

  const totalAvailableDice = math.hitDice.reduce((acc, p) => acc + p.available, 0);
  const totalDice = math.hitDice.reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="bg-panel-bg p-6 md:p-8 border border-border rounded-lg space-y-6 shadow-inner animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Combattimento e Riposi</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={shortRest} className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-border rounded text-[10px] font-black uppercase text-accent hover:border-accent transition-colors">
            <Tent className="w-4 h-4" /> Riposo Breve
          </button>
          <button onClick={longRest} className="flex items-center gap-2 px-4 py-2 bg-accent text-bg border border-accent rounded text-[10px] font-black uppercase shadow-lg transition-all">
            <Moon className="w-4 h-4" /> Riposo Lungo
          </button>
        </div>
      </div>

      {currentCharacter.concentratingOn && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border border-accent bg-accent/10 px-4 py-2">
          <span><strong className="font-serif">Concentrazione:</strong> {currentCharacter.concentratingOn}</span>
          <div className="flex items-center gap-2">
            {concentrationDc !== null && (
              <button
                onClick={() => {
                  const conSave = math.savingThrows.find(st => st.ability === 'CON')?.mod ?? math.mods.CON;
                  const entry = rollCheck(`Concentrazione (CD ${concentrationDc})`, conSave);
                  const kept = (entry.total ?? 0) >= concentrationDc;
                  if (!kept) save({ concentratingOn: '' }, `Concentrazione persa (${entry.total} contro CD ${concentrationDc}).`);
                  else setLog(`Concentrazione mantenuta (${entry.total} contro CD ${concentrationDc}).`);
                  setConcentrationDc(null);
                }}
                className="primary-action px-3 py-1.5"
              >
                TS Costituzione CD {concentrationDc}
              </button>
            )}
            <button onClick={() => { save({ concentratingOn: '' }); setConcentrationDc(null); }} className="secondary-action !py-1 !px-2">Termina</button>
          </div>
        </div>
      )}

      {log && (
        <div className="flex items-center justify-between gap-3 text-xs bg-card-bg border border-accent/30 text-text-primary rounded px-4 py-2">
          <span className="flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-accent" /> {log}</span>
          <button onClick={() => setLog(null)} className="text-text-muted hover:text-accent" aria-label="Chiudi messaggio"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestione PF */}
        <div className="space-y-4 p-5 bg-card-bg rounded border border-border/50">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Punti Ferita</span>
              <span className="text-4xl font-serif font-black text-text-primary leading-none mt-1">
                {hp} <span className="text-xl text-text-muted">/ {math.hpMax}</span>
              </span>
              {tempHp > 0 && <span className="text-[10px] font-black uppercase text-blue-400 mt-1">+{tempHp} PF temporanei</span>}
            </div>
            <Heart className={`w-8 h-8 ${hp === 0 ? 'text-red-500 animate-pulse' : 'text-success'}`} />
          </div>

          <input
            type="number"
            min={0}
            placeholder="Quantità"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-bg border border-border rounded px-4 py-2 text-sm font-bold focus:border-accent/50 outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => { takeDamage(value); setAmount(''); }} disabled={!value || isDead} className="px-2 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30">
              Danno
            </button>
            <button onClick={() => { heal(value); setAmount(''); }} disabled={!value || isDead} className="px-2 py-2 bg-success/20 text-success border border-success/30 rounded text-[10px] font-black uppercase hover:bg-success hover:text-white transition-colors disabled:opacity-30">
              Cura
            </button>
            <button onClick={() => { setTemporary(value); setAmount(''); }} disabled={!value || isDead} className="px-2 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[10px] font-black uppercase hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-30 flex items-center justify-center gap-1">
              <ShieldPlus className="w-3 h-3" /> Temp
            </button>
          </div>
          {tempHp > 0 && (
            <button onClick={() => save({ hpTemp: 0 })} className="text-[9px] uppercase font-black tracking-widest text-text-muted hover:text-accent">Azzera PF temporanei</button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {hp === 0 ? (
            <motion.div
              key="death"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-5 rounded border ${isDead ? 'border-red-500 bg-red-500/10' : 'border-red-500/50 bg-card-bg'} relative overflow-hidden`}
            >
              {isDead && (
                <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-red-900/80 backdrop-blur-sm z-10">
                  <div className="text-3xl font-black text-white flex items-center gap-3 tracking-widest uppercase"><Skull className="w-8 h-8" /> Morto</div>
                  <button onClick={() => save({ deathSaves: { successes: 0, failures: 0 }, hpCurrent: 1 })} className="text-[10px] font-black uppercase tracking-widest text-white/80 underline">Riportato in vita (1 PF)</button>
                </div>
              )}

              <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-4 flex items-center gap-2">
                <Skull className="w-3 h-3" /> Tiri Salvezza contro la Morte {isStable && <span className="text-success">· Stabile</span>}
              </h4>

              <div className="space-y-4">
                {(['successes', 'failures'] as const).map(kind => (
                  <div key={kind} className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-bold w-20 ${kind === 'successes' ? 'text-success' : 'text-red-500'}`}>{kind === 'successes' ? 'Successi' : 'Fallimenti'}</span>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(i => {
                        const filled = deathSaves[kind] >= i;
                        return (
                          <button
                            key={i}
                            onClick={() => save({ deathSaves: { ...deathSaves, [kind]: filled && deathSaves[kind] === i ? i - 1 : i } })}
                            className={`w-6 h-6 rounded-full border flex items-center justify-center ${filled ? (kind === 'successes' ? 'bg-success border-success' : 'bg-red-500 border-red-500') : 'bg-bg border-border'}`}
                            aria-label={`${kind === 'successes' ? 'Successo' : 'Fallimento'} ${i}`}
                          >
                            {filled && (kind === 'successes' ? <Check className="w-3 h-3 text-white" /> : <X className="w-3 h-3 text-white" />)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <input
                  type="number" max={20} min={1} placeholder="d20"
                  value={saveRoll} onChange={(e) => setSaveRoll(e.target.value)}
                  className="w-20 bg-bg border border-border rounded px-2 text-center font-bold text-sm"
                />
                <button
                  onClick={() => { applyDeathSave(parseInt(saveRoll, 10)); setSaveRoll(''); }}
                  disabled={!saveRoll || isStable}
                  className="flex-1 bg-red-500/80 text-white rounded text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                >
                  Registra
                </button>
                <button
                  onClick={() => applyDeathSave(rollDie(20))}
                  disabled={isStable}
                  className="flex-1 bg-red-500 text-white rounded text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 disabled:opacity-30"
                >
                  <Dices className="w-3.5 h-3.5" /> Tira
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hitdice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-5 bg-card-bg rounded border border-border/50 flex flex-col justify-between gap-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Dadi Vita disponibili</span>
                  <span className="text-4xl font-serif font-black text-text-primary leading-none mt-1">
                    {totalAvailableDice} <span className="text-xl text-text-muted">/ {totalDice}</span>
                  </span>
                </div>
                <Dices className="w-8 h-8 text-text-muted" />
              </div>
              <div className="flex flex-wrap gap-2">
                {math.hitDice.map(pool => (
                  <button
                    key={pool.die}
                    onClick={() => spendHitDie(pool.die)}
                    disabled={pool.available === 0 || hp >= math.hpMax}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-panel-bg border border-border rounded text-[10px] font-black uppercase text-accent hover:border-accent disabled:opacity-30 transition-colors"
                  >
                    Spendi d{pool.die} ({pool.available}/{pool.total})
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-text-muted leading-relaxed">Durante un Riposo Breve tira un Dado Vita e aggiungi il modificatore di Costituzione. Il Riposo Lungo li recupera tutti.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
