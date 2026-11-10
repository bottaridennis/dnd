import React from 'react';
import { Languages, Wrench } from 'lucide-react';
import { useCharacter } from '../contexts/CharacterContext';
import { backgroundsData } from '../data/rules2024';
import {
  ALL_TOOLS, ARTISAN_TOOLS, MUSICAL_INSTRUMENTS, RARE_LANGUAGES, STANDARD_LANGUAGES,
  getClassToolChoices, getFixedClassTools, getFixedLanguages, getLanguageChoices,
} from '../data/languages';
import { getClassLevels } from '../lib/characterRules';

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
    <button key={value} type="button" onClick={onClick} disabled={disabled}
      className={`px-3 py-1.5 border text-sm transition-colors ${selected ? 'border-accent bg-accent/10 text-accent font-bold' : 'border-border bg-card-bg hover:border-accent'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
      {value}
    </button>
  );

  return (
    <div className="space-y-8">
      <section className="bg-panel-bg border border-border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-serif text-lg flex items-center gap-2"><Languages className="w-4 h-4 text-accent" /> Lingue</h4>
          <span className="text-[11px] uppercase font-bold tracking-widest text-accent">{languages.length}/{req.languageCount} a scelta</span>
        </div>
        <p className="text-sm text-text-muted">Conosci già: <strong>{req.fixedLanguages.join(', ')}</strong>. Scegli {req.languageCount} lingue (di solito tra quelle standard; le rare con il permesso del DM).</p>
        <div className="flex flex-wrap gap-2">
          {STANDARD_LANGUAGES.filter(l => !req.fixedLanguages.includes(l)).map(l => chip(l, languages.includes(l), !languages.includes(l) && languages.length >= req.languageCount, () => toggle('languages', l, req.languageCount)))}
        </div>
        <details>
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-text-muted">Lingue rare</summary>
          <div className="flex flex-wrap gap-2 mt-3">
            {RARE_LANGUAGES.filter(l => !req.fixedLanguages.includes(l)).map(l => chip(l, languages.includes(l), !languages.includes(l) && languages.length >= req.languageCount, () => toggle('languages', l, req.languageCount)))}
          </div>
        </details>
      </section>

      <section className="bg-panel-bg border border-border p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-serif text-lg flex items-center gap-2"><Wrench className="w-4 h-4 text-accent" /> Strumenti</h4>
          {req.toolCount > 0 && <span className="text-[11px] uppercase font-bold tracking-widest text-accent">{tools.length}/{req.toolCount} a scelta</span>}
        </div>
        <p className="text-sm text-text-muted">
          {req.fixedTools.length ? <>Competenze già ottenute: <strong>{req.fixedTools.join(', ')}</strong>. </> : null}
          {req.toolCount > 0 ? `Scegli ${req.toolLabel}.` : 'Nessuna scelta richiesta.'}
        </p>
        {req.toolCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {req.toolOptions.filter(t => !req.fixedTools.includes(t)).map(t => chip(t, tools.includes(t), !tools.includes(t) && tools.length >= req.toolCount, () => toggle('toolProficiencies', t, req.toolCount)))}
          </div>
        )}
      </section>
    </div>
  );
}
