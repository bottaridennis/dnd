/**
 * Equipaggiamento PHB 2024: armi e armature.
 * Pesi convertiti in kg (1 lb ≈ 0,5 kg) e gittate in metri (5 ft = 1,5 m).
 * Le proprietà sono mantenute con le chiavi inglesi (usate dalla logica di calcolo).
 */

export interface WeaponData {
  id: string;
  name: string;
  category: 'Semplice' | 'Marziale';
  kind: 'melee' | 'ranged';
  damage: string;
  damageType: 'Tagliente' | 'Perforante' | 'Contundente';
  properties: string[];
  mastery: string;
  imageUrl: string;
  weight: number;
  cost: string;
  aliases?: string[];
}

export type ArmorCategory = 'Leggera' | 'Media' | 'Pesante' | 'Scudo';

export interface ArmorData {
  id: string;
  name: string;
  category: ArmorCategory;
  baseAc: number;
  /** null = nessun limite; 0 = la Destrezza non si somma */
  maxDex: number | null;
  strength?: number;
  stealthDisadvantage?: boolean;
  weight: number;
  cost: string;
  aliases?: string[];
}

export const standardWeapons: WeaponData[] = [
  // Semplici da mischia
  { id: 'club', name: 'Randello', category: 'Semplice', kind: 'melee', damage: '1d4', damageType: 'Contundente', properties: ['Light'], mastery: 'Slow', imageUrl: '', weight: 1, cost: '1 sp' },
  { id: 'dagger', name: 'Pugnale', category: 'Semplice', kind: 'melee', damage: '1d4', damageType: 'Perforante', properties: ['Finesse', 'Light', 'Thrown (6/18)'], mastery: 'Nick', imageUrl: '', weight: 0.5, cost: '2 gp', aliases: ['Daga'] },
  { id: 'greatclub', name: 'Randello Pesante', category: 'Semplice', kind: 'melee', damage: '1d8', damageType: 'Contundente', properties: ['Two-Handed'], mastery: 'Push', imageUrl: '', weight: 5, cost: '2 sp' },
  { id: 'handaxe', name: 'Accetta', category: 'Semplice', kind: 'melee', damage: '1d6', damageType: 'Tagliente', properties: ['Light', 'Thrown (6/18)'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '5 gp', aliases: ['Ascia'] },
  { id: 'javelin', name: 'Giavellotto', category: 'Semplice', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Thrown (9/36)'], mastery: 'Slow', imageUrl: '', weight: 1, cost: '5 sp' },
  { id: 'light_hammer', name: 'Martello Leggero', category: 'Semplice', kind: 'melee', damage: '1d4', damageType: 'Contundente', properties: ['Light', 'Thrown (6/18)'], mastery: 'Nick', imageUrl: '', weight: 1, cost: '2 gp' },
  { id: 'mace', name: 'Mazza', category: 'Semplice', kind: 'melee', damage: '1d6', damageType: 'Contundente', properties: [], mastery: 'Sap', imageUrl: '', weight: 2, cost: '5 gp' },
  { id: 'quarterstaff', name: 'Bastone Ferrato', category: 'Semplice', kind: 'melee', damage: '1d6', damageType: 'Contundente', properties: ['Versatile (1d8)'], mastery: 'Topple', imageUrl: '', weight: 2, cost: '2 sp', aliases: ['Bastone'] },
  { id: 'sickle', name: 'Falcetto', category: 'Semplice', kind: 'melee', damage: '1d4', damageType: 'Tagliente', properties: ['Light'], mastery: 'Nick', imageUrl: '', weight: 1, cost: '1 gp' },
  { id: 'spear', name: 'Lancia', category: 'Semplice', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Thrown (6/18)', 'Versatile (1d8)'], mastery: 'Sap', imageUrl: '', weight: 1.5, cost: '1 gp' },

  // Semplici a distanza
  { id: 'dart', name: 'Dardo', category: 'Semplice', kind: 'ranged', damage: '1d4', damageType: 'Perforante', properties: ['Finesse', 'Thrown (6/18)'], mastery: 'Vex', imageUrl: '', weight: 0.125, cost: '5 cp' },
  { id: 'light_crossbow', name: 'Balestra Leggera', category: 'Semplice', kind: 'ranged', damage: '1d8', damageType: 'Perforante', properties: ['Ammunition (24/96)', 'Loading', 'Two-Handed'], mastery: 'Slow', imageUrl: '', weight: 2.5, cost: '25 gp' },
  { id: 'shortbow', name: 'Arco Corto', category: 'Semplice', kind: 'ranged', damage: '1d6', damageType: 'Perforante', properties: ['Ammunition (24/96)', 'Two-Handed'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '25 gp' },
  { id: 'sling', name: 'Fionda', category: 'Semplice', kind: 'ranged', damage: '1d4', damageType: 'Contundente', properties: ['Ammunition (9/36)'], mastery: 'Slow', imageUrl: '', weight: 0, cost: '1 sp' },

  // Marziali da mischia
  { id: 'battleaxe', name: 'Ascia da Battaglia', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Tagliente', properties: ['Versatile (1d10)'], mastery: 'Topple', imageUrl: '', weight: 2, cost: '10 gp' },
  { id: 'flail', name: 'Flagello', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Contundente', properties: [], mastery: 'Sap', imageUrl: '', weight: 1, cost: '10 gp' },
  { id: 'glaive', name: 'Falcione', category: 'Marziale', kind: 'melee', damage: '1d10', damageType: 'Tagliente', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Graze', imageUrl: '', weight: 3, cost: '20 gp', aliases: ['Glaive'] },
  { id: 'greataxe', name: 'Ascia Bipenne', category: 'Marziale', kind: 'melee', damage: '1d12', damageType: 'Tagliente', properties: ['Heavy', 'Two-Handed'], mastery: 'Cleave', imageUrl: '', weight: 3.5, cost: '30 gp' },
  { id: 'greatsword', name: 'Spadone', category: 'Marziale', kind: 'melee', damage: '2d6', damageType: 'Tagliente', properties: ['Heavy', 'Two-Handed'], mastery: 'Graze', imageUrl: '', weight: 3, cost: '50 gp' },
  { id: 'halberd', name: 'Alabarda', category: 'Marziale', kind: 'melee', damage: '1d10', damageType: 'Tagliente', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Cleave', imageUrl: '', weight: 3, cost: '20 gp' },
  { id: 'lance', name: 'Lancia da Cavaliere', category: 'Marziale', kind: 'melee', damage: '1d10', damageType: 'Perforante', properties: ['Heavy', 'Reach', 'Two-Handed (se non in sella)'], mastery: 'Topple', imageUrl: '', weight: 3, cost: '10 gp' },
  { id: 'longsword', name: 'Spada Lunga', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Tagliente', properties: ['Versatile (1d10)'], mastery: 'Sap', imageUrl: '', weight: 1.5, cost: '15 gp' },
  { id: 'maul', name: 'Maglio', category: 'Marziale', kind: 'melee', damage: '2d6', damageType: 'Contundente', properties: ['Heavy', 'Two-Handed'], mastery: 'Topple', imageUrl: '', weight: 5, cost: '10 gp' },
  { id: 'morningstar', name: 'Morning Star', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: [], mastery: 'Sap', imageUrl: '', weight: 2, cost: '15 gp', aliases: ['Mazza Chiodata'] },
  { id: 'pike', name: 'Picca', category: 'Marziale', kind: 'melee', damage: '1d10', damageType: 'Perforante', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Push', imageUrl: '', weight: 9, cost: '5 gp' },
  { id: 'rapier', name: 'Stocco', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: ['Finesse'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '25 gp', aliases: ['Rapiere', 'Striscia'] },
  { id: 'scimitar', name: 'Scimitarra', category: 'Marziale', kind: 'melee', damage: '1d6', damageType: 'Tagliente', properties: ['Finesse', 'Light'], mastery: 'Nick', imageUrl: '', weight: 1.5, cost: '25 gp' },
  { id: 'shortsword', name: 'Spada Corta', category: 'Marziale', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Finesse', 'Light'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '10 gp' },
  { id: 'trident', name: 'Tridente', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: ['Thrown (6/18)', 'Versatile (1d10)'], mastery: 'Topple', imageUrl: '', weight: 2, cost: '5 gp' },
  { id: 'warhammer', name: 'Martello da Guerra', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Contundente', properties: ['Versatile (1d10)'], mastery: 'Push', imageUrl: '', weight: 2.5, cost: '15 gp' },
  { id: 'war_pick', name: 'Piccone da Guerra', category: 'Marziale', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: ['Versatile (1d10)'], mastery: 'Sap', imageUrl: '', weight: 1, cost: '5 gp' },
  { id: 'whip', name: 'Frusta', category: 'Marziale', kind: 'melee', damage: '1d4', damageType: 'Tagliente', properties: ['Finesse', 'Reach'], mastery: 'Slow', imageUrl: '', weight: 1.5, cost: '2 gp' },

  // Marziali a distanza
  { id: 'blowgun', name: 'Cerbottana', category: 'Marziale', kind: 'ranged', damage: '1', damageType: 'Perforante', properties: ['Ammunition (7,5/30)', 'Loading'], mastery: 'Vex', imageUrl: '', weight: 0.5, cost: '10 gp' },
  { id: 'hand_crossbow', name: 'Balestra a Mano', category: 'Marziale', kind: 'ranged', damage: '1d6', damageType: 'Perforante', properties: ['Ammunition (9/36)', 'Light', 'Loading'], mastery: 'Vex', imageUrl: '', weight: 1.5, cost: '75 gp' },
  { id: 'heavy_crossbow', name: 'Balestra Pesante', category: 'Marziale', kind: 'ranged', damage: '1d10', damageType: 'Perforante', properties: ['Ammunition (30/120)', 'Heavy', 'Loading', 'Two-Handed'], mastery: 'Push', imageUrl: '', weight: 9, cost: '50 gp' },
  { id: 'longbow', name: 'Arco Lungo', category: 'Marziale', kind: 'ranged', damage: '1d8', damageType: 'Perforante', properties: ['Ammunition (45/180)', 'Heavy', 'Two-Handed'], mastery: 'Slow', imageUrl: '', weight: 1, cost: '50 gp' },
  { id: 'musket', name: 'Moschetto', category: 'Marziale', kind: 'ranged', damage: '1d12', damageType: 'Perforante', properties: ['Ammunition (12/36)', 'Loading', 'Two-Handed'], mastery: 'Slow', imageUrl: '', weight: 5, cost: '500 gp' },
  { id: 'pistol', name: 'Pistola', category: 'Marziale', kind: 'ranged', damage: '1d10', damageType: 'Perforante', properties: ['Ammunition (9/27)', 'Loading'], mastery: 'Vex', imageUrl: '', weight: 1.5, cost: '250 gp' },
];

export const standardArmor: ArmorData[] = [
  // Leggere
  { id: 'padded', name: 'Armatura Imbottita', category: 'Leggera', baseAc: 11, maxDex: null, stealthDisadvantage: true, weight: 4, cost: '5 gp', aliases: ['Imbottita'] },
  { id: 'leather', name: 'Armatura di Cuoio', category: 'Leggera', baseAc: 11, maxDex: null, weight: 5, cost: '10 gp', aliases: ['Corazza di Cuoio', 'Cuoio'] },
  { id: 'studded', name: 'Armatura di Cuoio Borchiato', category: 'Leggera', baseAc: 12, maxDex: null, weight: 6.5, cost: '45 gp', aliases: ['Cuoio Borchiato'] },
  // Medie
  { id: 'hide', name: 'Armatura di Pelle', category: 'Media', baseAc: 12, maxDex: 2, weight: 6, cost: '10 gp', aliases: ['Pelle'] },
  { id: 'chain_shirt', name: 'Giaco di Maglia', category: 'Media', baseAc: 13, maxDex: 2, weight: 10, cost: '50 gp', aliases: ['Camicia di Maglia'] },
  { id: 'scale', name: 'Corazza a Scaglie', category: 'Media', baseAc: 14, maxDex: 2, stealthDisadvantage: true, weight: 22.5, cost: '50 gp', aliases: ['Armatura a Scaglie'] },
  { id: 'breastplate', name: 'Corazza di Piastre', category: 'Media', baseAc: 14, maxDex: 2, weight: 10, cost: '400 gp', aliases: ['Pettorale'] },
  { id: 'half_plate', name: 'Mezza Armatura', category: 'Media', baseAc: 15, maxDex: 2, stealthDisadvantage: true, weight: 20, cost: '750 gp' },
  // Pesanti
  { id: 'ring_mail', name: 'Corazza ad Anelli', category: 'Pesante', baseAc: 14, maxDex: 0, stealthDisadvantage: true, weight: 20, cost: '30 gp' },
  { id: 'chain_mail', name: 'Cotta di Maglia', category: 'Pesante', baseAc: 16, maxDex: 0, strength: 13, stealthDisadvantage: true, weight: 27.5, cost: '75 gp' },
  { id: 'splint', name: 'Corazza a Strisce', category: 'Pesante', baseAc: 17, maxDex: 0, strength: 15, stealthDisadvantage: true, weight: 30, cost: '200 gp' },
  { id: 'plate', name: 'Armatura Completa', category: 'Pesante', baseAc: 18, maxDex: 0, strength: 15, stealthDisadvantage: true, weight: 32.5, cost: '1500 gp', aliases: ['Armatura a Piastre'] },
  // Scudo
  { id: 'shield', name: 'Scudo', category: 'Scudo', baseAc: 2, maxDex: null, weight: 3, cost: '10 gp' },
];

const normalize = (value: string) => value.trim().toLocaleLowerCase('it').replace(/[’']/g, "'");

export function findWeapon(name: string | undefined | null): WeaponData | undefined {
  if (!name) return undefined;
  const needle = normalize(name);
  return standardWeapons.find(w => normalize(w.name) === needle || w.aliases?.some(a => normalize(a) === needle));
}

export function findArmor(name: string | undefined | null): ArmorData | undefined {
  if (!name) return undefined;
  const needle = normalize(name);
  return standardArmor.find(a => normalize(a.name) === needle || a.aliases?.some(alias => normalize(alias) === needle));
}

/** Pesi indicativi (kg) per oggetti d'avventura comuni usati nei pacchetti iniziali */
const GEAR_WEIGHTS: Record<string, number> = {
  'dotazione da esploratore': 27.5,
  'dotazione da esploratore di dungeon': 27.5,
  'dotazione da sacerdote': 14.5,
  'dotazione da studioso': 11,
  'dotazione da scassinatore': 21,
  'dotazione da intrattenitore': 29,
  'frecce': 0.05,
  'dardi': 0.05,
  'faretra': 0.5,
  'libro degli incantesimi': 1.5,
  'libro': 2.5,
  'veste': 2,
  'abiti comuni': 1.5,
  'abiti belli': 3,
  'piede di porco': 2.5,
  'attrezzi da ladro': 0.5,
  'simbolo sacro': 0.5,
  'focus arcano': 0.5,
  'focus druidico': 0.5,
  'borsa': 0.5,
  'candela': 0,
  'pergamena': 0,
};

/**
 * Converte un nome grezzo ("Pugnale (2)") in un oggetto d'inventario strutturato,
 * completando i dati se trova una corrispondenza nel database di armi o armature.
 */
export function processStartingItem(rawName: string, containerId: string | null = 'backpack'): any {
  let name = rawName;
  let quantity = 1;

  const quantityMatch = name.match(/\((\d+)\)$/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1], 10);
    name = name.replace(/\s*\(\d+\)$/, '').trim();
  }

  const weaponInfo = findWeapon(name);
  const armorInfo = weaponInfo ? undefined : findArmor(name);
  const gearWeight = GEAR_WEIGHTS[normalize(name.replace(/\s*\(.*\)$/, ''))] ?? 0;
  // Armi e armature iniziali vengono indossate/impugnate subito
  const isEquipped = Boolean(armorInfo) || Boolean(weaponInfo);

  return {
    id: crypto.randomUUID(),
    name: weaponInfo?.name || armorInfo?.name || name,
    weight: weaponInfo?.weight ?? armorInfo?.weight ?? gearWeight,
    quantity,
    isAttuned: false,
    isMagical: false,
    isEquipped,
    containerId: isEquipped ? null : containerId,
    damage: weaponInfo?.damage,
    damageType: weaponInfo?.damageType,
    properties: weaponInfo?.properties,
    mastery: weaponInfo?.mastery,
  };
}
