
import React, { useState } from 'react';
import { useCharacter, initialCharacter, CharacterData, Ability } from '../contexts/CharacterContext';
import { useAuth } from '../contexts/AuthContext';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData, ALL_SKILLS, ORIGIN_FEATS } from '../data/rules2024';
import { ChevronRight, ChevronLeft, Save, Loader2, Dices } from 'lucide-react';
import AbilityScoresStep, { validateAbilityScores } from './AbilityScoresStep';
import { getOriginChoiceRequirements } from './LanguageToolPicker';
import { STANDARD_LANGUAGES } from '../data/languages';
import DetailsStep from './DetailsStep';
import SpellsFeatsStep from './SpellsFeatsStep';
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
      <div className="p-8 bg-panel-bg border border-border rounded-lg animate-in fade-in duration-300">
        <h4 className="text-lg font-black text-text-primary mb-2">Competenze di Classe</h4>
        <p className="text-sm text-text-muted mb-6">
          Scegli <strong className="text-accent">{charClass.skillChoices}</strong> abilità tra le seguenti opzioni ({picks.length}/{charClass.skillChoices}).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {charClass.skillOptions.map(skill => {
            const isSelected = picks.includes(skill);
            const isFromBg = bgSkills.includes(skill);
            const isFromSpecies = (currentCharacter.speciesSkills || []).includes(skill);
            const locked = isFromBg || isFromSpecies;
            return (
              <label
                key={skill}
                className={`flex items-center justify-between p-2.5 rounded border transition-all cursor-pointer ${
                  isSelected || locked ? 'bg-accent/10 border-accent/50 text-accent' :
                  limitReached ? 'opacity-50 cursor-not-allowed bg-card-bg border-border text-text-muted' :
                  'bg-card-bg border-border text-text-primary hover:border-text-muted'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <input
                    type="checkbox"
                    className="accent-accent shrink-0"
                    checked={isSelected || locked}
                    disabled={(limitReached && !isSelected) || locked}
                    onChange={(e) => {
                      const current = currentCharacter.proficientSkills || [];
                      dispatch({ type: 'UPDATE_CHARACTER', payload: { proficientSkills: e.target.checked ? [...current, skill] : current.filter(s => s !== skill) } });
                    }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate">{skill}</span>
                </div>
                {isFromBg && <span className="text-[8px] bg-border/50 rounded px-1.5 py-0.5 text-text-muted shrink-0 whitespace-nowrap ml-2">DAL BG</span>}
                {isFromSpecies && <span className="text-[8px] bg-border/50 rounded px-1.5 py-0.5 text-text-muted shrink-0 whitespace-nowrap ml-2">SPECIE</span>}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  if (!currentCharacter) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classesData.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => cls.id !== currentCharacter.classId && dispatch({ type: 'UPDATE_CHARACTER', payload: { classId: cls.id, classes: { [cls.id]: { level: 1 } }, subclassId: '', proficientSkills: [], spells: [], invocations: [], weaponMasteries: {}, toolProficiencies: [], languages: [] } })}
                  className={`group p-8 rounded border text-left transition-all duration-300 ${
                    currentCharacter.classId === cls.id 
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/20' 
                      : 'border-border bg-card-bg hover:border-text-muted hover:bg-panel-bg'
                  }`}
                >
                  <div className={`text-2xl font-serif font-black mb-1 transition-colors ${currentCharacter.classId === cls.id ? 'text-accent' : 'text-text-primary'}`}>
                    {cls.name}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-mono font-black px-2 py-0.5 bg-bg rounded-sm text-text-muted border border-border tracking-widest uppercase">Dado Vita d{cls.hitDie}</span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed uppercase tracking-[0.15em] font-black">Tiri Salvezza: <span className="text-text-primary">{cls.saves.map(a => abilityMap[a] || a).join(', ')}</span></p>
                </button>
              ))}
            </div>

            {currentCharacter.classId && renderClassSkillPicker()}
          </div>
        );
      case 1:
        return (
          <div className="space-y-16 animate-in fade-in duration-500">
            <section>
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-px flex-1 bg-border" />
                 <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.3em]">Specie</h3>
                 <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {speciesData.map(sp => (
                  <button
                    key={sp.id}
                    onClick={() => sp.id !== currentCharacter.speciesId && dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesId: sp.id, speciesSubOption: '', speciesSkills: [], bonusOriginFeat: '' } })}
                    className={`p-6 rounded border text-center transition-all duration-300 ${
                      currentCharacter.speciesId === sp.id 
                        ? 'border-accent bg-accent/5 shadow-sm' 
                        : 'border-border bg-card-bg hover:border-text-muted'
                    }`}
                  >
                    <span className={`text-[11px] font-black tracking-widest uppercase ${currentCharacter.speciesId === sp.id ? 'text-accent' : 'text-text-primary'}`}>
                      {sp.name}
                    </span>
                    <div className="text-[9px] text-text-muted font-mono mt-1 font-bold tracking-normal">{sp.speed}m Velocità</div>
                  </button>
                ))}
              </div>

              {/* Species Sub-Option Selection (PHB 2024 Lineages) */}
              {(() => {
                const currentSp = speciesData.find(s => s.id === currentCharacter.speciesId) as any;
                if (currentSp && currentSp.subOptions) {
                  return (
                    <div className="mt-8 p-8 bg-card-bg border border-accent/20 rounded-xl animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-accent/10 rounded-lg">
                          <ChevronRight className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="text-lg font-serif font-black text-text-primary uppercase tracking-normal">Scegli il tuo Lignaggio</h4>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Opzioni specifiche per la specie {currentSp.name}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentSp.subOptions.map((opt: any) => (
                          <button
                            key={opt.id}
                            onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesSubOption: opt.id } })}
                            className={`p-5 rounded-lg border text-left transition-all duration-300 relative group overflow-hidden ${
                              currentCharacter.speciesSubOption === opt.id 
                                ? 'border-accent bg-accent/5 ring-1 ring-accent/20' 
                                : 'border-border bg-panel-bg hover:border-text-muted hover:bg-bg'
                            }`}
                          >
                            {currentCharacter.speciesSubOption === opt.id && (
                              <div className="absolute top-0 right-0 p-1.5 bg-accent text-bg rounded-bl-lg">
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            )}
                            <div className={`text-sm font-black mb-1.5 transition-colors ${currentCharacter.speciesSubOption === opt.id ? 'text-accent' : 'text-text-primary'}`}>
                              {opt.name}
                            </div>
                            <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider line-clamp-2">
                              {opt.spells && `Trucchetti: ${opt.spells.join(', ')}`}
                              {opt.resistance && `Resistenza: ${opt.resistance}`}
                              {opt.damageType && `Elemento: ${opt.damageType}`}
                              {opt.feature && `Privilegio: ${opt.feature}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Species Skill Selection (Umano: Abile; Elfo: Sensi Acuti) */}
              {(() => {
                const currentSp = speciesData.find(s => s.id === currentCharacter.speciesId) as any;
                if (!currentSp?.skillChoices) return null;
                const picks = currentCharacter.speciesSkills || [];
                const taken = [...getBgSkills(), ...getClassSkillPicks()];
                return (
                  <div className="mt-8 p-6 bg-panel-bg border border-border rounded-lg animate-in fade-in">
                    <h4 className="text-sm font-black text-text-primary mb-2">Tratto della Specie: Abilità</h4>
                    <p className="text-xs text-text-muted mb-4">La tua specie ti concede competenza in <strong>{currentSp.skillChoices}</strong> abilità ({picks.length}/{currentSp.skillChoices}).</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {(currentSp.skillOptions as string[]).map(skill => {
                        const isSelected = picks.includes(skill);
                        const alreadyProficient = taken.includes(skill);
                        const limitReached = picks.length >= currentSp.skillChoices;
                        return (
                          <label key={skill} className={`flex items-center justify-between p-2.5 rounded transition-all cursor-pointer ${
                            isSelected ? 'bg-accent/10 border border-accent/30 text-accent' :
                            alreadyProficient || limitReached ? 'opacity-50 cursor-not-allowed bg-card-bg text-text-muted border border-border' :
                            'bg-card-bg border border-border text-text-primary hover:border-text-muted'
                          }`}>
                            <div className="flex items-center gap-2.5 truncate">
                              <input
                                type="checkbox"
                                className="accent-accent shrink-0 w-3 h-3"
                                checked={isSelected}
                                disabled={!isSelected && (alreadyProficient || limitReached)}
                                onChange={(e) => dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesSkills: e.target.checked ? [...picks, skill] : picks.filter(s => s !== skill) } })}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-wider truncate">{skill}</span>
                            </div>
                            {alreadyProficient && <span className="text-[8px] bg-border/50 rounded px-1.5 py-0.5 text-text-muted shrink-0 ml-2">GIÀ COMPETENTE</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Umano: tratto Versatile (un Talento d'Origine a scelta) */}
              {currentCharacter.speciesId === 'human' && (
                <div className="mt-6 p-6 bg-panel-bg border border-border rounded-lg animate-in fade-in">
                  <h4 className="text-sm font-black text-text-primary mb-2">Versatile: Talento d’Origine</h4>
                  <p className="text-xs text-text-muted mb-4">Gli umani ottengono un Talento d’Origine a scelta (consigliato: Abile).</p>
                  <div className="flex flex-wrap gap-2">
                    {ORIGIN_FEATS.map(feat => (
                      <button key={feat} onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { bonusOriginFeat: feat } })} className={`px-3 py-2 rounded border text-[11px] font-bold ${currentCharacter.bonusOriginFeat === feat ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card-bg text-text-primary hover:border-text-muted'}`}>
                        {feat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {currentCharacter.backgroundId && getClassSkillPicks().length < (classesData.find(c => c.id === currentCharacter.classId)?.skillChoices || 0) && renderClassSkillPicker()}

            <section>
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-px flex-1 bg-border" />
                 <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.3em]">Background</h3>
                 <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {backgroundsData.map(bg => (
                  <button
                    key={bg.id}
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
                    className={`p-8 rounded border text-center transition-all duration-300 flex flex-col items-center justify-center ${
                      currentCharacter.backgroundId === bg.id 
                        ? 'border-accent bg-accent/5 ring-1 ring-accent/10' 
                        : 'border-border bg-card-bg hover:border-text-muted'
                    }`}
                  >
                    <span className={`text-lg font-serif font-bold ${currentCharacter.backgroundId === bg.id ? 'text-accent' : 'text-text-primary'}`}>
                      {bg.name}
                    </span>
                    <div className="w-8 h-0.5 bg-border my-4" />
                    <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-tight">Talento:<br/><span className="text-text-primary">{bg.feat}</span></p>
                    <p className="text-[9px] text-text-muted mt-2 leading-tight">{bg.skills.join(' · ')}</p>
                    <p className="text-[9px] text-accent/80 mt-1 font-mono">{bg.boosts.map(b => abilityMap[b] || b).join(' / ')}</p>
                  </button>
                ))}
              </div>
            </section>
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


  return (
    <div className="flex flex-col absolute inset-0 overflow-hidden bg-bg font-sans">
      {/* Header */}
      <header className="hidden md:flex h-[68px] bg-card-bg border-b border-border items-center px-8 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div><div className="brand-title text-2xl text-text-primary">Forgia dell’eroe</div><div className="eyebrow !text-[7px]">Sette capitoli · PHB 2024</div></div>
        </div>
        
        <div className="flex gap-2">
          {STEPS.map((_, idx) => (
            <div 
              key={idx}
              className={`w-7 h-[3px] transition-all duration-300 ${
                idx === currentStep ? 'bg-accent' : idx < currentStep ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="text-[11px] font-mono text-text-muted flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
           {currentCharacter.name || 'Eroe senza nome'} · Livello 1 {classesData.find(c => c.id === currentCharacter.classId)?.name || 'Avventuriero'}
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Mobile Step Indicator */}
        <div className="md:hidden flex items-center justify-between p-4 bg-panel-bg border-b border-border shadow-sm shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-7 h-7 rounded-full border border-accent flex items-center justify-center text-accent text-[11px] font-black">{currentStep + 1}</div>
             <div className="text-sm font-bold text-text-primary uppercase tracking-wider">{STEPS[currentStep]}</div>
          </div>
          <div className="flex flex-col items-end">
             <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
               Capitolo {currentStep + 1}/{STEPS.length}
             </div>
             <div className="text-[10px] font-mono text-accent truncate max-w-[100px]">
               {currentCharacter.name || 'Senza nome'}
             </div>
          </div>
        </div>

        {/* Sidebar Desktop */}
        <aside className="hidden md:flex w-[220px] bg-panel-bg border-r border-border py-8 flex-col shrink-0">
          <div className="px-6 mb-7"><p className="eyebrow !text-[8px]">Indice</p><p className="font-serif text-3xl mt-1">Creazione</p></div><nav className="flex flex-col gap-1">
            {STEPS.map((step, idx) => (
              <button
                key={step}
                onClick={() => {
                   if (idx <= currentStep) setCurrentStep(idx);
                   else if (idx === currentStep + 1 && canProceed()) setCurrentStep(idx);
                }}
                disabled={idx > currentStep + 1 || (idx === currentStep + 1 && !canProceed())}
                className={`flex items-center gap-3 px-6 py-3 text-[13px] font-medium transition-all group ${
                  idx === currentStep 
                    ? 'bg-card-bg border-r-4 border-accent text-accent'
                    : idx < currentStep
                      ? 'text-text-muted hover:text-text-primary hover:bg-white/5 cursor-pointer'
                      : 'text-text-muted/30 cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-colors ${
                  idx === currentStep ? 'border-accent' : 'border-text-muted group-hover:border-text-primary'
                }`}>
                  {idx + 1}
                </span>
                {step}
              </button>
            ))}
          </nav>
        </aside>

        {/* Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg">
          <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 md:mb-12">
                <p className="hidden md:block eyebrow mb-3">Capitolo {currentStep + 1} di {STEPS.length}</p><h2 className="hidden md:block text-6xl font-serif font-normal text-text-primary mb-3 tracking-[-.04em]">
                  {STEPS[currentStep]}
                </h2>
                <p className="text-xs md:text-sm text-text-muted">
                  {currentStep === 0 && "Inizia il tuo viaggio scegliendo una delle iconiche classi di D&D."}
                  {currentStep === 1 && "Definisci le tue radici: la tua specie e il tuo passato plasmano il tuo futuro."}
                  {currentStep === 2 && "Le tue abilità naturali e i bonus del background definiscono il tuo potenziale."}
                  {currentStep === 3 && "Dettagli narrativi per rendere unico il tuo eroe nel mondo."}
                  {currentStep === 4 && "Scegli il tuo arsenale magico e i talenti eroici."}
                  {currentStep === 5 && "Scegli l'equipaggiamento iniziale di classe e background."}
                {currentStep === 6 && "Controlla la tua scheda prima di iniziare l'avventura."}
                </p>
              </div>

              <div className="min-h-[300px] md:min-h-[400px] pb-12">
                {renderStep()}
              </div>
            </div>
          </main>

          {/* Pinned Navigation Buttons */}
          <div className="shrink-0 p-4 md:px-12 md:py-5 bg-card-bg border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 z-10">
            <div className="flex w-full md:w-auto gap-4 order-2 md:order-1">
              <button
                onClick={() => { dispatch({ type: 'DISCARD_DRAFT' }); onCancel(); }}
                className="flex-1 md:flex-none px-6 py-3 rounded border border-transparent text-sm font-semibold text-text-muted transition-all hover:text-amber-500"
              >
                Annulla
              </button>
              <button
                onClick={handleRandomize}
                className="flex-1 md:flex-none px-4 py-3 rounded bg-bg border border-accent/20 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/5 hover:border-accent transition-all flex items-center justify-center gap-2"
                title="Genera un personaggio casuale"
              >
                <Dices className="w-4 h-4" /> Casuale
              </button>
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1 md:flex-none btn-secondary px-6 py-3 rounded border border-border text-sm font-semibold text-text-muted transition-all hover:bg-white/5 hover:text-text-primary disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Indietro
              </button>
            </div>
            
            {stepIssue() && <p className="order-0 md:order-1 text-[11px] text-danger font-bold md:ml-auto md:mr-4 text-center">{stepIssue()}</p>}
            <button
              onClick={currentStep === STEPS.length - 1 ? handleFinish : nextStep}
              disabled={isSaving || !canProceed()}
              className={`w-full md:w-auto order-1 md:order-2 px-8 py-3 rounded font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !canProceed() 
                  ? 'bg-card-bg text-text-muted/50 cursor-not-allowed border border-border/50 shadow-inner' 
                  : 'bg-accent text-bg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95'
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {currentStep === STEPS.length - 1 ? 'Concludi e Salva' : 'Continua'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
