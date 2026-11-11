import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { loadSrdMonsters, type Monster } from '../lib/bestiary';

/** Mostri personalizzati: users/{uid}/homebrewMonsters/{id} (coperti dalle regole sulle sottocollezioni dell'utente). */
const monstersCollection = (uid: string) => collection(db, 'users', uid, 'homebrewMonsters');

export const monsterService = {
  save(uid: string, monster: Monster) {
    // Firestore non accetta undefined: si passa per JSON
    const clean = JSON.parse(JSON.stringify({ ...monster, custom: true, updatedAt: Date.now() }));
    return setDoc(doc(db, 'users', uid, 'homebrewMonsters', monster.id), clean);
  },
  remove(uid: string, id: string) {
    return deleteDoc(doc(db, 'users', uid, 'homebrewMonsters', id));
  },
};

/** Mostri dell'SRD (caricati al primo uso) più quelli creati dall'utente, con ricerca per id. */
export function useBestiary() {
  const { user } = useAuth();
  const [srd, setSrd] = useState<Monster[]>([]);
  const [custom, setCustom] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadSrdMonsters()
      .then(list => { if (alive) setSrd(list); })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Bestiario non disponibile'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!user) { setCustom([]); return; }
    return onSnapshot(monstersCollection(user.uid), snap => {
      setCustom(snap.docs.map(d => ({ ...(d.data() as Monster), id: d.id, custom: true })).sort((a, b) => a.name.localeCompare(b.name, 'it')));
    }, err => console.error('Mostri personalizzati non disponibili:', err));
  }, [user]);

  const all = useMemo(() => [...custom, ...srd], [custom, srd]);
  const byId = useMemo(() => new Map(all.map(m => [m.id, m])), [all]);

  return {
    monsters: all,
    custom,
    loading,
    error,
    get: (id?: string) => (id ? byId.get(id) : undefined),
    save: (m: Monster) => (user ? monsterService.save(user.uid, m) : Promise.reject(new Error('Accesso richiesto'))),
    remove: (id: string) => (user ? monsterService.remove(user.uid, id) : Promise.reject(new Error('Accesso richiesto'))),
  };
}
