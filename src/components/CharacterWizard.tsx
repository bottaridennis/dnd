
import React, { useState } from 'react';
import { useCharacter, initialCharacter, CharacterData, Ability } from '../contexts/CharacterContext';
import { useAuth } from '../contexts/AuthContext';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData, ALL_SKILLS, ORIGIN_FEATS } from '../data/rules2024';
import {
  ChevronRight, ChevronLeft, Save, Loader2, Dices, Check, Target, Users, ScrollText, Sword, Axe, Music, Sun, Leaf, Hand, ShieldPlus, Crosshair, VenetianMask, Flame, Eye, BookOpen,
} from 'lucide-react';
import { Section, OptionCard, Tag, ToggleChip, StepHeader, Counter } from './ui';

const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  barbarian: Axe, bard: Music, cleric: Sun, druid: Leaf, fighter: Sword, monk: Hand,
  paladin: ShieldPlus, ranger: Crosshair, rogue: VenetianMask, sorcerer: Flame, warlock: Eye, wizard: BookOpen,
};

const CLASS_BLURBS: Record<string, string> = {
  barbarian: 'Guerriero primordiale che combatte in preda all’Ira.',
  bard: 'Artista che intreccia magia, ispirazione e versatilità.',
  cleric: 'Sacerdote che incanala il potere della propria divinità.',
  druid: 'Custode della natura capace di mutare forma.',
  fighter: 'Maestro delle armi e delle armature in ogni mischia.',
  monk: 'Artista marziale che usa il Focus e la velocità.',
  paladin: 'Campione sacro legato a un giuramento.',
  ranger: 'Esploratore e cacciatore con magia della natura.',
  rogue: 'Specialista furtivo, abile e letale con l’Attacco Furtivo.',
  sorcerer: 'Incantatore con magia innata e Metamagia.',
  warlock: 'Incantatore che ha stretto un patto con un’entità.',
  wizard: 'Studioso della magia arcana con un libro di incantesimi.',
};
import AbilityScoresStep, { validateAbilityScores } from './AbilityScoresStep';
import { getOriginChoiceRequirements } from './LanguageToolPicker';
import { STANDARD_LANGUAGES } from '../data/languages';
import DetailsStep from './DetailsStep';
import SpellsFeatsStep from './SpellsFeatsStep';
import { getInvocationBudget, getSpellBudget } from '../lib/spellBudget';
import { useHomebrew } from '../hooks/useHomebrew';
import StartingEquipment from './StartingEquipment';
import SummaryStep from './SummaryStep';
import { useSpeciesAutomation } from '../hooks/useSpeciesAutomation';
import { abilityMap } from '../lib/utils';
import { processStartingItem } from '../data/weaponsData';
import { computeHpMax, getFinalScores, getModifiers, STANDARD_ARRAY, ABILITIES } from '../lib/characterRules';
import { getSpeciesDerived } from '../lib/species';

const shuffle = <T,>(list: T[]): T[] => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const STEPS = [
  'Classe',
  'Origine',
  'Caratteristiche',
  'Dettagli',
  'Magie e Talenti',
  'Equipaggiamento',
  'Riepilogo'
];

interface WizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function CharacterWizard({ onComplete, onCancel }: WizardProps) {
  const { currentCharacter, dispatch } = useCharacter();
  const { user } = useAuth();
  const homebrew = useHomebrew();
  
  // Automate species benefits
  useSpeciesAutomation();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const getBgSkills = () => backgroundsData.find(b => b.id === currentCharacter?.backgroundId)?.skills || [];
  const getClassSkillPicks = () => {
    const bgSkills = getBgSkills();
    return (currentCharacter?.proficientSkills || []).filter(s => !bgSkills.includes(s));
  };

  /** Messaggio che spiega cosa manca per proseguire (null = si può proseguire). */
  const stepIssue = (): string | null => {
    if (!currentCharacter) return 'Caricamento…';
    const charClass = classesData.find(c => c.id === currentCharacter.classId);
    switch (currentStep) {
      case 0: {
        if (!charClass) return 'Scegli una classe.';
        if (getClassSkillPicks().length !== charClass.skillChoices) return `Scegli ${charClass.skillChoices} abilità di classe.`;
        return null;
      }
      case 1: {
        if (!currentCharacter.speciesId) return 'Scegli una specie.';
        const species = speciesData.find(s => s.id === currentCharacter.speciesId) as any;
        if (species?.subOptions && !species.subOptions.some((o: any) => o.id === currentCharacter.speciesSubOption)) return 'Scegli il lignaggio della specie.';
        if (species?.skillChoices && (currentCharacter.speciesSkills || []).length !== species.skillChoices) return 'Scegli l’abilità concessa dalla specie.';
        if (species?.id === 'human' && !currentCharacter.bonusOriginFeat) return 'Scegli il Talento d’Origine del tratto Versatile.';
        if (!currentCharacter.backgroundId) return 'Scegli un background.';
        if (charClass && getClassSkillPicks().length !== charClass.skillChoices) return `Il background copre una tua abilità di classe: scegline un’altra (${getClassSkillPicks().length}/${charClass.skillChoices}).`;
        return null;
      }
      case 2: {
        const boosts = currentCharacter.selectedBoosts || [];
        const required = currentCharacter.boostMode === '1/1/1' ? 3 : 2;
        const allowed = backgroundsData.find(b => b.id === currentCharacter.backgroundId)?.boosts || [];
        if (boosts.length !== required || boosts.some(b => !allowed.includes(b))) return `Assegna i bonus del background (${boosts.length}/${required}).`;
        return validateAbilityScores(currentCharacter.abilityMethod || 'pointbuy', currentCharacter.abilityScores);
      }
      case 3: {
        if (!currentCharacter.name?.trim()) return 'Dai un nome al personaggio.';
        const req = getOriginChoiceRequirements(currentCharacter);
        if ((currentCharacter.languages || []).length !== req.languageCount) return `Scegli ${req.languageCount} lingue (${(currentCharacter.languages || []).length}/${req.languageCount}).`;
        if ((currentCharacter.toolProficiencies || []).length !== req.toolCount) return `Scegli gli strumenti: ${req.toolLabel}.`;
        return null;
      }
      case 4: {
        const budget = getSpellBudget(currentCharacter, homebrew.spells);
        if (budget.excess.length) return `Troppi incantesimi o non ammessi: rimuovine ${budget.excess.length} (${budget.excess.join(', ')}).`;
        const invocations = getInvocationBudget(currentCharacter);
        if (invocations.over) return `Troppe Suppliche Occulte (${invocations.used}/${invocations.max}).`;
        return null;
      }
      default:
        return null;
    }
  };

  const canProceed = (): boolean => stepIssue() === null;

  const nextStep = () => {
    if (canProceed()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  // Initialize a character if none exists
  React.useEffect(() => {
    if (!currentCharacter || currentCharacter.id === '') {
      dispatch({ 
        type: 'ADD_CHARACTER', 
        payload: { 
          ...initialCharacter, 
          id: crypto.randomUUID(),
          userId: user?.uid 
        } 
      });
    }
  }, [currentCharacter, dispatch, user]);

  const handleFinish = async () => {
    if (!currentCharacter || !user) return;
    setIsSaving(true);

    const classes = { [currentCharacter.classId]: { level: 1, ...(currentCharacter.subclassId ? { subclass: currentCharacter.subclassId } : {}) } };
    const prepared: CharacterData = { ...currentCharacter, level: 1, classes, userId: user.uid };
    // PF iniziali (PHB 2024): massimo del Dado Vita + modificatore di Costituzione (+ Nano, + talento Duro)
    const hpMax = computeHpMax(prepared, getModifiers(getFinalScores(prepared)).CON);
    const finalCharacter: CharacterData = { ...prepared, hpCurrent: hpMax, hpTemp: 0, hitDiceSpent: {}, deathSaves: { successes: 0, failures: 0 } };
    delete (finalCharacter as any).hpMax;

    try {
      await characterService.saveCharacter(finalCharacter);
      onComplete();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Errore nel salvataggio. Riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRandomize = () => {
    const randomClass = pick(classesData);
    const randomSpecies = pick(speciesData) as any;
    const randomBackground = pick(backgroundsData);
    const subOptionId = randomSpecies.subOptions ? pick(randomSpecies.subOptions as any[]).id : '';

    // Serie standard ordinata secondo le caratteristiche preferite della classe
    const preferred = [...(randomClass.spellcastingAbility ? [randomClass.spellcastingAbility] : []), ...randomClass.multiclassReq, 'CON', ...shuffle([...ABILITIES])];
    const order = Array.from(new Set(preferred)) as Ability[];
    const abilityScores = order.reduce((acc, ability, i) => ({ ...acc, [ability]: STANDARD_ARRAY[i] }), {} as Record<Ability, number>);

    const boosts = order.filter(a => (randomBackground.boosts as string[]).includes(a)).slice(0, 2) as Ability[];
    const bgSkills = randomBackground.skills;
    const classSkills = shuffle(randomClass.skillOptions.filter(s => !bgSkills.includes(s))).slice(0, randomClass.skillChoices);
    const speciesSkills = randomSpecies.skillChoices
      ? shuffle((randomSpecies.skillOptions as string[]).filter(s => !bgSkills.includes(s) && !classSkills.includes(s))).slice(0, randomSpecies.skillChoices)
      : [];

    const names = ['Thaelin', 'Elora', 'Kael', 'Lyra', 'Brak', 'Sif', 'Morgaine', 'Dante', 'Zephyr', 'Vara', 'Jax', 'Lumi', 'Caelum', 'Onyx', 'Sage'];
    const classOption = randomClass.startingEquipment?.options[0];
    const bgOption = randomBackground.startingEquipment?.options[0];
    const inventoryItems = [...(classOption?.items || []), ...(bgOption?.items || [])].map(item => processStartingItem(item));
    const gold = (classOption?.gold || 0) + (bgOption?.gold || 0);
    const derived = getSpeciesDerived(randomSpecies.id, subOptionId);
    const originReq = getOriginChoiceRequirements({ classId: randomClass.id, level: 1, backgroundId: randomBackground.id });
    const languages = shuffle(STANDARD_LANGUAGES.filter(l => !originReq.fixedLanguages.includes(l))).slice(0, originReq.languageCount);
    const toolProficiencies = shuffle(originReq.toolOptions.filter(t => !originReq.fixedTools.includes(t))).slice(0, originReq.toolCount);

    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: {
        name: pick(names),
        classId: randomClass.id,
        speciesId: randomSpecies.id,
        speciesSubOption: subOptionId,
        backgroundId: randomBackground.id,
        originFeat: randomBackground.feat,
        bonusOriginFeat: randomSpecies.id === 'human' ? pick(ORIGIN_FEATS) : '',
        abilityMethod: 'standard',
        abilityScores,
        boostMode: '2/1',
        selectedBoosts: boosts,
        proficientSkills: classSkills,
        speciesSkills,
        languages,
        toolProficiencies,
        classes: { [randomClass.id]: { level: 1 } },
        features: derived.traits,
        innateSpells: derived.spells,
        resistances: derived.resistances,
        alignment: pick(['Legale Buono', 'Neutrale Buono', 'Caotico Buono', 'Legale Neutrale', 'Neutrale', 'Caotico Neutrale']),
        description: 'Un avventuriero generato casualmente in cerca di gloria.',
        inventoryItems,
        currency: { cp: 0, sp: 0, ep: 0, gp: gold, pp: 0 },
      }
    });

    setCurrentStep(6);
  };

  const renderClassSkillPicker = () => {
    const charClass = classesData.find(c => c.id === currentCharacter?.classId);
    if (!currentCharacter || !charClass) return null;
    const bgSkills = getBgSkills();
    const picks = getClassSkillPicks();
    const limitReached = picks.length >= charClass.skillChoices;
    return (
      <Section title={`Competenze di classe · ${charClass.name}`} icon={Target} actions={<Counter value={picks.length} max={charClass.skillChoices} label="scelte" />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {charClass.skillOptions.map(skill => {
            const isSelected = picks.includes(skill);
            const isFromBg = bgSkills.includes(skill);
            const isFromSpecies = (currentCharacter.speciesSkills || []).includes(skill);
            const locked = isFromBg || isFromSpecies;
            return (
              <ToggleChip
                key={skill}
                selected={isSelected || locked}
                disabled={locked || (limitReached && !isSelected)}
                onClick={() => {
                  const current = currentCharacter.proficientSkills || [];
                  dispatch({ type: 'UPDATE_CHARACTER', payload: { proficientSkills: isSelected ? current.filter(s => s !== skill) : [...current, skill] } });
                }}
              >
                <span className="truncate">{skill}</span>
                {isFromBg && <span className="text-[9px] uppercase opacity-70">· background</span>}
                {isFromSpecies && <span className="text-[9px] uppercase opacity-70">· specie</span>}
              </ToggleChip>
            );
          })}
        </div>
      </Section>
    );
  };

  if (!currentCharacter) return null;

  const currentSpecies = speciesData.find(s => s.id === currentCharacter.speciesId) as any;
  const currentClass = classesData.find(c => c.id === currentCharacter.classId);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <StepHeader eyebrow="Capitolo 1" title="Scegli la classe" description="La classe definisce il tuo ruolo nel gruppo: come combatti, quale magia usi e quali competenze ottieni." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classesData.map(cls => {
                const Icon = CLASS_ICONS[cls.id] || Sword;
                const primary = cls.multiclassReq;
                return (
                  <OptionCard
                    key={cls.id}
                    selected={currentCharacter.classId === cls.id}
                    onClick={() => cls.id !== currentCharacter.classId && dispatch({ type: 'UPDATE_CHARACTER', payload: { classId: cls.id, classes: { [cls.id]: { level: 1 } }, subclassId: '', proficientSkills: [], spells: [], invocations: [], weaponMasteries: {}, toolProficiencies: [], languages: [] } })}
                    title={<span className="flex items-center gap-2"><Icon className="w-5 h-5 text-accent shrink-0" />{cls.name}</span>}
                    subtitle={CLASS_BLURBS[cls.id]}
                    meta={<>
                      <Tag tone="accent">d{cls.hitDie}</Tag>
                      <Tag title="Caratteristica principale">{primary.map(a => abilityMap[a] || a).join(cls.multiclassAny ? ' o ' : ' + ')}</Tag>
                      <Tag title="Tiri salvezza">TS {cls.saves.map(a => abilityMap[a] || a).join(', ')}</Tag>
                      {cls.spellcastingAbility && <Tag>Incantatore</Tag>}
                    </>}
                  />
                );
              })}
            </div>
            {currentClass && renderClassSkillPicker()}
          </div>
        );
      case 1:
        return (
          <div className="space-y-8">
            <StepHeader eyebrow="Capitolo 2" title="Origine" description="Specie e background: da dove vieni e cosa facevi prima dell'avventura. Il background assegna aumenti di caratteristica, abilità e un Talento d'Origine." />

            <Section title="Specie" icon={Users} bodyClassName="p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {speciesData.map((sp: any) => (
                  <OptionCard
                    key={sp.id}
                    selected={currentCharacter.speciesId === sp.id}
                    onClick={() => sp.id !== currentCharacter.speciesId && dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesId: sp.id, speciesSubOption: '', speciesSkills: [], bonusOriginFeat: '' } })}
                    title={sp.name}
                    subtitle={`${sp.size} · ${sp.speed} m${sp.darkvision ? ` · Scurov. ${sp.darkvision} m` : ''}`}
                    className="!p-3"
                  />
                ))}
              </div>

              {currentSpecies && (
                <div className="border border-border bg-panel-bg rounded-[var(--radius-lg)] p-4">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-2 font-serif">Tratti di {currentSpecies.name}</div>
                  <div className="flex flex-wrap gap-1.5">{currentSpecies.traits.map((t: string) => <Tag key={t}>{t}</Tag>)}</div>
                </div>
              )}

              {currentSpecies?.subOptions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase font-bold tracking-widest font-serif">Lignaggio</div>
                    {!currentCharacter.speciesSubOption && <Tag tone="danger">Da scegliere</Tag>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentSpecies.subOptions.map((opt: any) => (
                      <OptionCard
                        key={opt.id}
                        selected={currentCharacter.speciesSubOption === opt.id}
                        onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesSubOption: opt.id } })}
                        title={opt.name}
                        className="!p-3"
                        meta={<>
                          {opt.spells && <Tag>Incantesimi: {opt.spells.join(', ')}</Tag>}
                          {opt.resistance && <Tag>Resistenza: {opt.resistance}</Tag>}
                          {opt.damageType && !opt.resistance && <Tag>Danno: {opt.damageType}</Tag>}
                          {opt.feature && <Tag>{opt.feature}</Tag>}
                          {opt.speed && <Tag>Velocità {opt.speed} m</Tag>}
                        </>}
                      />
                    ))}
                  </div>
                </div>
              )}

              {currentSpecies?.skillChoices && (() => {
                const picks = currentCharacter.speciesSkills || [];
                const taken = [...getBgSkills(), ...getClassSkillPicks()];
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase font-bold tracking-widest font-serif">{currentSpecies.id === 'human' ? 'Abile: una competenza a scelta' : 'Sensi Acuti: una competenza'}</div>
                      <Counter value={picks.length} max={currentSpecies.skillChoices} label="scelte" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(currentSpecies.skillOptions as string[]).map(skill => {
                        const isSelected = picks.includes(skill);
                        const already = taken.includes(skill);
                        return (
                          <ToggleChip key={skill} selected={isSelected} disabled={!isSelected && (already || picks.length >= currentSpecies.skillChoices)}
                            onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesSkills: isSelected ? picks.filter(s => s !== skill) : [...picks, skill] } })}>
                            {skill}{already && <span className="text-[9px] uppercase opacity-70">· già tua</span>}
                          </ToggleChip>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {currentCharacter.speciesId === 'human' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs uppercase font-bold tracking-widest font-serif">Versatile: Talento d’Origine</div>
                    {!currentCharacter.bonusOriginFeat && <Tag tone="danger">Da scegliere</Tag>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ORIGIN_FEATS.map(feat => (
                      <ToggleChip key={feat} selected={currentCharacter.bonusOriginFeat === feat} onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { bonusOriginFeat: feat } })}>{feat}</ToggleChip>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="Background" icon={ScrollText}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {backgroundsData.map(bg => (
                  <OptionCard
                    key={bg.id}
                    selected={currentCharacter.backgroundId === bg.id}
                    onClick={() => {
                      if (bg.id === currentCharacter.backgroundId) return;
                      // Le abilità del background sostituiscono eventuali scelte di classe/specie coincidenti
                      dispatch({
                        type: 'UPDATE_CHARACTER',
                        payload: {
                          backgroundId: bg.id,
                          selectedBoosts: [],
                          originFeat: bg.feat,
                          toolProficiencies: [],
                          proficientSkills: (currentCharacter.proficientSkills || []).filter(s => !bg.skills.includes(s)),
                          speciesSkills: (currentCharacter.speciesSkills || []).filter(s => !bg.skills.includes(s)),
                        }
                      });
                    }}
                    title={bg.name}
                    subtitle={bg.skills.join(' · ')}
                    className="!p-3"
                    meta={<>
                      <Tag tone="accent">{bg.feat}</Tag>
                      <Tag title="Caratteristiche che puoi aumentare">{bg.boosts.map(b => abilityMap[b] || b).join(' / ')}</Tag>
                    </>}
                  />
                ))}
              </div>
            </Section>

            {currentCharacter.backgroundId && getClassSkillPicks().length < (currentClass?.skillChoices || 0) && renderClassSkillPicker()}
          </div>
        );
      case 2:
        return <AbilityScoresStep />;
      case 3:
        return <DetailsStep />;
      case 4:
        return <SpellsFeatsStep />;
      case 5:
        return <StartingEquipment />;
      case 6:
        return <SummaryStep />;
      default:
        return null;
    }
  };

  const issue = stepIssue();
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Barra dei passi */}
      <div className="bg-card-bg border-b border-border sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center gap-4">
          <ol className="flex-1 flex overflow-x-auto no-scrollbar" aria-label="Passi della creazione">
            {STEPS.map((step, idx) => {
              const done = idx < currentStep;
              const active = idx === currentStep;
              const reachable = idx <= currentStep || (idx === currentStep + 1 && canProceed());
              return (
                <li key={step} className="shrink-0">
                  <button
                    onClick={() => reachable && setCurrentStep(idx)}
                    disabled={!reachable}
                    aria-current={active ? 'step' : undefined}
                    className={`relative flex items-center gap-2 px-3 py-4 text-xs font-serif font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                      ${active ? 'text-text-primary' : done ? 'text-text-muted hover:text-text-primary' : 'text-text-muted/50'}`}
                  >
                    <span className={`w-6 h-6 rounded-full grid place-items-center text-[11px] border ${active ? 'bg-accent border-accent text-white' : done ? 'bg-success/15 border-success text-success' : 'border-border'}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <span className={active ? '' : 'hidden md:inline'}>{step}</span>
                    {active && <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-accent" />}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="hidden lg:block text-right text-xs text-text-muted shrink-0">
            <div className="font-bold text-text-primary uppercase font-serif">{currentCharacter.name || 'Eroe senza nome'}</div>
            <div>Livello 1 {currentClass?.name || ''}{currentSpecies ? ` · ${currentSpecies.name}` : ''}</div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        {renderStep()}
      </main>

      {/* Navigazione */}
      <footer className="sticky bottom-0 z-30 bg-card-bg/95 backdrop-blur border-t border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center gap-3">
          <button onClick={() => { dispatch({ type: 'DISCARD_DRAFT' }); onCancel(); }} className="text-xs uppercase font-bold tracking-wider text-text-muted hover:text-danger font-serif">Annulla</button>
          <button onClick={handleRandomize} className="secondary-action flex items-center gap-2" title="Genera un personaggio casuale completo"><Dices className="w-4 h-4" /> Casuale</button>
          <div className="flex-1 min-w-[160px] text-right">
            {issue && <span className="text-xs text-danger font-bold" role="status">{issue}</span>}
          </div>
          <button onClick={prevStep} disabled={currentStep === 0} className="secondary-action flex items-center gap-1 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /> Indietro</button>
          <button
            onClick={isLast ? handleFinish : nextStep}
            disabled={isSaving || !canProceed()}
            className="primary-action px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isLast ? <Save className="w-4 h-4" /> : null}
            {isLast ? 'Crea personaggio' : 'Continua'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
