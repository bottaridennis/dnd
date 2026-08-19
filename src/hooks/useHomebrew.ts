
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { homebrewService } from '../services/homebrewService';
import { RAW_SPELLS } from '../data/spells';
import { FEATURES } from '../data/features';
import { fixTextEncoding } from '../lib/utils';

function normalizeTextFields<T extends Record<string, any>>(item: T): T {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => {
    if (typeof value === 'string') return [key, fixTextEncoding(value)];
    if (Array.isArray(value)) return [key, value.map(entry => typeof entry === 'string' ? fixTextEncoding(entry) : entry)];
    return [key, value];
  })) as T;
}

/**
 * Hook to fetch homebrew data and merge it with base system data.
 */
export function useHomebrew() {
  const { user } = useAuth();
  const [homebrewData, setHomebrewData] = useState({
    spells: [] as any[],
    weapons: [] as any[],
    feats: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchHomebrew() {
      try {
        const data = await homebrewService.getUserHomebrew(user?.uid || '');
        setHomebrewData(data);
      } catch (error) {
        console.error("Failed to load homebrew content:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHomebrew();
  }, [user]);

  // Merge static base data with user's homebrew items
  const allSpells = useMemo(() => {
    const base = RAW_SPELLS.map(s => normalizeTextFields({ ...s, name: s.displayName || s.name }));
    const custom = homebrewData.spells.map(spell => normalizeTextFields(spell));
    return [...base, ...custom];
  }, [homebrewData.spells]);

  const allWeapons = useMemo(() => {
    return [...homebrewData.weapons];
  }, [homebrewData.weapons]);

  const allFeats = useMemo(() => {
    const base = FEATURES.filter(f => 
      f.prerequisite?.includes('Talento Generale') || 
      f.prerequisite?.includes('Talento d’Origine') ||
      f.prerequisite?.includes('Talento Stile di Combattimento') ||
      f.prerequisite?.includes('Talento Benedizione Epica')
    );
    return [...base, ...homebrewData.feats];
  }, [homebrewData.feats]);

  return {
    spells: allSpells,
    weapons: allWeapons,
    feats: allFeats,
    loading,
    refresh: async () => {
      if (user) {
        setLoading(true);
        const data = await homebrewService.getUserHomebrew(user.uid);
        setHomebrewData(data);
        setLoading(false);
      }
    }
  };
}
