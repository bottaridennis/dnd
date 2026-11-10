import {
  collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { CharacterData } from '../contexts/CharacterContext';
import { characterService } from './characterService';

export interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number | null;
  kind: 'pc' | 'npc';
  characterId?: string;
  initiativeBonus?: number;
  hp?: number;
  maxHp?: number;
  ac?: number;
  note?: string;
  /** PF temporanei (solo creature del Master) */
  tempHp?: number;
  /** Grado di sfida, per il calcolo dei PE */
  cr?: string;
  /** Condizioni applicate nel tracker; rounds = round rimanenti (null = finché non viene rimossa) */
  conditions?: TrackedCondition[];
  /** Creatura sconfitta: viene saltata nei turni */
  defeated?: boolean;
}

export interface TrackedCondition { id: string; name: string; rounds: number | null }

export interface EncounterMonster {
  id: string;
  name: string;
  cr: string;
  count: number;
  hp: number;
  ac: number;
  initiativeBonus: number;
  notes?: string;
}

export interface Encounter {
  id: string;
  name: string;
  description?: string;
  monsters: EncounterMonster[];
  createdAt: number;
}

export interface CombatLogEntry { id: string; round: number; text: string; at: number }

export interface InitiativeState {
  active: boolean;
  round: number;
  turn: number;
  entries: InitiativeEntry[];
  /** Incontro preparato da cui è partito il combattimento */
  encounterId?: string;
  encounterName?: string;
  log?: CombatLogEntry[];
  startedAt?: number;
}

export interface Campaign {
  id: string;
  name: string;
  dmId: string;
  dmName?: string;
  notes?: string;
  initiative: InitiativeState;
  encounters?: Encounter[];
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION = 'campaigns';
// Niente caratteri ambigui (0/O, 1/I) per dettare il codice al tavolo
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 6): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, v => CODE_ALPHABET[v % CODE_ALPHABET.length]).join('');
}

export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export const EMPTY_INITIATIVE: InitiativeState = { active: false, round: 1, turn: 0, entries: [] };

export const campaignService = {
  async createCampaign(name: string): Promise<Campaign> {
    const user = auth.currentUser;
    if (!user) throw new Error('Accesso richiesto');
    const id = generateInviteCode();
    const campaign: Campaign = { id, name: name.trim() || 'Nuova campagna', dmId: user.uid, dmName: user.displayName || '', notes: '', initiative: EMPTY_INITIATIVE };
    await setDoc(doc(db, COLLECTION, id), { ...campaign, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return campaign;
  },

  subscribeMyCampaigns(dmId: string, callback: (campaigns: Campaign[]) => void, onError?: (e: unknown) => void) {
    const q = query(collection(db, COLLECTION), where('dmId', '==', dmId));
    return onSnapshot(q, snap => callback(snap.docs.map(d => d.data() as Campaign)), err => { console.error(err); onError?.(err); });
  },

  subscribeCampaign(id: string, callback: (campaign: Campaign | null) => void) {
    return onSnapshot(doc(db, COLLECTION, id), snap => callback(snap.exists() ? (snap.data() as Campaign) : null), err => console.error(err));
  },

  async getCampaign(code: string): Promise<Campaign | null> {
    const snap = await getDoc(doc(db, COLLECTION, normalizeCode(code)));
    return snap.exists() ? (snap.data() as Campaign) : null;
  },

  async updateCampaign(id: string, updates: Partial<Campaign>) {
    // Firestore non accetta valori undefined: i dati della campagna sono JSON puro
    const clean = JSON.parse(JSON.stringify(updates));
    await updateDoc(doc(db, COLLECTION, id), { ...clean, updatedAt: serverTimestamp() });
  },

  async deleteCampaign(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  /** Personaggi che i giocatori hanno collegato alla campagna (lettura consentita al Master). */
  subscribeParty(campaign: Campaign, callback: (characters: CharacterData[]) => void, onError?: (e: unknown) => void) {
    const q = query(collection(db, 'characters'), where('campaignDmId', '==', campaign.dmId), where('campaignId', '==', campaign.id));
    return onSnapshot(q, snap => callback(snap.docs.map(d => d.data() as CharacterData)), err => { console.error(err); onError?.(err); });
  },

  async joinCampaign(characterId: string, code: string): Promise<Campaign> {
    const campaign = await this.getCampaign(code);
    if (!campaign) throw new Error('Nessuna campagna con questo codice.');
    await characterService.updateCharacter(characterId, { campaignId: campaign.id, campaignDmId: campaign.dmId, campaignName: campaign.name });
    return campaign;
  },

  async leaveCampaign(characterId: string) {
    await characterService.updateCharacter(characterId, { campaignId: undefined, campaignDmId: undefined, campaignName: undefined });
  },
};
