import type { CharacterData } from '../contexts/CharacterContext';
import { speciesData } from '../data/rules2024';

export interface SpeciesDerived { traits: string[]; spells: string[]; resistances: string[] }

/** Tratti, incantesimi e resistenze concessi da specie e lignaggio (PHB 2024). */
export function getSpeciesDerived(speciesId?: string, subOptionId?: string): SpeciesDerived {
  const species = speciesData.find(s => s.id === speciesId) as any;
  if (!species) return { traits: [], spells: [], resistances: [] };
  const sub = species.subOptions?.find((o: any) => o.id === subOptionId);
  const traits = [...(species.traits || []), ...(sub?.traits || [])];
  if (sub?.feature) traits.push(sub.feature);
  if (speciesId === 'dragonborn' && sub?.damageType) traits.push(`Arma a Soffio: ${sub.damageType}`);
  const spells = [...(species.grantedSpells || []), ...(sub?.spells || [])];
  const resistances = [...(species.resistances || [])];
  if (sub?.resistance) resistances.push(sub.resistance);
  return { traits, spells, resistances: Array.from(new Set(resistances)) };
}

/**
 * Sostituisce i benefici della specie precedente con quelli della nuova,
 * lasciando intatti privilegi, incantesimi e resistenze aggiunti a mano.
 */
export function applySpeciesChange(
  character: Pick<CharacterData, 'features' | 'resistances'> & Partial<CharacterData>,
  previous: { speciesId?: string; subOption?: string },
  next: { speciesId?: string; subOption?: string },
): Pick<CharacterData, 'features' | 'resistances' | 'innateSpells'> {
  const before = getSpeciesDerived(previous.speciesId, previous.subOption);
  const after = getSpeciesDerived(next.speciesId, next.subOption);
  const strip = (list: string[] | undefined, remove: string[]) => (list || []).filter(item => !remove.includes(item));
  return {
    features: Array.from(new Set([...strip(character.features, before.traits), ...after.traits])),
    innateSpells: Array.from(new Set([...strip(character.innateSpells, before.spells), ...after.spells])),
    resistances: Array.from(new Set([...strip(character.resistances, before.resistances), ...after.resistances])),
  };
}
