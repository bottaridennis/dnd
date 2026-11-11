
import React, { useState } from 'react';
import { useCharacter, initialCharacter, CharacterData, Ability } from '../contexts/CharacterContext';
import { useAuth } from '../contexts/AuthContext';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData, ALL_SKILLS, ORIGIN_FEATS } from '../data/rules2024';
import {
  ChevronRight, ChevronLeft, Save, Loader2, Dices, Check, Target, Users, ScrollText, Sword, Axe, Music, Sun, Leaf, Hand, ShieldPlus, Crosshair, VenetianMask, Flame, Eye, BookOpen, X,
} from 'lucide-react';
import { Section, OptionCard, Tag, ToggleChip, StepHeader, Counter } from './ui';

const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  barbarian: Axe, bard: Music, cleric: Sun, druid: Leaf, fighter: Sword, monk: Hand,
  paladin: ShieldPlus, ranger: Crosshair, rogue: VenetianMask, sorcerer: Flame, warlock: Eye, wizard: BookOpen,
};

/** Classi più semplici da giocare per chi inizia */
const BEGINNER_CLASSES = new Set(['fighter', 'barbarian', 'rogue']);

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
import AbilityScoresStep, { pointBuyCost, validateAbilityScores } from './AbilityScoresStep';
import { getOriginChoiceRequirements } from './LanguageToolPicker';
import { STANDARD_LANGUAGES } from '../data/languages';
import DetailsStep from './DetailsStep';
import SpellsFeatsStep from './SpellsFeatsStep';
import { getSpellBudget } from '../lib/spellBudget';
import { getFeatBudget, getInvocationBudget } from '../lib/featBudget';
import { INVOCATIONS } from '../data/invocations';
import { useHomebrew } from '../hooks/useHomebrew';
import StartingEquipment from './StartingEquipment';
import SummaryStep from './SummaryStep';
import { useSpeciesAutomation } from '../hooks/useSpeciesAutomation';
import { abilityMap } from '../lib/utils';
import { processStartingItem } from '../data/weaponsData';
import { computeHpMax, getFinalScores, getModifiers, STANDARD_ARRAY, ABILITIES, ABILITY_NAMES, POINT_BUY_BUDGET } from '../lib/characterRules';
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

  /**
   * Cosa serve per completare il passo corrente, in ordine. Ogni voce indica la sezione della pagina
   * (data-guide) dove si completa, così la guida può portarci l'utente.
   * optional = consiglio che non blocca.
   */
  interface Requirement { id: string; label: string; done: boolean; help: string; optional?: boolean }
  const stepRequirements = (): Requirement[] => {
    if (!currentCharacter) return [];
    const charClass = classesData.find(c => c.id === currentCharacter.classId);
    switch (currentStep) {
      case 0: {
        const picks = getClassSkillPicks().length;
        return [
          { id: 'class', label: 'Scegli una classe', done: Boolean(charClass), help: 'Tocca una delle carte qui sotto: la classe decide come combatti e che magie usi. Nel dubbio, il Guerriero è il più semplice.' },
          ...(charClass ? [{ id: 'class-skills', label: `Scegli ${charClass.skillChoices} abilità (${picks}/${charClass.skillChoices})`, done: picks === charClass.skillChoices, help: `Tocca ${charClass.skillChoices} abilità nell’elenco “Competenze di classe”: sono le cose in cui il tuo eroe è bravo.` }] : []),
        ];
      }
      case 1: {
        const species = speciesData.find(s => s.id === currentCharacter.speciesId) as any;
        const list: Requirement[] = [{ id: 'species', label: 'Scegli una specie', done: Boolean(species), help: 'Tocca una specie nel riquadro “Specie” (umano, elfo, nano…).' }];
        if (species?.subOptions) list.push({ id: 'lineage', label: 'Scegli il lignaggio', done: species.subOptions.some((o: any) => o.id === currentCharacter.speciesSubOption), help: `${species.name}: scegli una delle varianti sotto “Lignaggio”.` });
        if (species?.skillChoices) list.push({ id: 'species-skill', label: 'Scegli l’abilità della specie', done: (currentCharacter.speciesSkills || []).length === species.skillChoices, help: 'La tua specie ti regala un’abilità: tocca quella che preferisci.' });
        if (species?.id === 'human') list.push({ id: 'versatile', label: 'Scegli il talento “Versatile”', done: Boolean(currentCharacter.bonusOriginFeat), help: 'Gli umani ottengono un Talento d’Origine in più: scegline uno (Allerta e Duro sono ottimi per iniziare).' });
        list.push({ id: 'background', label: 'Scegli un background', done: Boolean(currentCharacter.backgroundId), help: 'Tocca un background nel riquadro “Background”: è il mestiere del tuo eroe prima dell’avventura.' });
        if (charClass && currentCharacter.backgroundId) {
          const picks = getClassSkillPicks().length;
          if (picks !== charClass.skillChoices) list.push({ id: 'class-skills', label: `Sostituisci un’abilità di classe (${picks}/${charClass.skillChoices})`, done: false, help: 'Il background ti dà già un’abilità che avevi scelto con la classe: scegline un’altra nel riquadro “Competenze di classe”.' });
        }
        return list;
      }
      case 2: {
        const boosts = currentCharacter.selectedBoosts || [];
        const required = currentCharacter.boostMode === '1/1/1' ? 3 : 2;
        const allowed = backgroundsData.find(b => b.id === currentCharacter.backgroundId)?.boosts || [];
        const scoreIssue = validateAbilityScores(currentCharacter.abilityMethod || 'pointbuy', currentCharacter.abilityScores);
        const method = currentCharacter.abilityMethod || 'pointbuy';
        const spent = method === 'pointbuy' ? pointBuyCost(currentCharacter.abilityScores) : 0;
        const allowedNames = allowed.map(a => ABILITY_NAMES[a]).join(', ');
        return [
          { id: 'scores', label: 'Imposta i punteggi', done: !scoreIssue, help: scoreIssue || 'Scegli un metodo e imposta i sei punteggi.' },
          ...(method === 'pointbuy' ? [{ id: 'boosts', label: `Spendi i punti (${spent}/${POINT_BUY_BUDGET})`, done: spent >= POINT_BUY_BUDGET, optional: true, help: `Usa le frecce ▲ sotto le caratteristiche per spendere tutti i ${POINT_BUY_BUDGET} punti. Alza soprattutto quella principale della tua classe. Più semplice: scegli “Serie standard”.` }] : []),
          { id: 'boosts', label: `Assegna i bonus del background (${boosts.length}/${required})`, done: boosts.length === required && boosts.every(b => allowed.includes(b)), help: required === 2
            ? `Tocca “Applica bonus” sotto la caratteristica che vuoi aumentare di +2, poi sotto quella da +1. Puoi scegliere tra: ${allowedNames}.`
            : `Tocca “Applica bonus” sotto ${allowedNames}: ognuna riceve +1.` },
        ];
      }
      case 3: {
        const req = getOriginChoiceRequirements(currentCharacter);
        const langs = (currentCharacter.languages || []).length;
        const tools = (currentCharacter.toolProficiencies || []).length;
        return [
          { id: 'identity', label: 'Dai un nome al personaggio', done: Boolean(currentCharacter.name?.trim()), help: 'Scrivi il nome del tuo eroe nel campo “Nome del personaggio”.' },
          ...(req.languageCount > 0 ? [{ id: 'languages', label: `Scegli ${req.languageCount} lingue (${langs}/${req.languageCount})`, done: langs === req.languageCount, help: `Tocca ${req.languageCount} lingue nel riquadro “Lingue”. Le più utili: Elfico, Nanico, Gigante.` }] : []),
          ...(req.toolCount > 0 ? [{ id: 'tools', label: `Scegli gli strumenti (${tools}/${req.toolCount})`, done: tools === req.toolCount, help: `Nel riquadro “Strumenti” scegli ${req.toolLabel}.` }] : []),
        ];
      }
      case 4: {
        const budget = getSpellBudget(currentCharacter, homebrew.spells);
        const feats = getFeatBudget(currentCharacter, homebrew.feats);
        const invocations = getInvocationBudget(currentCharacter, INVOCATIONS);
        const list: Requirement[] = [];
        if (budget.excess.length) list.push({ id: 'spells', label: `Togli ${budget.excess.length} incantesim${budget.excess.length === 1 ? 'o' : 'i'} di troppo`, done: false, help: `Hai scelto più incantesimi di quelli permessi: tocca quelli evidenziati in rosso per toglierli (${budget.excess.join(', ')}).` });
        if (feats.excess.length) list.push({ id: 'spells', label: 'Togli i talenti non permessi', done: false, help: `Nella scheda “Talenti” togli: ${feats.excess.join(', ')}.` });
        if (invocations.excess.length) list.push({ id: 'spells', label: 'Togli le suppliche in eccesso', done: false, help: `Nella scheda “Suppliche Occulte” togli: ${invocations.excess.join(', ')}.` });
        if (budget.cantrips.max > 0) list.push({ id: 'spells', label: `Trucchetti (${budget.cantrips.used}/${budget.cantrips.max})`, done: budget.cantrips.used >= budget.cantrips.max, optional: true, help: `Consigliato: scegli ${budget.cantrips.max} trucchetti, le magie che puoi usare senza limiti.` });
        if (budget.leveled.max > 0) list.push({ id: 'spells', label: `Incantesimi preparati (${budget.leveled.used}/${budget.leveled.max})`, done: budget.leveled.used >= budget.leveled.max, optional: true, help: `Consigliato: scegli ${budget.leveled.max} incantesimi di 1° livello da preparare.` });
        if (invocations.max > 0) list.push({ id: 'spells', label: `Suppliche Occulte (${invocations.used}/${invocations.max})`, done: invocations.used >= invocations.max, optional: true, help: 'Consigliato: nella scheda “Suppliche Occulte” scegli i poteri del tuo patto.' });
        return list;
      }
      default:
        return [];
    }
  };

  const requirements = stepRequirements();
  const firstMissing = requirements.find(r => !r.done && !r.optional);
  /** Messaggio che spiega cosa manca per proseguire (null = si può proseguire). */
  const stepIssue = (): string | null => (currentCharacter ? (firstMissing ? firstMissing.help : null) : 'Caricamento…');

  /** Porta l'utente alla sezione da completare e la evidenzia. */
  const guideTo = (target: string, behavior: ScrollBehavior = 'smooth') => {
    const el = document.querySelector<HTMLElement>(`[data-guide="${target}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior, block: 'start' });
    el.classList.remove('guide-flash');
    void el.offsetWidth; // riavvia l'animazione
    el.classList.add('guide-flash');
    window.setTimeout(() => el.classList.remove('guide-flash'), 2200);
  };
  // Dopo un tentativo di proseguire, l'avviso resta visibile e segue la prossima cosa da fare
  const [showBlocked, setShowBlocked] = useState(false);
  const blockedNotice = showBlocked && firstMissing ? firstMissing.help : null;

  const canProceed = (): boolean => stepIssue() === null;

  const nextStep = () => {
    if (canProceed()) {
      setShowBlocked(false);
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      return;
    }
    // Invece di un pulsante spento: si spiega cosa manca e si porta l'utente lì
    if (firstMissing) {
      setShowBlocked(true);
      guideTo(firstMissing.id);
    }
  };

  // Ogni passo si apre dall'inizio della pagina
  React.useEffect(() => { window.scrollTo({ top: 0 }); setShowBlocked(false); }, [currentStep]);

  // Completata una scelta, se la prossima da fare è più in basso la si porta in vista
  const lastTarget = React.useRef<{ step: number; id?: string }>({ step: -1 });
  React.useEffect(() => {
    const prev = lastTarget.current;
    lastTarget.current = { step: currentStep, id: firstMissing?.id };
    if (prev.step !== currentStep || !firstMissing || prev.id === firstMissing.id) return;
    // Mai spostare la pagina mentre si sta scrivendo
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    const el = document.querySelector<HTMLElement>(`[data-guide="${firstMissing.id}"]`);
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) window.setTimeout(() => guideTo(firstMissing.id), 150);
  });
  const prevStep = () => { setShowBlocked(false); setCurrentStep(prev => Math.max(prev - 1, 0)); };

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
      <Section guide="class-skills" title={`Competenze di classe · ${charClass.name}`} icon={Target} actions={<Counter value={picks.length} max={charClass.skillChoices} label="scelte" />}>
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
            <div data-guide="class" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 scroll-mt-40">
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
                      {BEGINNER_CLASSES.has(cls.id) && <Tag tone="accent">Facile per iniziare</Tag>}
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

            <Section guide="species" title="Specie" icon={Users} bodyClassName="p-4 space-y-4">
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
                <div data-guide="lineage" className="scroll-mt-40">
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
                  <div data-guide="species-skill" className="scroll-mt-40">
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
                <div data-guide="versatile" className="scroll-mt-40">
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

            <Section guide="background" title="Background" icon={ScrollText}>
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
                    onClick={() => (reachable ? setCurrentStep(idx) : nextStep())}
                    title={reachable ? undefined : 'Completa prima il passo corrente'}
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

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {requirements.length > 0 && (
          <nav aria-label="Cosa fare in questo passo" className={`border-l-4 px-4 py-3 ${firstMissing ? 'border-accent bg-accent/5' : 'border-success bg-success/5'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase font-black tracking-widest font-serif">{firstMissing ? 'Cosa fare in questo passo' : 'Passo completato'}</p>
              {!firstMissing && <span className="text-xs text-success font-bold">Premi “{isLast ? 'Crea personaggio' : 'Continua'}” in basso per andare avanti</span>}
            </div>
            <ol className="mt-2 flex flex-wrap gap-2">
              {requirements.map((r, i) => (
                <li key={`${r.id}-${i}`}>
                  <button onClick={() => guideTo(r.id)} className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm border rounded-[var(--radius-sm)] text-left ${r.done ? 'border-success/50 text-success' : r === firstMissing ? 'border-accent bg-accent text-bg font-bold' : r.optional ? 'border-dashed border-border text-text-muted' : 'border-border text-text-primary'}`}>
                    {r.done ? <Check className="w-4 h-4 shrink-0" /> : <span className="w-4 h-4 grid place-items-center text-[10px] font-black border border-current rounded-full shrink-0">{i + 1}</span>}
                    {r.label}{r.optional && !r.done ? <span className="text-[10px] uppercase">· consigliato</span> : null}
                  </button>
                </li>
              ))}
            </ol>
            {firstMissing && <p className="text-sm text-text-muted mt-2">{firstMissing.help}</p>}
          </nav>
        )}
        {renderStep()}
      </main>

      {/* Navigazione */}
      <footer className="sticky bottom-0 z-30 bg-card-bg/95 backdrop-blur border-t border-border">
        {blockedNotice && (
          <div role="alert" className="max-w-6xl mx-auto px-4 md:px-8 pt-3">
            <div className="flex items-start gap-2 border border-accent bg-accent/10 px-3 py-2 text-sm">
              <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5 rotate-[-90deg]" />
              <span><strong>Prima di continuare:</strong> {blockedNotice}</span>
              <button onClick={() => setShowBlocked(false)} className="ml-auto text-text-muted shrink-0" aria-label="Chiudi">×</button>
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center gap-2 sm:gap-3">
          <button onClick={() => { dispatch({ type: 'DISCARD_DRAFT' }); onCancel(); }} className="p-2 sm:p-0 text-xs uppercase font-bold tracking-wider text-text-muted hover:text-danger font-serif" aria-label="Annulla la creazione" title="Annulla la creazione"><X className="w-5 h-5 sm:hidden" /><span className="hidden sm:inline">Annulla</span></button>
          <button onClick={handleRandomize} className="secondary-action !px-2.5 sm:!px-4 flex items-center gap-2" title="Genera un personaggio casuale completo" aria-label="Personaggio casuale"><Dices className="w-4 h-4" /><span className="hidden sm:inline">Casuale</span></button>
          <div className="flex-1" />
          <button onClick={prevStep} disabled={currentStep === 0} className="secondary-action !px-2.5 sm:!px-4 flex items-center gap-1 disabled:opacity-30" aria-label="Indietro"><ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Indietro</span></button>
          <button
            onClick={isLast ? handleFinish : nextStep}
            disabled={isSaving}
            className={`primary-action px-5 sm:px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${canProceed() ? '' : 'opacity-60'}`}
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
