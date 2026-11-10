import React from 'react';
import type { CharacterData } from '../contexts/CharacterContext';
import type { CharacterStats } from '../lib/characterRules';
import { ABILITIES, ABILITY_NAMES, getClassLevels, getProficiencySummary } from '../lib/characterRules';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { getClassFeaturesUpTo } from '../data/classFeatures';
import { getSubclassFeaturesUpTo, getSubclassSpells } from '../data/subclassFeatures';
import { getMaxResources } from '../hooks/useResourceTracker';
import { getClassResources } from '../data/classResources';
import { signed } from '../lib/dice';

interface Props {
  character: CharacterData;
  stats: CharacterStats;
  findSpell: (name: string) => any;
}

const Box = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) => (
  <div className="print-box text-center">
    <div className="print-label">{label}</div>
    <div className="text-2xl font-bold leading-tight">{value}</div>
    {sub && <div className="text-[9px]">{sub}</div>}
  </div>
);

/** Scheda in formato stampa (visibile solo con window.print → "Salva come PDF"). */
export default function PrintSheet({ character, stats, findSpell }: Props) {
  const classLevels = getClassLevels(character);
  const species = speciesData.find(s => s.id === character.speciesId);
  const background = backgroundsData.find(b => b.id === character.backgroundId);
  const prof = getProficiencySummary(character);
  const slots = getMaxResources(character);
  const resources = getClassResources(character, stats.mods);
  const subclassSpells = Object.values(classLevels).flatMap(c => getSubclassSpells(c.subclass, c.level));
  const spellsByLevel = [...character.spells, ...subclassSpells, ...(character.innateSpells || [])]
    .map(name => ({ name, details: findSpell(name) }))
    .reduce((acc, s) => {
      const lvl = s.details?.level ?? 1;
      (acc[lvl] = acc[lvl] || []).push(s);
      return acc;
    }, {} as Record<number, { name: string; details: any }[]>);
  const currency = character.currency || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

  return (
    <div className="print-sheet hidden print:block text-black">
      <header className="flex items-end justify-between border-b-2 border-black pb-2 mb-3">
        <div>
          <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{character.name}</div>
          <div className="text-sm">
            {species?.name} · {Object.entries(classLevels).map(([id, c]) => `${classesData.find(x => x.id === id)?.name} ${c.level}${c.subclass ? ` (${c.subclass})` : ''}`).join(' / ')}
            {' · '}{background?.name}{character.alignment ? ` · ${character.alignment}` : ''}
          </div>
        </div>
        <div className="text-right text-sm">
          <div>Livello <strong>{stats.level}</strong> · Competenza <strong>{signed(stats.proficiencyBonus)}</strong></div>
          <div className="text-[10px]">Forge · Cronache degli Eroi (PHB 2024)</div>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-2 mb-3">
        <Box label="Classe Armatura" value={stats.acBase} sub={stats.armorClass.source} />
        <Box label="PF massimi" value={stats.hpMax} sub={`Attuali: ${character.hpCurrent} · Temp: ${character.hpTemp || 0}`} />
        <Box label="Dadi Vita" value={stats.hitDice.map(h => `${h.total}d${h.die}`).join(' + ')} />
        <Box label="Iniziativa" value={signed(stats.initiative)} />
        <Box label="Velocità" value={`${stats.speed} m`} />
        <Box label="Percezione passiva" value={stats.passivePerception} />
        <Box label="Scurovisione" value={stats.darkvision ? `${stats.darkvision} m` : '—'} />
      </div>

      <div className="grid grid-cols-[1.1fr_1fr_1.4fr] gap-3">
        <section>
          <h3 className="print-h">Caratteristiche e Tiri Salvezza</h3>
          <table className="w-full text-sm">
            <tbody>
              {ABILITIES.map(a => {
                const save = stats.savingThrows.find(s => s.ability === a)!;
                return (
                  <tr key={a} className="border-b border-black/30">
                    <td className="py-0.5">{ABILITY_NAMES[a]}</td>
                    <td className="text-center font-bold">{stats.scores[a]}</td>
                    <td className="text-center">{signed(stats.mods[a])}</td>
                    <td className="text-right">{save.isProficient ? '● ' : '○ '}TS {signed(save.mod)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h3 className="print-h mt-3">Competenze</h3>
          <p className="text-xs"><strong>Armature:</strong> {prof.armor.join(', ') || 'nessuna'}</p>
          <p className="text-xs"><strong>Armi:</strong> {prof.weapons.join(', ')}</p>
          <p className="text-xs"><strong>Strumenti:</strong> {prof.tools.join(', ') || 'nessuno'}</p>
          <p className="text-xs"><strong>Lingue:</strong> {prof.languages.join(', ')}</p>
          {character.resistances?.length > 0 && <p className="text-xs"><strong>Resistenze:</strong> {character.resistances.join(', ')}</p>}
        </section>

        <section>
          <h3 className="print-h">Abilità</h3>
          <ul className="text-xs space-y-0.5">
            {stats.skills.map(s => (
              <li key={s.name} className="flex justify-between border-b border-black/20">
                <span>{s.isExpert ? '◆' : s.isProficient ? '●' : '○'} {s.name} <span className="opacity-60">({s.ability})</span></span>
                <strong>{signed(s.mod)}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="print-h">Attacchi</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-left"><th>Arma</th><th>Colpire</th><th>Danni</th></tr></thead>
            <tbody>
              {stats.attacks.map(a => (
                <tr key={a.itemId} className="border-b border-black/20">
                  <td>{a.name}{a.masteryActive && a.mastery ? ` (${a.mastery})` : ''}</td>
                  <td>{signed(a.attackBonus)}</td>
                  <td>{a.damage} {a.damageType}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {resources.length > 0 && (
            <>
              <h3 className="print-h mt-3">Risorse</h3>
              <ul className="text-xs">
                {resources.map(r => <li key={r.id}>{r.name}: {r.kind === 'pool' ? `${r.max} punti` : '☐ '.repeat(Math.min(r.max, 10))} <span className="opacity-60">({r.recovery === 'long' ? 'R. lungo' : 'R. breve'})</span></li>)}
              </ul>
            </>
          )}

          <h3 className="print-h mt-3">Equipaggiamento</h3>
          <p className="text-xs">{(character.inventoryItems || []).map(i => `${i.name}${i.quantity > 1 ? ` ×${i.quantity}` : ''}${i.isEquipped ? '*' : ''}`).join(', ') || '—'}</p>
          <p className="text-xs mt-1"><strong>Monete:</strong> {currency.pp} mp · {currency.gp} mo · {currency.ep} me · {currency.sp} ma · {currency.cp} mr</p>
        </section>
      </div>

      {stats.spellcasting.length > 0 && (
        <section className="mt-3 break-inside-avoid">
          <h3 className="print-h">Incantesimi</h3>
          <p className="text-xs mb-1">
            {stats.spellcasting.map(c => `${c.label}: CD ${c.saveDc}, attacco ${signed(c.attackBonus)}`).join(' · ')}
            {' · Slot: '}{slots.spellSlots.map((n, i) => (n ? `${i + 1}° ${'☐'.repeat(n)}` : '')).filter(Boolean).join('  ')}
            {slots.pactMagic.count ? ` · Patto (${slots.pactMagic.level}°) ${'☐'.repeat(slots.pactMagic.count)}` : ''}
          </p>
          <div className="columns-3 text-xs gap-4">
            {Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b).map(lvl => (
              <div key={lvl} className="break-inside-avoid mb-1">
                <strong>{lvl === 0 ? 'Trucchetti' : `${lvl}° livello`}:</strong>{' '}
                {spellsByLevel[lvl].map(s => s.details?.displayName || s.name).join(', ')}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3 break-inside-avoid">
        <h3 className="print-h">Privilegi, Tratti e Talenti</h3>
        <div className="columns-2 text-xs gap-6">
          {Object.entries(classLevels).map(([id, c]) => (
            <p key={id} className="mb-1"><strong>{classesData.find(x => x.id === id)?.name}:</strong> {[...getClassFeaturesUpTo(id, c.level).map(f => f.name).filter(n => !n.startsWith('Talento') && n !== 'Privilegio di Sottoclasse' && n !== 'Benedizione Epica' && !(n === 'Sottoclasse' && c.subclass)), ...getSubclassFeaturesUpTo(c.subclass, c.level).map(f => f.name)].join(', ')}</p>
          ))}
          <p className="mb-1"><strong>Specie ({species?.name}):</strong> {(species?.traits || []).join(', ')}</p>
          <p className="mb-1"><strong>Talenti:</strong> {[character.originFeat, character.bonusOriginFeat, ...character.feats].filter(Boolean).join(', ')}</p>
          {character.invocations.length > 0 && <p className="mb-1"><strong>Suppliche Occulte:</strong> {character.invocations.join(', ')}</p>}
        </div>
      </section>

      {(character.appearance || character.description || character.trinket) && (
        <section className="mt-3 break-inside-avoid text-xs">
          <h3 className="print-h">Storia</h3>
          {character.appearance && <p><strong>Aspetto:</strong> {character.appearance}</p>}
          {character.description && <p><strong>Personalità:</strong> {character.description}</p>}
          {character.trinket && <p><strong>Ninnolo:</strong> {character.trinket}</p>}
        </section>
      )}
    </div>
  );
}
