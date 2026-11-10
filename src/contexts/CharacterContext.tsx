import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { characterService } from '../services/characterService';
import { ActiveSummon } from '../types/summons';

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface InventoryItem {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  isAttuned: boolean;
  isMagical: boolean;
  isEquipped: boolean;
  containerId?: string | null;
  // Weapon specific
  damage?: string;
  damageType?: string;
  properties?: string[];
  mastery?: string;
  /** Bonus magico (es. +1) applicato a CA (armature/scudi) o a colpire e danni (armi) */
  magicBonus?: number;
}

export interface ContainerData {
  id: string;
  name: string;
  type: 'Backpack' | 'Pouch' | 'Sack' | 'Other';
  maxWeight?: number;
}

export interface CharacterData {
  id: string;
  userId?: string;
  name: string;
  level: number;
  classId: string;
  subclassId?: string;
  speciesId: string;
  speciesSubOption?: string;
  backgroundId: string;
  abilityScores: Record<Ability, number>;
  selectedBoosts: Ability[];
  originFeat: string;
  skills: string[]; // These are for old format, we keep it for backward compat if needed
  proficientSkills: string[]; // Explicit skill selections (classe + specie)
  /** Abilità scelte tramite la specie (Umano: Abile; Elfo: Sensi Acuti) */
  speciesSkills?: string[];
  /** Abilità con Maestria (bonus di competenza raddoppiato) */
  expertiseSkills?: string[];
  /** Modalità di distribuzione dei bonus del background */
  boostMode?: '2/1' | '1/1/1';
  /** Metodo di generazione dei punteggi usato nella creazione */
  abilityMethod?: 'standard' | 'pointbuy' | 'manual';
  /** Incrementi successivi (Aumento dei Punteggi di Caratteristica, talenti) */
  abilityBonuses?: Partial<Record<Ability, number>>;
  /** Talento d'Origine aggiuntivo (tratto Versatile dell'Umano) */
  bonusOriginFeat?: string;
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  features: string[];
  spells: string[];
  feats: string[];
  invocations: string[];
  equipment: string[];
  weaponMasteries?: Record<string, string>;
  alignment: string;
  appearance: string;
  portraitUrl?: string;
  description: string;
  trinket: string;
  hpCurrent: number;
  hpTemp: number;
  hpMaxOverride?: number;
  /** Dadi Vita spesi, indicizzati per taglia del dado (es. { 8: 2 }) */
  hitDiceSpent?: Record<string, number>;
  deathSaves?: { successes: number; failures: number };
  acOverride?: number;
  speedOverride?: number;
  darkvisionOverride?: number;
  proficiencyOverride?: number;
  currency: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  inventoryItems?: InventoryItem[];
  innateSpells?: string[];
  conditions?: string[];
  exhaustion?: number;
  containers?: ContainerData[];
  // D&D 2024 Resource Tracking
  classes?: Record<string, { level: number, subclass?: string }>;
  resources?: {
    spentSpellSlots: Record<number, number>;
    spentPactSlots: number;
    spentSorceryPoints: number;
    spentChannelDivinity: number;
  };
  companion?: {
    id: string;
    currentHp: number;
    isActive: boolean;
  };
  activeSummons?: ActiveSummon[];
  createdAt?: any;
  updatedAt?: any;
}

interface UserState {
  characters: CharacterData[];
  currentCharacterId: string | null;
  /** Personaggio in creazione non ancora salvato su Firestore */
  draftId: string | null;
  loading: boolean;
}

type CharacterAction =
  | { type: 'SET_CHARACTERS'; payload: CharacterData[] }
  | { type: 'ADD_CHARACTER'; payload: CharacterData }
  | { type: 'UPDATE_CHARACTER'; payload: Partial<CharacterData> }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string }
  | { type: 'RESET_WIZARD' }
  | { type: 'DISCARD_DRAFT' };

const initialCharacter: CharacterData = {
  id: '',
  name: '',
  level: 1,
  classId: '',
  subclassId: '',
  speciesId: '',
  speciesSubOption: '',
  backgroundId: '',
  abilityScores: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
  selectedBoosts: [],
  boostMode: '2/1',
  abilityMethod: 'pointbuy',
  abilityBonuses: {},
  originFeat: '',
  bonusOriginFeat: '',
  skills: [],
  proficientSkills: [],
  speciesSkills: [],
  expertiseSkills: [],
  resistances: [],
  immunities: [],
  vulnerabilities: [],
  features: [],
  spells: [],
  feats: [],
  invocations: [],
  equipment: [],
  weaponMasteries: {},
  alignment: '',
  appearance: '',
  portraitUrl: '',
  description: '',
  trinket: '',
  hpCurrent: 0,
  hpTemp: 0,
  hitDiceSpent: {},
  deathSaves: { successes: 0, failures: 0 },
  acOverride: undefined,
  speedOverride: undefined,
  proficiencyOverride: undefined,
  currency: {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0,
  },
  inventoryItems: [],
  innateSpells: [],
  conditions: [],
  exhaustion: 0,
  containers: [
    { id: 'backpack', name: 'Zaino', type: 'Backpack', maxWeight: 15 },
  ],
  classes: {},
  resources: {
    spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    spentPactSlots: 0,
    spentSorceryPoints: 0,
    spentChannelDivinity: 0,
  },
  activeSummons: [],
};

const initialState: UserState = {
  characters: [],
  currentCharacterId: null,
  draftId: null,
  loading: true,
};

const CharacterContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<CharacterAction>;
  currentCharacter: CharacterData | null;
} | undefined>(undefined);

function characterReducer(state: UserState, action: CharacterAction): UserState {
  switch (action.type) {
    case 'SET_CHARACTERS': {
      const dbCharacters = action.payload;
      const draftSaved = state.draftId !== null && dbCharacters.some(c => c.id === state.draftId);
      const draftId = draftSaved ? null : state.draftId;
      // Mantiene la bozza in creazione finché non viene salvata
      const draft = draftId ? state.characters.find(c => c.id === draftId) : undefined;
      return {
        ...state,
        characters: draft ? [...dbCharacters, draft] : dbCharacters,
        draftId,
        loading: false,
      };
    }
    case 'ADD_CHARACTER':
      return {
        ...state,
        characters: [...state.characters, action.payload],
        currentCharacterId: action.payload.id,
        draftId: action.payload.id,
      };
    case 'UPDATE_CHARACTER':
      return {
        ...state,
        characters: state.characters.map((c) =>
          c.id === state.currentCharacterId ? { ...c, ...action.payload } : c
        ),
      };
    case 'DELETE_CHARACTER':
      return {
        ...state,
        characters: state.characters.filter((c) => c.id !== action.payload),
        currentCharacterId: state.currentCharacterId === action.payload ? null : state.currentCharacterId,
      };
    case 'SELECT_CHARACTER':
      return {
        ...state,
        currentCharacterId: action.payload,
      };
    case 'DISCARD_DRAFT': {
      // Rimuove la bozza creata dal wizard se non è mai stata salvata su Firestore
      if (!state.draftId) return { ...state, currentCharacterId: null };
      return {
        ...state,
        characters: state.characters.filter(c => c.id !== state.draftId),
        currentCharacterId: null,
        draftId: null,
      };
    }
    case 'RESET_WIZARD': {
       // Una nuova creazione scarta eventuali bozze precedenti non salvate
       const characters = state.draftId ? state.characters.filter(c => c.id !== state.draftId) : state.characters;
       return {
         ...state,
         characters,
         currentCharacterId: null,
         draftId: null,
       };
    }
    default:
      return state;
  }
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(characterReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_CHARACTERS', payload: [] });
      return;
    }

    // Subscribe to characters for the current user
    const unsubscribe = characterService.subscribeToCharacters(user.uid, (characters) => {
      dispatch({ type: 'SET_CHARACTERS', payload: characters });
    });

    return () => unsubscribe();
  }, [user]);

  const currentCharacter = state.characters.find((c) => c.id === state.currentCharacterId) || null;

  return (
    <CharacterContext.Provider value={{ state, dispatch, currentCharacter }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
}

export { initialCharacter };
