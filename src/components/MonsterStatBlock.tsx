import React from 'react';
import { Crown, Dices, RotateCcw, Swords } from 'lucide-react';
import { useDice } from '../contexts/DiceContext';
import { ABILITY_NAMES } from '../lib/characterRules';
import {
  ABILITY_ORDER, ABILITY_SHORT, abilityMod, damageFormula, initiativeBonusOf, signed, type Monster, type MonsterAction,
} from '../lib/bestiary';
import type { Ability } from '../contexts/CharacterContext';

const SAVE_LABEL: Record<string, string> = { STR: 'FOR', DEX: 'DES', CON: 'COS', INT: 'INT', WIS: 'SAG', CHA: 'CAR' };

interface Props {
  monster: Monster;
  /** Nome mostrato nei tiri (es. "Goblin 2") */
  label?: string;
  /** Contatore delle azioni leggendarie del combattente */
  legendary?: { used: number; max: number; onChange: (used: number) => void };
}

/** Blocco statistiche in stile manuale, con tiri cliccabili. */
export default function MonsterStatBlock({ monster, label, legendary }: Props) {
  const { rollCheck, rollDamage } = useDice();
  const who = label || monster.name;

  const ActionRow: React.FC<{ action: MonsterAction }> = ({ action }) => {
    const formula = damageFormula(action.damage);
    return (
      <div className="py-2 border-b border-border/60 last:border-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold font-serif italic">{action.name}{action.usage ? <span className="not-italic font-normal text-text-muted"> ({action.usage})</span> : null}.</span>
          {action.attack !== undefined && (
            <button
              onClick={() => rollCheck(`${who} · ${action.name}`, action.attack!, formula ? { followUp: { label: `${who} · ${action.name} (danni)`, formula } } : undefined)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase font-serif border border-accent/60 text-accent hover:bg-accent hover:text-bg"
              title="Tira per colpire"
            ><Swords className="w-3 h-3" /> {signed(action.attack)}</button>
          )}
          {action.save && <span className="text-[11px] font-black uppercase font-serif px-2 py-0.5 bg-panel-bg border border-border">TS {SAVE_LABEL[action.save.ability] || action.save.ability} CD {action.save.dc}</span>}
          {formula && (
            <button onClick={() => rollDamage(`${who} · ${action.name}`, formula)} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase font-serif border border-border hover:border-accent hover:text-accent" title="Tira i danni">
              <Dices className="w-3 h-3" /> {action.damage!.filter(d => !d.condition).map(d => `${d.dice} ${d.type}`).join(' + ')}
            </button>
          )}
          {action.damage?.filter(d => d.condition).map((d, i) => (
            <button key={i} onClick={() => rollDamage(`${who} · ${action.name} (${d.condition})`, d.dice)} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase font-serif border border-dashed border-border hover:border-accent hover:text-accent" title={`Danno aggiuntivo ${d.condition}`}>
              + {d.dice} {d.type} {d.condition}
            </button>
          ))}
          {action.usage?.startsWith('Ricarica') && (
            <button onClick={() => rollDamage(`${who} · ricarica ${action.name} (${action.usage})`, '1d6')} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-black uppercase font-serif border border-border hover:border-accent hover:text-accent" title="Tira la ricarica">
              <RotateCcw className="w-3 h-3" /> d6
            </button>
          )}
        </div>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">{action.desc}</p>
        {action.spells?.length ? <p className="text-sm mt-1"><span className="text-text-muted">Incantesimi:</span> {action.spells.join(', ')}</p> : null}
      </div>
    );
  };

  const Block: React.FC<{ title: string; actions?: MonsterAction[]; children?: React.ReactNode }> = ({ title, actions, children }) => (actions?.length ? (
    <section className="mt-4">
      <h4 className="text-sm uppercase tracking-widest text-accent border-b-2 border-accent/60 pb-1">{title}</h4>
      {children}
      {actions.map((a, i) => <ActionRow key={`${a.name}-${i}`} action={a} />)}
    </section>
  ) : null);

  const line = (k: string, v?: React.ReactNode) => (v ? <p className="text-sm"><span className="font-bold">{k}</span> {v}</p> : null);

  return (
    <article className="text-text-primary">
      <header className="border-b-2 border-accent pb-2">
        <h3 className="text-2xl uppercase leading-tight">{monster.name}</h3>
        <p className="text-sm italic text-text-muted">{monster.size} · {monster.type}{monster.alignment ? ` · ${monster.alignment}` : ''}{monster.nameEn && monster.nameEn !== monster.name ? ` · ${monster.nameEn}` : ''}</p>
      </header>

      <div className="grid grid-cols-3 gap-2 my-3 text-center">
        <div className="stat-chip p-2"><div className="text-[10px] uppercase tracking-widest text-text-muted">CA</div><div className="text-2xl font-display font-black">{monster.ac}</div></div>
        <div className="stat-chip p-2"><div className="text-[10px] uppercase tracking-widest text-text-muted">PF</div><div className="text-2xl font-display font-black">{monster.hp}</div>{monster.hpRoll && <div className="text-[10px] text-text-muted">{monster.hpRoll}</div>}</div>
        <button onClick={() => rollCheck(`${who} · iniziativa`, initiativeBonusOf(monster))} className="stat-chip p-2 hover:border-accent" title="Tira l’iniziativa">
          <div className="text-[10px] uppercase tracking-widest text-text-muted">Iniziativa</div><div className="text-2xl font-display font-black">{signed(initiativeBonusOf(monster))}</div>
        </button>
      </div>
      {line('Velocità', monster.speed)}

      <div className="grid grid-cols-6 gap-1 my-3">
        {ABILITY_ORDER.map(a => {
          const mod = abilityMod(monster.abilities[a] ?? 10);
          const save = monster.saves?.[a];
          return (
            <button key={a} onClick={() => rollCheck(`${who} · prova di ${ABILITY_NAMES[a as Ability]}`, mod)} className="border border-border bg-card-bg py-1.5 text-center hover:border-accent" title={`Prova di ${ABILITY_NAMES[a as Ability]}`}>
              <div className="text-[10px] font-black uppercase font-serif text-text-muted">{ABILITY_SHORT[a]}</div>
              <div className="font-display font-black">{monster.abilities[a]}</div>
              <div className="text-[11px] text-text-muted">{signed(mod)}{save !== undefined ? <span className="text-accent"> · TS {signed(save)}</span> : null}</div>
            </button>
          );
        })}
      </div>
      {monster.saves && Object.keys(monster.saves).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-1 text-sm">
          <span className="font-bold">Tiri salvezza</span>
          {Object.entries(monster.saves).map(([a, v]) => (
            <button key={a} onClick={() => rollCheck(`${who} · TS ${ABILITY_NAMES[a as Ability]}`, v as number)} className="px-1.5 border border-border hover:border-accent text-xs">{SAVE_LABEL[a]} {signed(v as number)}</button>
          ))}
        </div>
      )}
      {monster.skills && Object.keys(monster.skills).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-1 text-sm">
          <span className="font-bold">Abilità</span>
          {Object.entries(monster.skills).map(([k, v]) => (
            <button key={k} onClick={() => rollCheck(`${who} · ${k}`, v)} className="px-1.5 border border-border hover:border-accent text-xs">{k} {signed(v)}</button>
          ))}
        </div>
      )}
      {line('Vulnerabilità', monster.vulnerabilities?.join(', '))}
      {line('Resistenze', monster.resistances?.join(', '))}
      {line('Immunità ai danni', monster.immunities?.join(', '))}
      {line('Immunità alle condizioni', monster.conditionImmunities?.join(', '))}
      {line('Sensi', monster.senses)}
      {line('Lingue', monster.languages)}
      {line('Grado di sfida', `${monster.cr}${monster.xp !== undefined ? ` (${monster.xp} PE${monster.xpLair ? `, ${monster.xpLair} nella tana` : ''})` : ''}${monster.pb ? ` · Competenza ${signed(monster.pb)}` : ''}`)}

      <Block title="Tratti" actions={monster.traits} />
      <Block title="Azioni" actions={monster.actions} />
      <Block title="Azioni bonus" actions={monster.bonusActions} />
      <Block title="Reazioni" actions={monster.reactions} />
      <Block title="Azioni leggendarie" actions={monster.legendary?.actions}>
        <div className="flex flex-wrap items-center gap-2 py-2 text-sm text-text-muted">
          <Crown className="w-4 h-4 text-accent" />
          {monster.legendary?.uses} usi per round{monster.legendary?.usesInLair && monster.legendary.usesInLair !== monster.legendary.uses ? ` (${monster.legendary.usesInLair} nella tana)` : ''}; si recuperano all’inizio del suo turno.
          {legendary && (
            <span className="flex items-center gap-1 ml-auto" aria-label="Azioni leggendarie disponibili">
              {Array.from({ length: legendary.max }, (_, i) => (
                <button key={i} onClick={() => legendary.onChange(i < legendary.max - legendary.used ? legendary.used + 1 : legendary.used - 1)}
                  className={`w-5 h-5 rotate-45 border ${i < legendary.max - legendary.used ? 'bg-accent border-accent' : 'border-border'}`}
                  title={i < legendary.max - legendary.used ? 'Usa un’azione leggendaria' : 'Recupera'} aria-label={`Azione leggendaria ${i + 1}`} />
              ))}
            </span>
          )}
        </div>
      </Block>
      {monster.notes && <p className="text-sm mt-4 whitespace-pre-line">{monster.notes}</p>}
    </article>
  );
}
