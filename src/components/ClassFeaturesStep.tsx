import { Award, Shield, Sparkles, Swords } from 'lucide-react';
import { useCharacter, type CharacterData } from '../contexts/CharacterContext';
import { classesData } from '../data/rules2024';
import { type WeaponData } from '../data/weaponsData';
import { weaponMasteryData } from '../constants/weaponMastery';
import { getSkillProficiencies, getWeaponMasteryCount } from '../lib/characterRules';
import { CLASS_ORDERS } from '../lib/featChoices';
import { EXPERTISE_AT_1, STYLE_FEATS, masteryWeaponsFor } from '../lib/levelOneChoices';
import { fixTextEncoding } from '../lib/utils';
import { Counter, OptionCard, Section, StepHeader, Tag, ToggleChip } from './ui';

export default function ClassFeaturesStep() {
  const { currentCharacter, dispatch } = useCharacter();
  if (!currentCharacter) return null;
  const classId = currentCharacter.classId;
  const def = classesData.find(c => c.id === classId);
  const update = (payload: Partial<CharacterData>) => dispatch({ type: 'UPDATE_CHARACTER', payload });

  const order = CLASS_ORDERS[classId];
  const chosenOrder = currentCharacter.classes?.[classId]?.order;
  const setOrder = (id: string) => update({ classes: { ...(currentCharacter.classes || {}), [classId]: { ...(currentCharacter.classes?.[classId] || { level: 1 }), order: id } } });

  const masteryCount = getWeaponMasteryCount(currentCharacter);
  const masteries = currentCharacter.weaponMasteries || {};
  const toggleMastery = (w: WeaponData) => {
    const next = { ...masteries };
    if (next[w.name]) delete next[w.name];
    else if (Object.keys(next).length < masteryCount) next[w.name] = w.mastery;
    update({ weaponMasteries: next });
  };

  const expertiseCount = EXPERTISE_AT_1[classId] || 0;
  const expertise = currentCharacter.expertiseSkills || [];
  const proficient = getSkillProficiencies(currentCharacter).sort((a, b) => a.localeCompare(b, 'it'));
  const toggleExpertise = (skill: string) => update({ expertiseSkills: expertise.includes(skill) ? expertise.filter(s => s !== skill) : expertise.length < expertiseCount ? [...expertise, skill] : expertise });

  const styleFeat = (currentCharacter.feats || []).find(f => STYLE_FEATS.some(s => s.name === f.split(' (')[0]));
  const setStyle = (name: string) => update({ feats: [...(currentCharacter.feats || []).filter(f => f !== styleFeat), ...(styleFeat === name ? [] : [name])] });

  return (
    <div className="space-y-6">
      <StepHeader eyebrow="Privilegi di classe" title={`Le scelte del ${def?.name || 'personaggio'}`} description="Al 1° livello la tabella della tua classe ti fa scegliere alcuni privilegi. Ogni scelta è spiegata: puoi cambiarla finché non crei il personaggio." />

      {order && (
        <Section guide="order" title={order.title} icon={Sparkles} bodyClassName="p-4 grid sm:grid-cols-2 gap-3">
          {order.options.map(o => <OptionCard key={o.id} selected={chosenOrder === o.id} onClick={() => setOrder(o.id)} title={o.name} subtitle={o.desc} />)}
        </Section>
      )}

      {classId === 'fighter' && (
        <Section guide="style" title="Stile di Combattimento" icon={Shield} actions={<Counter value={styleFeat ? 1 : 0} max={1} label="scelto" />} bodyClassName="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STYLE_FEATS.map(f => (
            <OptionCard key={f.name} selected={styleFeat === f.name} onClick={() => setStyle(f.name)} title={f.name}>
              <span className="line-clamp-3" dangerouslySetInnerHTML={{ __html: fixTextEncoding(f.description) }} />
            </OptionCard>
          ))}
        </Section>
      )}

      {masteryCount > 0 && (
        <Section guide="masteries" title="Maestria nelle armi" icon={Swords} actions={<Counter value={Object.keys(masteries).length} max={masteryCount} label="scelte" />} bodyClassName="p-4 space-y-3">
          <p className="text-sm text-text-muted">Con le armi scelte puoi usare la loro proprietà speciale. Le altre si sbloccano salendo di livello; puoi cambiarle dopo ogni Riposo Lungo dalla scheda.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {masteryWeaponsFor(classId).map(w => {
              const selected = Boolean(masteries[w.name]);
              const full = Object.keys(masteries).length >= masteryCount;
              return (
                <OptionCard key={w.id} selected={selected} disabled={!selected && full} onClick={() => toggleMastery(w)} className="!p-3"
                  title={w.name} subtitle={`${w.damage} ${w.damageType} · ${w.category}${w.kind === 'ranged' ? ' a distanza' : ''}`}
                  meta={<Tag tone="accent" title={weaponMasteryData[w.mastery]?.effect}>{w.mastery}: {weaponMasteryData[w.mastery]?.description || ''}</Tag>} />
              );
            })}
          </div>
        </Section>
      )}

      {expertiseCount > 0 && (
        <Section guide="expertise" title="Maestria nelle abilità" icon={Award} actions={<Counter value={expertise.length} max={expertiseCount} label="scelte" />} bodyClassName="p-4 space-y-3">
          <p className="text-sm text-text-muted">Il bonus di competenza raddoppia nelle abilità scelte. Puoi scegliere solo abilità in cui sei già competente.</p>
          <div className="flex flex-wrap gap-2">
            {proficient.map(skill => (
              <ToggleChip key={skill} selected={expertise.includes(skill)} disabled={!expertise.includes(skill) && expertise.length >= expertiseCount} onClick={() => toggleExpertise(skill)}>{skill}</ToggleChip>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
