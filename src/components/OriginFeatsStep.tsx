import { BookOpen, Music, Sparkles, Wrench } from 'lucide-react';
import { useCharacter, type CharacterData } from '../contexts/CharacterContext';
import { useHomebrew } from '../hooks/useHomebrew';
import { getSkillProficiencies, getProficiencySummary } from '../lib/characterRules';
import {
  FEAT_PICKS, MI_LISTS, featBase, formatFeatPicks, formatMagicInitiate, getFeatPicks, getOriginFeatSlots, parseMagicInitiate,
  type MagicInitiateChoice, type OriginFeatField,
} from '../lib/featChoices';
import { getSpellBudget } from '../lib/spellBudget';
import { SCHOOL_LABELS } from '../lib/spellEligibility';
import { fixTextEncoding } from '../lib/utils';
import { Counter, OptionCard, Section, StepHeader, Tag, ToggleChip } from './ui';
import { FIELD_LABEL, fixedMagicInitiateList } from '../lib/levelOneChoices';
import type { SpellLike } from '../lib/spellEligibility';

export default function OriginFeatsStep() {
  const { currentCharacter, dispatch } = useCharacter();
  const homebrew = useHomebrew();
  if (!currentCharacter) return null;
  const update = (payload: Partial<CharacterData>) => dispatch({ type: 'UPDATE_CHARACTER', payload });
  const slots = getOriginFeatSlots(currentCharacter);
  const budget = getSpellBudget(currentCharacter, homebrew.spells);

  const renderPicks = (field: OriginFeatField, feat: string) => {
    const base = featBase(feat);
    const def = FEAT_PICKS[base];
    const picks = getFeatPicks(feat);
    // Esclude ciò in cui si è già competenti (non darebbe nulla)
    const owned = new Set([...getSkillProficiencies({ ...currentCharacter, [field]: base }), ...getProficiencySummary({ ...currentCharacter, [field]: base }).tools]);
    const toggle = (opt: string) => {
      const next = picks.includes(opt) ? picks.filter(p => p !== opt) : picks.length < def.count ? [...picks, opt] : picks;
      update({ [field]: formatFeatPicks(base, next) });
    };
    const Icon = base === 'Musicista' ? Music : Wrench;
    return (
      <Section key={field} guide={`picks-${field}`} title={`${base} · ${FIELD_LABEL[field]}`} icon={Icon} actions={<Counter value={picks.length} max={def.count} label="scelte" />} bodyClassName="p-4 space-y-3">
        <p className="text-sm text-text-muted">{def.hint}</p>
        <div className="flex flex-wrap gap-2">
          {def.options().filter(o => picks.includes(o) || !owned.has(o)).map(o => (
            <ToggleChip key={o} selected={picks.includes(o)} disabled={!picks.includes(o) && picks.length >= def.count} onClick={() => toggle(o)}>{o}</ToggleChip>
          ))}
        </div>
      </Section>
    );
  };

  const renderMagicInitiate = (field: OriginFeatField, feat: string) => {
    const choice = parseMagicInitiate(feat)!;
    const save = (next: MagicInitiateChoice, spells = currentCharacter.spells || []) => update({ [field]: formatMagicInitiate(next), spells });
    const setList = (list: string) => {
      if (list === choice.list) return;
      // Cambiando lista si tolgono gli incantesimi scelti con la lista precedente
      const old = new Set([...choice.cantrips, ...(choice.spell ? [choice.spell] : [])]);
      save({ list, cantrips: [] }, (currentCharacter.spells || []).filter(s => !old.has(s)));
    };
    const toggleSpell = (spell: SpellLike, kind: 'c' | 'l') => {
      const poolId = `mi-${field}-${kind}`;
      const name = spell.name;
      const spells = currentCharacter.spells || [];
      if (kind === 'c') {
        if (choice.cantrips.includes(name)) { save({ ...choice, cantrips: choice.cantrips.filter(c => c !== name) }, spells.filter(s => s !== name)); return; }
        if (!budget.checkForPool(spell, poolId).ok) return;
        save({ ...choice, cantrips: [...choice.cantrips, name] }, [...spells, name]);
      } else {
        if (choice.spell === name) { save({ ...choice, spell: undefined }, spells.filter(s => s !== name)); return; }
        if (!budget.checkForPool(spell, poolId).ok) return;
        save({ ...choice, spell: name }, [...spells.filter(s => s !== choice.spell), name]);
      }
    };
    const listId = choice.list ? MI_LISTS[choice.list] : undefined;
    const ofList = (level: number) => homebrew.spells
      .filter(s => s.level === level && listId && s.classes?.includes(listId))
      .sort((a, b) => a.name.localeCompare(b.name, 'it'));
    const card = (s: SpellLike, kind: 'c' | 'l') => {
      const selected = kind === 'c' ? choice.cantrips.includes(s.name) : choice.spell === s.name;
      const check = budget.checkForPool(s, `mi-${field}-${kind}`);
      return (
        <OptionCard key={s.name} selected={selected} disabled={!selected && !check.ok} onClick={() => toggleSpell(s, kind)} className="!p-3"
          title={s.name} subtitle={`${s.level === 0 ? 'Trucchetto' : '1° livello'} · ${SCHOOL_LABELS[s.school as string] || s.school || ''}`}
          meta={<>{s.concentration && <Tag tone="accent">Concentrazione</Tag>}{s.ritual && <Tag>Rituale</Tag>}{!selected && !check.ok && check.reason && <Tag tone="danger">{check.reason}</Tag>}</>}>
          <span className="line-clamp-2" dangerouslySetInnerHTML={{ __html: fixTextEncoding(String(s.description || '')) }} />
        </OptionCard>
      );
    };
    return (
      <div key={field} className="space-y-4">
        <Section guide={`mi-${field}`} title={`Iniziato alla Magia · ${FIELD_LABEL[field]}`} icon={Sparkles} bodyClassName="p-4 space-y-3">
          <p className="text-sm text-text-muted">Impari 2 trucchetti e 1 incantesimo di 1° livello da una lista. L’incantesimo è sempre preparato e puoi lanciarlo una volta gratis ogni Riposo Lungo (oppure con i tuoi slot). Caratteristica da incantatore: Intelligenza, Saggezza o Carisma, a tua scelta.</p>
          {fixedMagicInitiateList(currentCharacter, field) ? (
            <p className="text-sm"><Tag tone="accent">Lista del {choice.list}</Tag> <span className="text-text-muted">fissata dal background.</span></p>
          ) : (
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Lista degli incantesimi">
              {Object.keys(MI_LISTS).map(l => <OptionCard key={l} selected={choice.list === l} onClick={() => setList(l)} title={l} className="!p-3" />)}
            </div>
          )}
        </Section>
        {choice.list && (
          <>
            <Section guide={`mi-${field}-c`} title={`Trucchetti da ${choice.list}`} icon={BookOpen} actions={<Counter value={choice.cantrips.filter(c => budget.poolOf(c) === `mi-${field}-c`).length} max={2} label="scelti" />} bodyClassName="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ofList(0).map(s => card(s, 'c'))}
            </Section>
            <Section guide={`mi-${field}-l`} title={`Incantesimo di 1° livello da ${choice.list}`} icon={BookOpen} actions={<Counter value={choice.spell && budget.poolOf(choice.spell) === `mi-${field}-l` ? 1 : 0} max={1} label="scelto" />} bodyClassName="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ofList(1).map(s => card(s, 'l'))}
            </Section>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <StepHeader eyebrow="Talenti d’origine" title="Le scelte dei tuoi talenti" description={`I tuoi talenti d’origine (${slots.map(s => s.base).join(', ')}) ti fanno scegliere qualcosa: completa i riquadri qui sotto.`} />
      {slots.map(({ field, feat }) => (parseMagicInitiate(feat) ? renderMagicInitiate(field, feat) : renderPicks(field, feat)))}
    </div>
  );
}
