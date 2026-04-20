
import React, { useState } from 'react';
import { useCharacter, initialCharacter, CharacterData, Ability } from '../contexts/CharacterContext';
import { useAuth } from '../contexts/AuthContext';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData, ALL_SKILLS } from '../data/rules2024';
import { FEATURES } from '../data/features';
import { ChevronRight, ChevronLeft, Save, Loader2, Dices } from 'lucide-react';
import AbilityScoresStep from './AbilityScoresStep';
import DetailsStep from './DetailsStep';
import SpellsFeatsStep from './SpellsFeatsStep';
import SummaryStep from './SummaryStep';
import { getModifier } from '../lib/utils';
import { useSpeciesAutomation } from '../hooks/useSpeciesAutomation';

const STEPS = [
  'Classe',
  'Origine',
  'Caratteristiche',
  'Dettagli',
  'Magie e Talenti',
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

  const canProceed = (): boolean => {
    if (!currentCharacter) return false;

    switch (currentStep) {
      case 0: {
        if (!currentCharacter.classId) return false;
        const charClass = classesData.find(c => c.id === currentCharacter.classId);
        if (charClass) {
          const bgSkills = backgroundsData.find(b => b.id === currentCharacter.backgroundId)?.skills || [];
          const explicitChoices = (currentCharacter.proficientSkills || []).filter(s => !bgSkills.includes(s));
          if (explicitChoices.length !== charClass.skillChoices) return false;
        }
        return true;
      }
      case 1: {
        if (!currentCharacter.speciesId || !currentCharacter.backgroundId) return false;
        const species = speciesData.find(s => s.id === currentCharacter.speciesId);
        
        // PHB 2024: Mandatory SubOption for certain species
        if (species && (species as any).subOptions && !currentCharacter.speciesSubOption) return false;

        if (species && species.skillChoices) {
          const charClass = classesData.find(c => c.id === currentCharacter.classId);
          const target = (charClass?.skillChoices || 0) + species.skillChoices;
          const bgSkills = backgroundsData.find(b => b.id === currentCharacter.backgroundId)?.skills || [];
          const explicitChoices = (currentCharacter.proficientSkills || []).filter(s => !bgSkills.includes(s));
          if (explicitChoices.length !== target) return false;
        }
        return true;
      }
      case 2: {
        if (!currentCharacter.selectedBoosts || currentCharacter.selectedBoosts.length < 2) return false;
        return true;
      }
      case 3: {
        if (!currentCharacter.name || currentCharacter.name.trim() === '') return false;
        return true;
      }
      default:
        return true;
    }
  };

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
    
    // Calculate initial HP based on 2024 rules
    const charClass = classesData.find(c => c.id === currentCharacter.classId);
    const conMod = getModifier(currentCharacter.abilityScores.CON + (currentCharacter.selectedBoosts.includes('CON') ? (currentCharacter.selectedBoosts.indexOf('CON') === 0 ? 2 : 1) : 0));
    const initialHP = (charClass?.hitDie || 8) + conMod;

    const finalCharacter: CharacterData = {
      ...currentCharacter,
      userId: user.uid,
      hpCurrent: initialHP,
      hpMax: initialHP, // We'll add this to the schema if needed, or recalculate
    } as any;

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
    const randomClass = classesData[Math.floor(Math.random() * classesData.length)];
    const randomSpecies = speciesData[Math.floor(Math.random() * speciesData.length)];
    const randomBackground = backgroundsData[Math.floor(Math.random() * backgroundsData.length)];
    
    // Sub-options
    let subOptionId = '';
    if ((randomSpecies as any).subOptions) {
      const sub = (randomSpecies as any).subOptions[Math.floor(Math.random() * (randomSpecies as any).subOptions.length)];
      subOptionId = sub.id;
    }

    // Ability Scores (Standard Array)
    const baseScores = [15, 14, 13, 12, 10, 8].sort(() => Math.random() - 0.5);
    const abilities: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const abilityScores = abilities.reduce((acc, abl, i) => {
      acc[abl] = baseScores[i];
      return acc;
    }, {} as Record<Ability, number>);

    // Boosts (Randomly pick 2 from background options)
    const boosts = [...randomBackground.boosts].sort(() => Math.random() - 0.5).slice(0, 2);

    // Skills
    const bgSkills = randomBackground.skills;
    const availableClassSkills = randomClass.skillOptions.filter(s => !bgSkills.includes(s));
    const randomClassSkills = [...availableClassSkills].sort(() => Math.random() - 0.5).slice(0, randomClass.skillChoices);
    
    let allSkills = [...bgSkills, ...randomClassSkills];
    
    // Species skills
    if (randomSpecies.skillChoices) {
      const remainingSkills = ALL_SKILLS.filter(s => !allSkills.includes(s));
      const speciesSkills = [...remainingSkills].sort(() => Math.random() - 0.5).slice(0, randomSpecies.skillChoices);
      allSkills = [...allSkills, ...speciesSkills];
    }

    // Name
    const names = ['Thaelin', 'Elora', 'Kael', 'Lyra', 'Brak', 'Sif', 'Morgaine', 'Dante', 'Zephyr', 'Vara', 'Jax', 'Lumi', 'Caelum', 'Onyx', 'Sage'];
    const randomName = names[Math.floor(Math.random() * names.length)];

    dispatch({
      type: 'UPDATE_CHARACTER',
      payload: {
        name: randomName,
        classId: randomClass.id,
        speciesId: randomSpecies.id,
        speciesSubOption: subOptionId,
        backgroundId: randomBackground.id,
        abilityScores,
        selectedBoosts: boosts as Ability[],
        proficientSkills: allSkills,
        alignment: ['Legale Buono', 'Neutrale Buono', 'Caotico Buono', 'Legale Neutrale', 'Neutrale', 'Caotico Neutrale'][Math.floor(Math.random() * 6)],
        description: 'Un avventuriero generato casualmente in cerca di gloria.'
      }
    });

    // We can jump to summary if we want, or just stay here
    setCurrentStep(5); 
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
                  onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { classId: cls.id, proficientSkills: [] } })}
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
                  <p className="text-[10px] text-text-muted leading-relaxed uppercase tracking-[0.15em] font-black">Tiri Salvezza: <span className="text-text-primary">{cls.saves.join(', ')}</span></p>
                </button>
              ))}
            </div>

            {currentCharacter.classId && (
               <div className="p-8 bg-panel-bg border border-border rounded-lg animate-in fade-in duration-300">
                 <h4 className="text-lg font-black text-text-primary mb-2">Competenze di Classe</h4>
                 <p className="text-sm text-text-muted mb-6">
                   Scegli <strong className="text-accent">{classesData.find(c => c.id === currentCharacter.classId)?.skillChoices}</strong> abilità tra le seguenti opzioni.
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                   {classesData.find(c => c.id === currentCharacter.classId)?.skillOptions.map(skill => {
                     const isSelected = currentCharacter.proficientSkills?.includes(skill);
                     const limitReached = (currentCharacter.proficientSkills?.length || 0) >= (classesData.find(c => c.id === currentCharacter.classId)?.skillChoices || 0);
                     
                     // We lock it if it's not selected and we reached the limit, or if it comes from the background (which is static)
                     const bgSkills = backgroundsData.find(b => b.id === currentCharacter.backgroundId)?.skills || [];
                     const isFromBg = bgSkills.includes(skill);

                     return (
                       <label 
                         key={skill} 
                         className={`flex items-center justify-between p-2.5 rounded border transition-all cursor-pointer ${
                           isSelected || isFromBg ? 'bg-accent/10 border-accent/50 text-accent' : 
                           limitReached && !isFromBg ? 'opacity-50 cursor-not-allowed bg-card-bg border-border text-text-muted' : 
                           'bg-card-bg border-border text-text-primary hover:border-text-muted'
                         }`}
                       >
                         <div className="flex items-center gap-2.5 truncate">
                           <input 
                             type="checkbox" 
                             className="accent-accent shrink-0"
                             checked={isSelected || isFromBg}
                             disabled={(limitReached && !isSelected) || isFromBg}
                             onChange={(e) => {
                               const currentSkills = currentCharacter.proficientSkills || [];
                               if (e.target.checked) {
                                 dispatch({ type: 'UPDATE_CHARACTER', payload: { proficientSkills: [...currentSkills, skill] } });
                               } else {
                                 dispatch({ type: 'UPDATE_CHARACTER', payload: { proficientSkills: currentSkills.filter((s: string) => s !== skill) } });
                               }
                             }}
                           />
                           <span className="text-[11px] font-bold uppercase tracking-wider truncate">{skill}</span>
                         </div>
                         {isFromBg && <span className="text-[8px] bg-border/50 rounded px-1.5 py-0.5 text-text-muted shrink-0 whitespace-nowrap ml-2">DAL BG</span>}
                       </label>
                     );
                   })}
                 </div>
               </div>
            )}
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
                    onClick={() => dispatch({ type: 'UPDATE_CHARACTER', payload: { speciesId: sp.id } })}
                    className={`p-6 rounded border text-center transition-all duration-300 ${
                      currentCharacter.speciesId === sp.id 
                        ? 'border-accent bg-accent/5 shadow-sm' 
                        : 'border-border bg-card-bg hover:border-text-muted'
                    }`}
                  >
                    <span className={`text-[11px] font-black tracking-widest uppercase ${currentCharacter.speciesId === sp.id ? 'text-accent' : 'text-text-primary'}`}>
                      {sp.name}
                    </span>
                    <div className="text-[9px] text-text-muted font-mono mt-1 font-bold tracking-tighter">{sp.speed}m Velocità</div>
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
                          <h4 className="text-lg font-serif font-black text-text-primary uppercase tracking-tight">Scegli il tuo Lignaggio</h4>
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
              
              {/* Species Skill Selection if needed (Like Human or Elf) */}
              {(() => {
                 const currentSp = speciesData.find(s => s.id === currentCharacter.speciesId);
                 if (currentSp && currentSp.skillChoices) {
                   return (
                     <div className="mt-8 p-6 bg-panel-bg border border-border rounded-lg animate-in fade-in">
                       <h4 className="text-sm font-black text-text-primary mb-2">Tratto della Specie: Abilità</h4>
                       <p className="text-xs text-text-muted mb-4 flex items-center gap-2">
                         La tua specie ti garantisce <strong>{currentSp.skillChoices}</strong> competenza aggiuntiva.
                       </p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                         {currentSp.skillOptions.map(skill => {
                           const isSelected = currentCharacter.proficientSkills?.includes(skill);
                           // To avoid overlapping counting, we count how many "Species" skills are selected
                           const bgSkills = backgroundsData.find(b => b.id === currentCharacter.backgroundId)?.skills || [];
                           
                           // Calculate how many selections we still have from the general pool counting class
                           const charClass = classesData.find(c => c.id === currentCharacter.classId);
                           const limitTarget = (charClass?.skillChoices || 0) + (currentSp.skillChoices || 0);
                           
                           // We just look at all explicit choices currently chosen
                           const explicitChoices = (currentCharacter.proficientSkills || []).filter(s => !bgSkills.includes(s));
                           const limitReached = explicitChoices.length >= limitTarget;
                           const isFromBg = bgSkills.includes(skill);
                           
                           return (
                             <label 
                               key={skill} 
                               className={`flex items-center justify-between p-2.5 rounded transition-all cursor-pointer ${
                                 isSelected || isFromBg ? 'bg-accent/10 border border-accent/30 text-accent' : 
                                 limitReached && !isFromBg ? 'opacity-50 cursor-not-allowed bg-card-bg text-text-muted' : 
                                 'bg-card-bg border border-border text-text-primary hover:border-text-muted'
                               }`}
                             >
                                <div className="flex items-center gap-2.5 truncate">
                                 <input 
                                   type="checkbox" 
                                   className="accent-accent shrink-0 w-3 h-3"
                                   checked={isSelected || isFromBg}
                                   disabled={(limitReached && !isSelected) || isFromBg}
                                   onChange={(e) => {
                                     const currentSkills = currentCharacter.proficientSkills || [];
                                     if (e.target.checked) {
                                       dispatch({ type: 'UPDATE_CHARACTER', payload: { proficientSkills: [...currentSkills, skill] } });
                                     } else {
                                       dispatch({ type: 'UPDATE_CHARACTER', payload: { proficientSkills: currentSkills.filter((s: string) => s !== skill) } });
                                     }
                                   }}
                                 />
                                 <span className="text-[10px] font-bold uppercase tracking-wider truncate">{skill}</span>
                               </div>
                               {isFromBg && <span className="text-[8px] bg-border/50 rounded px-1.5 py-0.5 text-text-muted shrink-0 whitespace-nowrap ml-2">DAL BG</span>}
                             </label>
                           );
                         })}
                       </div>
                     </div>
                   );
                 }
                 return null;
              })()}
            </section>

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
                        const featName = bg.feat;
                        const baseFeatName = featName.split(' (')[0];
                        const featExists = FEATURES.some(f => f.name === featName || f.name === baseFeatName);
                        
                        if (!featExists) {
                            alert(`Attenzione: Il talento di background "${featName}" non è stato trovato nel database. È stato assegnato, ma potresti doverne inserire i dettagli manualmente in seguito.`);
                        }
                        
                        dispatch({ 
                            type: 'UPDATE_CHARACTER', 
                            payload: { 
                                backgroundId: bg.id, 
                                selectedBoosts: [],
                                originFeat: featName
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
        return <SummaryStep />;
      default:
        return null;
    }
  };


  return (
    <div className="flex flex-col absolute inset-0 overflow-hidden bg-bg font-sans">
      {/* Header */}
      <header className="hidden md:flex h-[60px] bg-panel-bg border-b border-border items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-serif text-xl font-bold text-accent tracking-tighter">FORGE OF HEROES <span className="text-[10px] opacity-60 font-sans tracking-normal ml-1">PHB 2024</span></div>
        </div>
        
        <div className="flex gap-2">
          {STEPS.map((_, idx) => (
            <div 
              key={idx}
              className={`w-8 h-1 rounded-sm transition-all duration-300 ${
                idx === currentStep ? 'bg-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]' : idx < currentStep ? 'bg-success' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="text-[11px] font-mono text-text-muted flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
           {currentCharacter.name || 'Untitled Hero'} | Lev 1 {classesData.find(c => c.id === currentCharacter.classId)?.name || 'Adventurer'}
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
               Step {currentStep + 1}/{STEPS.length}
             </div>
             <div className="text-[10px] font-mono text-accent truncate max-w-[100px]">
               {currentCharacter.name || 'Untitled'}
             </div>
          </div>
        </div>

        {/* Sidebar Desktop */}
        <aside className="hidden md:flex w-[220px] bg-panel-bg border-r border-border py-8 flex-col shrink-0">
          <nav className="flex flex-col gap-1">
            {STEPS.map((step, idx) => (
              <button
                key={step}
                onClick={() => {
                   if (idx < currentStep) setCurrentStep(idx);
                   else if (idx === currentStep + 1 && canProceed()) setCurrentStep(idx);
                }}
                disabled={idx > currentStep + 1 || (idx === currentStep + 1 && !canProceed())}
                className={`flex items-center gap-3 px-6 py-3 text-[13px] font-medium transition-all group ${
                  idx === currentStep 
                    ? 'bg-accent/10 border-r-4 border-accent text-accent' 
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
                <h2 className="hidden md:block text-4xl font-serif font-bold text-text-primary mb-2">
                  {STEPS[currentStep]}
                </h2>
                <p className="text-xs md:text-sm text-text-muted">
                  {currentStep === 0 && "Inizia il tuo viaggio scegliendo una delle iconiche classi di D&D."}
                  {currentStep === 1 && "Definisci le tue radici: la tua specie e il tuo passato plasmano il tuo futuro."}
                  {currentStep === 2 && "Le tue abilità naturali e i bonus del background definiscono il tuo potenziale."}
                  {currentStep === 3 && "Dettagli narrativi per rendere unico il tuo eroe nel mondo."}
                  {currentStep === 4 && "Scegli il tuo arsenale magico e i talenti eroici."}
                  {currentStep === 5 && "Controlla la tua scheda prima di iniziare l'avventura."}
                </p>
              </div>

              <div className="min-h-[300px] md:min-h-[400px] pb-12">
                {renderStep()}
              </div>
            </div>
          </main>

          {/* Pinned Navigation Buttons */}
          <div className="shrink-0 p-4 md:px-12 md:py-6 bg-panel-bg border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex w-full md:w-auto gap-4 order-2 md:order-1">
              <button
                onClick={onCancel}
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
