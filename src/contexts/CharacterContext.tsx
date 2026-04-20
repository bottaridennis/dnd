import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface CharacterData {
  id: string;
  userId?: string;
  name: string;
  level: number;
  classId: string;
  subclassId?: string;
  speciesId: string;
  backgroundId: string;
  abilityScores: Record<Ability, number>;
  selectedBoosts: Ability[];
  originFeat: string;
  skills: string[]; // These are for old format, we keep it for backward compat if needed
  proficientSkills: string[]; // Explicit skill selections
  spells: string[];
  feats: string[];
  invocations: string[];
  equipment: string[];
  alignment: string;
  appearance: string;
  description: string;
  trinket: string;
  hpCurrent: number;
  hpTemp: number;
  currency: {
    cp: number;
    sp: number;
    gp: number;
    pp: number;
  };
  createdAt?: any;
  updatedAt?: any;
}

interface UserState {
  characters: CharacterData[];
  currentCharacterId: string | null;
}

type CharacterAction =
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
  backgroundId: '',
  abilityScores: { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 },
  selectedBoosts: [],
  originFeat: '',
  skills: [],
  proficientSkills: [],
  spells: [],
  feats: [],
  invocations: [],
  equipment: [],
  alignment: '',
  appearance: '',
  description: '',
  trinket: '',
  hpCurrent: 0,
  hpTemp: 0,
  currency: {
    cp: 0,
    sp: 0,
    gp: 0,
    pp: 0,
  },
};

const initialState: UserState = {
  characters: [],
  currentCharacterId: null,
};

const CharacterContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<CharacterAction>;
  currentCharacter: CharacterData | null;
} | undefined>(undefined);

function characterReducer(state: UserState, action: CharacterAction): UserState {
  switch (action.type) {
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
