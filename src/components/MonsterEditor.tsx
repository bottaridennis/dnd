import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { CR_OPTIONS, XP_BY_CR } from '../data/encounters';
import { ABILITY_ORDER, ABILITY_SHORT, abilityMod, proficiencyForCr, signed, type Monster, type MonsterAction } from '../lib/bestiary';
import type { Ability } from '../contexts/CharacterContext';
import { Section } from './ui';

const SIZES = ['Minuscola', 'Piccola', 'Media', 'Grande', 'Enorme', 'Mastodontica'];
const TYPES = ['Aberrazione', 'Bestia', 'Celestiale', 'Costrutto', 'Drago', 'Elementale', 'Fatato', 'Gigante', 'Immondo', 'Melma', 'Mostruosità', 'Non Morto', 'Umanoide', 'Vegetale'];
const SECTIONS: [keyof Pick<Monster, 'traits' | 'actions' | 'bonusActions' | 'reactions'>, string][] = [['traits', 'Tratti'], ['actions', 'Azioni'], ['bonusActions', 'Azioni bonus'], ['reactions', 'Reazioni']];

const input = 'bg-panel-bg border border-border rounded-[var(--radius-sm)] px-2 py-1.5 outline-none focus:border-accent w-full';
const label = 'block text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1';
const list = (text: string) => text.split(',').map(s => s.trim()).filter(Boolean);

export function blankMonster(): Monster {
  return {
    id: `hb-${crypto.randomUUID()}`, name: '', size: 'Media', type: 'Umanoide', alignment: '', ac: 12, hp: 11, hpRoll: '2d8+2', speed: '9 m',
    abilities: { STR: 10, DEX: 12, CON: 12, INT: 10, WIS: 10, CHA: 10 }, cr: '1/2', senses: 'Percezione passiva 10', languages: 'Comune',
    actions: [{ name: 'Attacco', desc: 'Tiro per colpire in mischia, portata 1,5 m.', attack: 3, damage: [{ dice: '1d6+1', type: 'Taglienti' }] }], custom: true,
  };
}

/** "2d6+3 Taglienti; 1d6 Fuoco" ⇄ [{dice, type}] */
const damageText = (d?: MonsterAction['damage']) => (d || []).map(x => `${x.dice} ${x.type}`.trim()).join('; ');
const parseDamage = (text: string) => text.split(';').map(s => s.trim()).filter(Boolean).flatMap(part => {
  const match = part.match(/^(\d+d\d+(?:\s*[+-]\s*\d+)?|\d+)\s*(.*)$/i);
  return match ? [{ dice: match[1].replace(/\s+/g, ''), type: match[2].trim() }] : [];
});

const ActionEditor: React.FC<{ action: MonsterAction; onChange: (a: MonsterAction) => void; onRemove: () => void }> = ({ action, onChange, onRemove }) => {
  const [dmg, setDmg] = useState(damageText(action.damage));
  return (
    <div className="border border-border bg-card-bg p-3 space-y-2">
      <div className="flex gap-2">
        <input value={action.name} onChange={e => onChange({ ...action, name: e.target.value })} placeholder="Nome (es. Morso)" className={`${input} font-bold`} aria-label="Nome dell’azione" />
        <button onClick={onRemove} className="p-2 text-text-muted hover:text-danger" aria-label="Rimuovi"><Trash2 className="w-4 h-4" /></button>
      </div>
      <textarea value={action.desc} onChange={e => onChange({ ...action, desc: e.target.value })} rows={2} placeholder="Descrizione" className={`${input} resize-y`} aria-label="Descrizione" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <label><span className={label}>Per colpire</span><input type="number" value={action.attack ?? ''} onChange={e => onChange({ ...action, attack: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0 })} className={input} placeholder="—" /></label>
        <label className="md:col-span-2"><span className={label}>Danni (es. 2d6+3 Taglienti; 1d6 Fuoco)</span>
          <input value={dmg} onChange={e => { setDmg(e.target.value); const parsed = parseDamage(e.target.value); onChange({ ...action, damage: parsed.length ? parsed : undefined }); }} className={input} />
        </label>
        <label><span className={label}>TS (car. / CD)</span>
          <div className="flex gap-1">
            <select value={action.save?.ability || ''} onChange={e => onChange({ ...action, save: e.target.value ? { ability: e.target.value, dc: action.save?.dc ?? 12 } : undefined })} className={input}>
              <option value="">—</option>{ABILITY_ORDER.map(a => <option key={a} value={a}>{ABILITY_SHORT[a]}</option>)}
            </select>
            {action.save && <input type="number" value={action.save.dc} onChange={e => onChange({ ...action, save: { ...action.save!, dc: parseInt(e.target.value, 10) || 10 } })} className={`${input} w-16`} aria-label="CD" />}
          </div>
        </label>
        <label><span className={label}>Uso</span><input value={action.usage || ''} onChange={e => onChange({ ...action, usage: e.target.value || undefined })} placeholder="Ricarica 5–6" className={input} /></label>
      </div>
    </div>
  );
};

export default function MonsterEditor({ initial, onSave, onCancel }: { initial: Monster; onSave: (m: Monster) => void; onCancel: () => void }) {
  const [m, setM] = useState<Monster>(initial);
  const [lists, setLists] = useState({
    resistances: (initial.resistances || []).join(', '), immunities: (initial.immunities || []).join(', '),
    vulnerabilities: (initial.vulnerabilities || []).join(', '), conditionImmunities: (initial.conditionImmunities || []).join(', '),
  });
  const set = (patch: Partial<Monster>) => setM(cur => ({ ...cur, ...patch }));
  const pb = proficiencyForCr(m.cr);
  const toggleSave = (a: Ability) => {
    const saves = { ...(m.saves || {}) };
    if (saves[a] !== undefined) delete saves[a]; else saves[a] = abilityMod(m.abilities[a]) + pb;
    set({ saves });
  };

  const save = () => onSave({
    ...m,
    name: m.name.trim() || 'Mostro senza nome',
    pb,
    xp: XP_BY_CR[m.cr],
    resistances: list(lists.resistances), immunities: list(lists.immunities),
    vulnerabilities: list(lists.vulnerabilities), conditionImmunities: list(lists.conditionImmunities),
    custom: true,
  });

  return (
    <div className="space-y-4">
      <Section title={initial.name ? `Modifica · ${initial.name}` : 'Nuovo mostro'} bodyClassName="p-4 space-y-3">
        <div className="grid md:grid-cols-4 gap-3">
          <label className="md:col-span-2"><span className={label}>Nome</span><input value={m.name} onChange={e => set({ name: e.target.value })} className={`${input} text-lg font-bold`} placeholder="Es. Capitano Orchesco" /></label>
          <label><span className={label}>Taglia</span><select value={m.size} onChange={e => set({ size: e.target.value })} className={input}>{SIZES.map(s => <option key={s}>{s}</option>)}</select></label>
          <label><span className={label}>Tipo</span><input list="monster-types" value={m.type} onChange={e => set({ type: e.target.value })} className={input} /><datalist id="monster-types">{TYPES.map(t => <option key={t} value={t} />)}</datalist></label>
          <label><span className={label}>Allineamento</span><input value={m.alignment || ''} onChange={e => set({ alignment: e.target.value })} className={input} /></label>
          <label><span className={label}>Grado di sfida</span><select value={m.cr} onChange={e => set({ cr: e.target.value })} className={input}>{CR_OPTIONS.map(c => <option key={c}>{c}</option>)}</select></label>
          <label><span className={label}>CA</span><input type="number" value={m.ac} onChange={e => set({ ac: parseInt(e.target.value, 10) || 10 })} className={input} /></label>
          <label><span className={label}>PF (dadi)</span><div className="flex gap-1"><input type="number" value={m.hp} onChange={e => set({ hp: Math.max(1, parseInt(e.target.value, 10) || 1) })} className={`${input} w-20`} aria-label="Punti Ferita" /><input value={m.hpRoll || ''} onChange={e => set({ hpRoll: e.target.value })} className={input} placeholder="2d8+2" aria-label="Dadi Vita" /></div></label>
          <label className="md:col-span-2"><span className={label}>Velocità</span><input value={m.speed} onChange={e => set({ speed: e.target.value })} className={input} placeholder="9 m, volare 18 m" /></label>
          <label className="md:col-span-2"><span className={label}>Sensi</span><input value={m.senses || ''} onChange={e => set({ senses: e.target.value })} className={input} /></label>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {ABILITY_ORDER.map(a => (
            <div key={a} className="border border-border bg-card-bg p-2 text-center">
              <div className="text-[10px] font-black uppercase font-serif text-text-muted">{ABILITY_SHORT[a]}</div>
              <input type="number" min={1} max={30} value={m.abilities[a]} onChange={e => set({ abilities: { ...m.abilities, [a]: Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 10)) } })} className="w-full text-center font-display font-black text-xl bg-transparent" aria-label={ABILITY_SHORT[a]} />
              <div className="text-xs text-text-muted">{signed(abilityMod(m.abilities[a]))}</div>
              <label className="flex items-center justify-center gap-1 text-[10px] mt-1"><input type="checkbox" checked={m.saves?.[a] !== undefined} onChange={() => toggleSave(a)} className="accent-accent" /> TS</label>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted">Bonus di competenza per GS {m.cr}: {signed(pb)} · {XP_BY_CR[m.cr] ?? 0} PE. Le caselle TS aggiungono la competenza al tiro salvezza.</p>

        <div className="grid md:grid-cols-2 gap-3">
          {([['resistances', 'Resistenze'], ['immunities', 'Immunità ai danni'], ['vulnerabilities', 'Vulnerabilità'], ['conditionImmunities', 'Immunità alle condizioni']] as const).map(([k, l]) => (
            <label key={k}><span className={label}>{l} (separate da virgola)</span><input value={lists[k]} onChange={e => setLists({ ...lists, [k]: e.target.value })} className={input} /></label>
          ))}
          <label className="md:col-span-2"><span className={label}>Lingue</span><input value={m.languages || ''} onChange={e => set({ languages: e.target.value })} className={input} /></label>
        </div>
      </Section>

      {SECTIONS.map(([key, title]) => (
        <Section key={key} title={title} bodyClassName="p-3 space-y-2">
          {(m[key] || []).map((a, i) => (
            <ActionEditor key={i} action={a}
              onChange={next => set({ [key]: (m[key] || []).map((x, j) => (j === i ? next : x)) })}
              onRemove={() => set({ [key]: (m[key] || []).filter((_, j) => j !== i) })} />
          ))}
          <button onClick={() => set({ [key]: [...(m[key] || []), { name: '', desc: '' }] })} className="secondary-action flex items-center gap-1.5"><Plus className="w-4 h-4" /> Aggiungi</button>
        </Section>
      ))}

      <Section title="Azioni leggendarie" bodyClassName="p-3 space-y-2">
        <label className="flex items-center gap-2 text-sm">Usi per round
          <input type="number" min={0} max={5} value={m.legendary?.uses ?? 0} onChange={e => {
            const uses = Math.max(0, parseInt(e.target.value, 10) || 0);
            set({ legendary: uses ? { uses, usesInLair: m.legendary?.usesInLair ?? uses, actions: m.legendary?.actions || [] } : undefined });
          }} className={`${input} !w-20`} />
        </label>
        {m.legendary && (
          <>
            {m.legendary.actions.map((a, i) => (
              <ActionEditor key={i} action={a}
                onChange={next => set({ legendary: { ...m.legendary!, actions: m.legendary!.actions.map((x, j) => (j === i ? next : x)) } })}
                onRemove={() => set({ legendary: { ...m.legendary!, actions: m.legendary!.actions.filter((_, j) => j !== i) } })} />
            ))}
            <button onClick={() => set({ legendary: { ...m.legendary!, actions: [...m.legendary!.actions, { name: '', desc: '' }] } })} className="secondary-action flex items-center gap-1.5"><Plus className="w-4 h-4" /> Aggiungi azione leggendaria</button>
          </>
        )}
      </Section>

      <Section title="Note" bodyClassName="p-3"><textarea value={m.notes || ''} onChange={e => set({ notes: e.target.value })} rows={3} className={`${input} resize-y`} placeholder="Tattiche, tesoro, aspetto…" /></Section>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-bg/90 backdrop-blur py-3">
        <button onClick={onCancel} className="secondary-action flex items-center gap-1.5"><X className="w-4 h-4" /> Annulla</button>
        <button onClick={save} className="primary-action px-5 py-2.5 flex items-center gap-2"><Save className="w-4 h-4" /> Salva mostro</button>
      </div>
    </div>
  );
}
