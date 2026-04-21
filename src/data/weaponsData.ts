
export interface WeaponData {
  id: string;
  name: string;
  category: 'Semplice' | 'Marziale';
  damage: string;
  damageType: 'Tagliente' | 'Perforante' | 'Contundente';
  properties: string[];
  mastery: string;
  imageUrl: string;
  weight: number;
  cost: string;
}

export const standardWeapons: WeaponData[] = [
  // Semplici Mischia
  { id: 'dagger', name: 'Pugnale', category: 'Semplice', damage: '1d4', damageType: 'Perforante', properties: ['Finesse', 'Light', 'Thrown (6/18)'], mastery: 'Nick', imageUrl: '', weight: 0.5, cost: '2 gp' },
  { id: 'mace', name: 'Mazza', category: 'Semplice', damage: '1d6', damageType: 'Contundente', properties: [], mastery: 'Sap', imageUrl: '', weight: 2, cost: '5 gp' },
  { id: 'quarterstaff', name: 'Bastone Ferrato', category: 'Semplice', damage: '1d6', damageType: 'Contundente', properties: ['Versatile (1d8)'], mastery: 'Topple', imageUrl: '', weight: 2, cost: '2 sp' },
  { id: 'spear', name: 'Lancia', category: 'Semplice', damage: '1d6', damageType: 'Perforante', properties: ['Thrown (6/18)', 'Versatile (1d8)'], mastery: 'Sap', imageUrl: '', weight: 1.5, cost: '1 gp' },
  
  // Marziali Mischia
  { id: 'battleaxe', name: 'Ascia da Battaglia', category: 'Marziale', damage: '1d8', damageType: 'Tagliente', properties: ['Versatile (1d10)'], mastery: 'Topple', imageUrl: '', weight: 2, cost: '10 gp' },
  { id: 'flail', name: 'Flagello', category: 'Marziale', damage: '1d8', damageType: 'Contundente', properties: [], mastery: 'Sap', imageUrl: '', weight: 1, cost: '10 gp' },
  { id: 'greataxe', name: 'Ascia Bipenne', category: 'Marziale', damage: '1d12', damageType: 'Tagliente', properties: ['Heavy', 'Two-Handed'], mastery: 'Cleave', imageUrl: '', weight: 3.5, cost: '30 gp' },
  { id: 'greatsword', name: 'Spadone', category: 'Marziale', damage: '2d6', damageType: 'Tagliente', properties: ['Heavy', 'Two-Handed'], mastery: 'Graze', imageUrl: '', weight: 3, cost: '50 gp' },
  { id: 'halberd', name: 'Alabarda', category: 'Marziale', damage: '1d10', damageType: 'Tagliente', properties: ['Heavy', 'Reach', 'Two-Handed'], mastery: 'Cleave', imageUrl: '', weight: 3, cost: '20 gp' },
  { id: 'longsword', name: 'Spada Lunga', category: 'Marziale', damage: '1d8', damageType: 'Tagliente', properties: ['Versatile (1d10)'], mastery: 'Sap', imageUrl: '', weight: 1.5, cost: '15 gp' },
  { id: 'maul', name: 'Maglio', category: 'Marziale', damage: '2d6', damageType: 'Contundente', properties: ['Heavy', 'Two-Handed'], mastery: 'Topple', imageUrl: '', weight: 5, cost: '10 gp' },
  { id: 'rapier', name: 'Stocco', category: 'Marziale', damage: '1d8', damageType: 'Perforante', properties: ['Finesse'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '25 gp' },
  { id: 'scimitar', name: 'Scimitarra', category: 'Marziale', damage: '1d6', damageType: 'Tagliente', properties: ['Finesse', 'Light'], mastery: 'Nick', imageUrl: '', weight: 1.5, cost: '25 gp' },
  { id: 'shortsword', name: 'Spada Corta', category: 'Marziale', damage: '1d6', damageType: 'Perforante', properties: ['Finesse', 'Light'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '10 gp' },
  { id: 'warhammer', name: 'Martello da Guerra', category: 'Marziale', damage: '1d8', damageType: 'Contundente', properties: ['Versatile (1d10)'], mastery: 'Topple', imageUrl: '', weight: 1, cost: '15 gp' },

  // Semplici Distanza
  { id: 'light_crossbow', name: 'Balestra Leggera', category: 'Semplice', damage: '1d8', damageType: 'Perforante', properties: ['Ammunition (24/96)', 'Loading', 'Two-Handed'], mastery: 'Slow', imageUrl: '', weight: 2.5, cost: '25 gp' },
  { id: 'shortbow', name: 'Arco Corto', category: 'Semplice', damage: '1d6', damageType: 'Perforante', properties: ['Ammunition (24/96)', 'Two-Handed'], mastery: 'Vex', imageUrl: '', weight: 1, cost: '25 gp' },
  
  // Marziali Distanza
  { id: 'heavy_crossbow', name: 'Balestra Pesante', category: 'Marziale', damage: '1d10', damageType: 'Perforante', properties: ['Ammunition (30/120)', 'Heavy', 'Loading', 'Two-Handed'], mastery: 'Push', imageUrl: '', weight: 9, cost: '50 gp' },
  { id: 'longbow', name: 'Arco Lungo', category: 'Marziale', damage: '1d8', damageType: 'Perforante', properties: ['Ammunition (45/180)', 'Heavy', 'Two-Handed'], mastery: 'Slow', imageUrl: '', weight: 1, cost: '50 gp' },
  { id: 'hand_crossbow', name: 'Balestra a Mano', category: 'Marziale', damage: '1d6', damageType: 'Perforante', properties: ['Ammunition (9/36)', 'Light', 'Loading'], mastery: 'Vex', imageUrl: '', weight: 1.5, cost: '75 gp' },
];

/**
 * Utility to process a raw item name (like "Dagger (2)") into a structured InventoryItem.
 * Supplements data if it finds a match in standardWeapons.
 */
export function processStartingItem(rawName: string, containerId: string | null = 'backpack'): any {
  let name = rawName;
  let quantity = 1;

  // Parse quantity (e.g. "Daga (2)")
  const quantityMatch = name.match(/\((\d+)\)$/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]);
    name = name.replace(/\s*\(\d+\)$/, '').trim();
  }

  // Lookup weapon details
  const weaponInfo = standardWeapons.find(w => 
    w.name.toLowerCase() === name.toLowerCase()
  );

  return {
    id: crypto.randomUUID(),
    name: name,
    weight: weaponInfo?.weight || 0,
    quantity: quantity,
    isAttuned: false,
    isMagical: false,
    isEquipped: false,
    containerId: containerId,
    // Weapon details
    damage: weaponInfo?.damage,
    damageType: weaponInfo?.damageType,
    properties: weaponInfo?.properties,
    mastery: weaponInfo?.mastery
  };
}
