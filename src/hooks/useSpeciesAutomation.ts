import { useEffect, useRef } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { applySpeciesChange } from '../lib/species';

/**
 * Durante la creazione sincronizza tratti, incantesimi innati e resistenze con specie e lignaggio scelti,
 * rimuovendo quelli della scelta precedente.
 */
export function useSpeciesAutomation() {
  const { currentCharacter, dispatch } = useCharacter();
  const previous = useRef<{ id?: string; speciesId?: string; subOption?: string }>({});

  useEffect(() => {
    if (!currentCharacter) return;
    const prev = previous.current.id === currentCharacter.id ? previous.current : {};
    const next = { speciesId: currentCharacter.speciesId, subOption: currentCharacter.speciesSubOption };
    if (prev.speciesId === next.speciesId && prev.subOption === next.subOption) return;
    previous.current = { id: currentCharacter.id, ...next };

    const updates = applySpeciesChange(currentCharacter, prev, next);
    const changed =
      JSON.stringify(updates.features) !== JSON.stringify(currentCharacter.features || []) ||
      JSON.stringify(updates.innateSpells) !== JSON.stringify(currentCharacter.innateSpells || []) ||
      JSON.stringify(updates.resistances) !== JSON.stringify(currentCharacter.resistances || []);
    if (changed) dispatch({ type: 'UPDATE_CHARACTER', payload: updates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCharacter?.id, currentCharacter?.speciesId, currentCharacter?.speciesSubOption, dispatch]);
}
