/**
 * Schermo del tavolo: vista pubblica (anche senza accesso) dell'ordine d'iniziativa.
 * Il Master pubblica in campaignScreens/{codice campagna} una copia filtrata del combattimento:
 * niente creature nascoste, PF dei mostri solo come stato, nessuna nota del Master.
 */
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Campaign, InitiativeEntry, InitiativeState } from './campaignService';

export type HealthStatus = 'illeso' | 'ferito' | 'grave' | 'a terra';

export interface ScreenEntry {
  id: string;
  name: string;
  kind: 'pc' | 'npc';
  initiative: number | null;
  status?: HealthStatus;
  /** Solo per i personaggi: i PF sono noti al tavolo */
  hp?: string;
  conditions: string[];
  defeated: boolean;
}

export interface ScreenState {
  campaignId: string;
  dmId: string;
  campaignName: string;
  encounterName?: string;
  active: boolean;
  round: number;
  /** id della voce di turno; "hidden" se tocca a una creatura nascosta */
  currentId: string | null;
  entries: ScreenEntry[];
  updatedAt: number;
}

export const SCREEN_COLLECTION = 'campaignScreens';

export function healthStatus(hp: number | undefined, max: number | undefined, defeated?: boolean): HealthStatus | undefined {
  if (defeated) return 'a terra';
  if (hp === undefined || !max) return undefined;
  if (hp <= 0) return 'a terra';
  if (hp >= max) return 'illeso';
  return hp > max / 2 ? 'ferito' : 'grave';
}

export interface PcInfo { hp: number; max: number; conditions: string[] }

export function buildScreenState(campaign: Campaign, state: InitiativeState, pcs: Record<string, PcInfo>, conditionLabel: (c: string) => string): ScreenState {
  const visible = state.entries.filter(e => !e.hidden);
  const current: InitiativeEntry | undefined = state.active ? state.entries[state.turn] : undefined;
  return {
    campaignId: campaign.id,
    dmId: campaign.dmId,
    campaignName: campaign.name,
    ...(state.encounterName ? { encounterName: state.encounterName } : {}),
    active: Boolean(state.active),
    round: state.round || 1,
    currentId: current ? (current.hidden ? 'hidden' : current.id) : null,
    entries: visible.map(e => {
      const pc = e.characterId ? pcs[e.characterId] : undefined;
      const status = pc ? healthStatus(pc.hp, pc.max, e.defeated) : healthStatus(e.hp, e.maxHp, e.defeated);
      return {
        id: e.id,
        name: e.name,
        kind: e.kind,
        initiative: e.initiative,
        ...(status ? { status } : {}),
        ...(pc ? { hp: `${pc.hp}/${pc.max}` } : {}),
        conditions: [...(pc?.conditions || []).map(conditionLabel), ...(e.conditions || []).map(c => (c.rounds ? `${c.name} (${c.rounds})` : c.name))],
        defeated: Boolean(e.defeated),
      };
    }),
    updatedAt: Date.now(),
  };
}

export const screenService = {
  publish(screen: ScreenState) {
    return setDoc(doc(db, SCREEN_COLLECTION, screen.campaignId), JSON.parse(JSON.stringify(screen)));
  },
  subscribe(code: string, onData: (s: ScreenState | null) => void, onError: (e: Error) => void) {
    return onSnapshot(doc(db, SCREEN_COLLECTION, code), snap => onData(snap.exists() ? (snap.data() as ScreenState) : null), onError);
  },
};

/** Link dello schermo: funziona senza accesso, anche su una TV o un tablet condiviso. */
export const screenUrl = (code: string) => `${window.location.origin}${import.meta.env.BASE_URL}#/tavolo/${code}`;
