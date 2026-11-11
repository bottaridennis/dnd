/**
 * Logica pura del combattimento (ordine d'iniziativa, turni, condizioni a tempo, danni, registro).
 * Tutte le funzioni restituiscono un nuovo stato senza modificare quello ricevuto.
 */
import type { CombatLogEntry, Encounter, InitiativeEntry, InitiativeState, TrackedCondition } from '../services/campaignService';
import { rollDie } from './random';
import { XP_BY_CR } from '../data/encounters';

const MAX_LOG = 80;
const uid = () => crypto.randomUUID();

export function sortEntries(entries: InitiativeEntry[]): InitiativeEntry[] {
  return [...entries].sort((a, b) =>
    (b.initiative ?? -99) - (a.initiative ?? -99)
    || (b.initiativeBonus ?? 0) - (a.initiativeBonus ?? 0)
    || (a.kind === b.kind ? 0 : a.kind === 'pc' ? -1 : 1)
    || a.name.localeCompare(b.name, 'it'));
}

export function withLog(state: InitiativeState, text: string): InitiativeState {
  const entry: CombatLogEntry = { id: uid(), round: state.round, text, at: Date.now() };
  return { ...state, log: [entry, ...(state.log || [])].slice(0, MAX_LOG) };
}

export interface PartyMember { id: string; name: string; initiativeBonus: number }

/** Crea lo stato di combattimento da un incontro preparato: gruppo + creature con iniziativa tirata. */
export function buildEncounterState(encounter: Encounter, party: PartyMember[]): InitiativeState {
  const pcs: InitiativeEntry[] = party.map(p => ({ id: uid(), name: p.name, kind: 'pc', characterId: p.id, initiative: null, initiativeBonus: p.initiativeBonus }));
  const monsters: InitiativeEntry[] = encounter.monsters.flatMap(m => {
    // Le creature dello stesso tipo condividono l'iniziativa, come suggerito dalle regole
    const groupInit = rollDie(20) + m.initiativeBonus;
    return Array.from({ length: Math.max(1, m.count) }, (_, i) => ({
      id: uid(),
      name: m.count > 1 ? `${m.name} ${i + 1}` : m.name,
      kind: 'npc' as const,
      initiative: groupInit,
      initiativeBonus: m.initiativeBonus,
      hp: m.hp,
      maxHp: m.hp,
      ac: m.ac,
      cr: m.cr,
      ...(m.notes ? { note: m.notes } : {}),
      ...(m.monsterId ? { monsterId: m.monsterId } : {}),
      ...(m.legendaryUses ? { legendary: { max: m.legendaryUses, used: 0 } } : {}),
      ...(m.hidden ? { hidden: true } : {}),
    }));
  });
  const state: InitiativeState = {
    active: false, round: 1, turn: 0, entries: sortEntries([...pcs, ...monsters]),
    encounterId: encounter.id, encounterName: encounter.name, log: [], startedAt: Date.now(),
  };
  return withLog(state, `Incontro preparato: ${encounter.name}`);
}

export function rollMissingInitiative(state: InitiativeState, onlyNpc = false): InitiativeState {
  const entries = state.entries.map(e => (e.initiative === null && (!onlyNpc || e.kind === 'npc') ? { ...e, initiative: rollDie(20) + (e.initiativeBonus || 0) } : e));
  return { ...state, entries: sortEntries(entries) };
}

const isActive = (e: InitiativeEntry) => !e.defeated;

export function startCombat(state: InitiativeState): InitiativeState {
  const entries = sortEntries(state.entries);
  const first = Math.max(0, entries.findIndex(isActive));
  return withLog({ ...state, active: true, round: 1, turn: first, entries }, `Inizia il combattimento · turno di ${entries[first]?.name ?? '—'}`);
}

/** Le condizioni con durata scadono alla fine del turno della creatura che le ha. */
function tickConditions(entry: InitiativeEntry): { entry: InitiativeEntry; expired: string[] } {
  const expired: string[] = [];
  const conditions = (entry.conditions || []).flatMap(c => {
    if (c.rounds === null) return [c];
    const rounds = c.rounds - 1;
    if (rounds <= 0) { expired.push(c.name); return []; }
    return [{ ...c, rounds }];
  });
  return { entry: { ...entry, conditions }, expired };
}

export function nextTurn(state: InitiativeState): InitiativeState {
  if (!state.entries.length) return state;
  let next = state;
  const current = state.entries[state.turn];
  let entries = state.entries;
  if (current) {
    const { entry, expired } = tickConditions(current);
    entries = entries.map(e => (e.id === current.id ? entry : e));
    next = { ...next, entries };
    expired.forEach(name => { next = withLog(next, `${current.name}: termina ${name}`); });
  }
  if (!entries.some(isActive)) return next;
  let turn = state.turn;
  let round = state.round;
  for (let i = 0; i < entries.length; i++) {
    turn += 1;
    if (turn >= entries.length) { turn = 0; round += 1; }
    if (isActive(entries[turn])) break;
  }
  if (round !== state.round) next = withLog({ ...next, round }, `Round ${round}`);
  // All'inizio del proprio turno la creatura recupera le azioni leggendarie
  const starting = next.entries[turn];
  if (starting?.legendary?.used) next = { ...next, entries: next.entries.map((e, i) => (i === turn ? { ...e, legendary: { ...e.legendary!, used: 0 } } : e)) };
  next = { ...next, turn, round };
  return withLog(next, `Turno di ${entries[turn].name}`);
}

export function previousTurn(state: InitiativeState): InitiativeState {
  if (!state.entries.length) return state;
  let turn = state.turn;
  let round = state.round;
  for (let i = 0; i < state.entries.length; i++) {
    if (turn === 0) {
      if (round === 1) return state;
      turn = state.entries.length - 1;
      round -= 1;
    } else turn -= 1;
    if (isActive(state.entries[turn])) break;
  }
  return { ...state, turn, round };
}

export function updateEntry(state: InitiativeState, id: string, patch: Partial<InitiativeEntry>): InitiativeState {
  return { ...state, entries: state.entries.map(e => (e.id === id ? { ...e, ...patch } : e)) };
}

/** Danni a una creatura del Master: prima i PF temporanei; a 0 PF è sconfitta. */
export function damageEntry(state: InitiativeState, id: string, amount: number): InitiativeState {
  const e = state.entries.find(x => x.id === id);
  if (!e || amount <= 0 || e.hp === undefined) return state;
  const absorbed = Math.min(e.tempHp || 0, amount);
  const hp = Math.max(0, e.hp - (amount - absorbed));
  let next = updateEntry(state, id, { hp, tempHp: (e.tempHp || 0) - absorbed, defeated: hp === 0 ? true : e.defeated });
  next = withLog(next, `${e.name} subisce ${amount} danni (${hp}/${e.maxHp ?? '?'} PF)`);
  if (hp === 0 && !e.defeated) next = withLog(next, `${e.name} è sconfitto`);
  return next;
}

export function healEntry(state: InitiativeState, id: string, amount: number): InitiativeState {
  const e = state.entries.find(x => x.id === id);
  if (!e || amount <= 0 || e.hp === undefined) return state;
  const hp = Math.min(e.maxHp ?? Infinity, e.hp + amount);
  return withLog(updateEntry(state, id, { hp, defeated: hp > 0 ? false : e.defeated }), `${e.name} recupera ${amount} PF (${hp}/${e.maxHp ?? '?'})`);
}

export function addCondition(state: InitiativeState, id: string, name: string, rounds: number | null): InitiativeState {
  const e = state.entries.find(x => x.id === id);
  if (!e) return state;
  const condition: TrackedCondition = { id: uid(), name, rounds };
  const conditions = [...(e.conditions || []).filter(c => c.name !== name), condition];
  return withLog(updateEntry(state, id, { conditions }), `${e.name}: ${name}${rounds ? ` per ${rounds} round` : ''}`);
}

export function removeCondition(state: InitiativeState, id: string, conditionId: string): InitiativeState {
  const e = state.entries.find(x => x.id === id);
  if (!e) return state;
  const removed = e.conditions?.find(c => c.id === conditionId);
  const next = updateEntry(state, id, { conditions: (e.conditions || []).filter(c => c.id !== conditionId) });
  return removed ? withLog(next, `${e.name}: rimossa ${removed.name}`) : next;
}

export function removeEntry(state: InitiativeState, id: string): InitiativeState {
  const idx = state.entries.findIndex(e => e.id === id);
  if (idx === -1) return state;
  const entries = state.entries.filter(e => e.id !== id);
  const turn = entries.length === 0 ? 0 : Math.min(idx < state.turn ? state.turn - 1 : state.turn, entries.length - 1);
  return { ...state, entries, turn };
}

/** Inserisce nuove creature mantenendo il turno corrente sulla stessa creatura. */
export function insertEntries(state: InitiativeState, added: InitiativeEntry[]): InitiativeState {
  const currentId = state.entries[state.turn]?.id;
  const entries = sortEntries([...state.entries, ...added]);
  const turn = currentId ? Math.max(0, entries.findIndex(e => e.id === currentId)) : 0;
  return { ...state, entries, turn };
}

/** Riordina dopo una modifica dell'iniziativa senza perdere la creatura di turno. */
export function resort(state: InitiativeState): InitiativeState {
  return insertEntries(state, []);
}

export function combatSummary(state: InitiativeState, partySize: number) {
  const defeated = state.entries.filter(e => e.kind === 'npc' && e.defeated);
  const xp = defeated.reduce((acc, e) => acc + (e.cr ? XP_BY_CR[e.cr] ?? 0 : 0), 0);
  return { rounds: state.round, defeated, xp, xpEach: partySize ? Math.floor(xp / partySize) : xp };
}
