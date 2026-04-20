import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { characterService } from '../services/characterService';

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

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
  proficientSkills: string[]; // Explicit skill selections
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
  description: string;
  trinket: string;
  hpCurrent: number;
  hpTemp: number;
  acOverride?: number;
  speedOverride?: number;
  proficiencyOverride?: number;
  currency: {
    cp: number;
    sp: number;
    gp: number;
    pp: number;
  };
  // D&D 2024 Resource Tracking
  classes?: Record<string, { level: number, subclass?: string }>;
  resources?: {
    spentSpellSlots: Record<number, number>;
    spentPactSlots: number;
    spentSorceryPoints: number;
    spentChannelDivinity: number;
  };
  createdAt?: any;
  updatedAt?: any;
}

interface UserState {
  characters: CharacterData[];
  currentCharacterId: string | null;
  loading: boolean;
}

type CharacterAction =
  | { type: 'SET_CHARACTERS'; payload: CharacterData[] }
  | { type: 'ADD_CHARACTER'; payload: CharacterData }
  | { type: 'UPDATE_CHARACTER'; payload: Partial<CharacterData> }
  | { type: 'DELETE_CHARACTER'; payload: string }
  | { type: 'SELECT_CHARACTER'; payload: string }
  | { type: 'RESET_WIZARD' };

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
  originFeat: '',
  skills: [],
  proficientSkills: [],
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
  description: '',
  trinket: '',
  hpCurrent: 0,
  hpTemp: 0,
  acOverride: undefined,
  speedOverride: undefined,
  proficiencyOverride: undefined,
  currency: {
    cp: 0,
    sp: 0,
    gp: 0,
    pp: 0,
  },
  classes: {},
  resources: {
    spentSpellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    spentPactSlots: 0,
    spentSorceryPoints: 0,
    spentChannelDivinity: 0,
  },
};

const initialState: UserState = {
  characters: [],
  currentCharacterId: null,
  loading: true,
};

const CharacterContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<CharacterAction>;
  currentCharacter: CharacterData | null;
} | undefined>(undefined);

function characterReducer(state: UserState, action: CharacterAction): UserState {
  switch (action.type) {
    case 'SET_CHARACTERS':
      return {
        ...state,
        characters: action.payload,
        loading: false,
      };
    case 'ADD_CHARACTER':
      return {
        ...state,
        characters: [...state.characters, action.payload],
        currentCharacterId: action.payload.id,
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
    case 'RESET_WIZARD':
       // Logic for starting a new character could go here
       return state;
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
