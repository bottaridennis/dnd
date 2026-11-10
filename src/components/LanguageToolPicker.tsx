import React from 'react';
import { Languages, Wrench } from 'lucide-react';
import { useCharacter } from '../contexts/CharacterContext';
import { backgroundsData } from '../data/rules2024';
import {
  ALL_TOOLS, ARTISAN_TOOLS, MUSICAL_INSTRUMENTS, RARE_LANGUAGES, STANDARD_LANGUAGES,
  getClassToolChoices, getFixedClassTools, getFixedLanguages, getLanguageChoices,
} from '../data/languages';
import { getClassLevels } from '../lib/characterRules';
import { Section, ToggleChip, Counter } from './ui';

/** Requisiti di scelta di lingue e strumenti per il personaggio in creazione. */
export function getOriginChoiceRequirements(character: Parameters<typeof getClassLevels>[0] & { backgroundId?: string }) {
  const classLevels = getClassLevels(character);
  const bg = backgroundsData.find(b => b.id === character.backgroundId);
  const bgChoice = (bg?.tools || []).find(t => t.includes('(uno)'));
  const bgOptions = !bgChoice ? [] : bgChoice.startsWith('Strumento Musicale') ? MUSICAL_INSTRUMENTS
    : bgChoice.startsWith('Set da Gioco') ? ALL_TOOLS.filter(t => t.startsWith('Set da Gioco')) : ARTISAN_TOOLS;
  const classChoice = getClassToolChoices(character.classId);
  return {
    languageCount: getLanguageChoices(classLevels),
    fixedLanguages: getFixedLanguages(classLevels),
    fixedTools: [...(bg?.tools || []).filter(t => !t.includes('(uno)')), ...getFixedClassTools(classLevels)],
    toolCount: (bgChoice ? 1 : 0) + (classChoice?.count || 0),
    toolOptions: Array.from(new Set([...bgOptions, ...(classChoice?.options || [])])),
    toolLabel: [bgChoice ? `${bgChoice.replace(' (uno)', '')} dal background` : '', classChoice ? `${classChoice.label} dalla classe` : ''].filter(Boolean).join(' + '),
  };
}

export default function LanguageToolPicker() {
  const { currentCharacter, dispatch } = useCharacter();
  if (!currentCharacter) return null;
  const req = getOriginChoiceRequirements(currentCharacter);
  const languages = currentCharacter.languages || [];
  const tools = currentCharacter.toolProficiencies || [];

  const toggle = (field: 'languages' | 'toolProficiencies', value: string, max: number) => {
    const list = field === 'languages' ? languages : tools;
    const next = list.includes(value) ? list.filter(v => v !== value) : list.length < max ? [...list, value] : list;
    dispatch({ type: 'UPDATE_CHARACTER', payload: { [field]: next } });
  };

  const chip = (value: string, selected: boolean, disabled: boolean, onClick: () => void) => (
    <ToggleChip key={value} selected={selected} disabled={disabled} onClick={onClick}>{value}</ToggleChip>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Section title="Lingue" icon={Languages} actions={<Counter value={languages.length} max={req.languageCount} label="a scelta" />} bodyClassName="p-4 space-y-3">
        <p className="text-sm text-text-muted">Conosci già: <strong className="text-text-primary">{req.fixedLanguages.join(', ')}</strong>. Scegli tra le lingue standard; le rare con il permesso del Master.</p>
        <div className="flex flex-wrap gap-2">
          {STANDARD_LANGUAGES.filter(l => !req.fixedLanguages.includes(l)).map(l => chip(l, languages.includes(l), !languages.includes(l) && languages.length >= req.languageCount, () => toggle('languages', l, req.languageCount)))}
        </div>
        <details className="group">
          <summary className="cursor-pointer text-xs uppercase font-bold tracking-wider text-text-muted font-serif hover:text-text-primary">Lingue rare</summary>
          <div className="flex flex-wrap gap-2 mt-3">
            {RARE_LANGUAGES.filter(l => !req.fixedLanguages.includes(l)).map(l => chip(l, languages.includes(l), !languages.includes(l) && languages.length >= req.languageCount, () => toggle('languages', l, req.languageCount)))}
          </div>
        </details>
      </Section>

      <Section title="Strumenti" icon={Wrench} actions={req.toolCount > 0 ? <Counter value={tools.length} max={req.toolCount} label="a scelta" /> : undefined} bodyClassName="p-4 space-y-3">
        <p className="text-sm text-text-muted">
          {req.fixedTools.length ? <>Già ottenuti: <strong className="text-text-primary">{req.fixedTools.join(', ')}</strong>. </> : null}
          {req.toolCount > 0 ? `Scegli ${req.toolLabel}.` : 'Nessuna scelta richiesta.'}
        </p>
        {req.toolCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {req.toolOptions.filter(t => !req.fixedTools.includes(t)).map(t => chip(t, tools.includes(t), !tools.includes(t) && tools.length >= req.toolCount, () => toggle('toolProficiencies', t, req.toolCount)))}
          </div>
        )}
      </Section>
    </div>
  );
}
