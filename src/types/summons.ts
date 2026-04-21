
export interface ActiveSummon {
  instanceId: string;
  templateId: string;
  name: string;
  category: 'Basic' | 'Pact' | 'Scaling' | 'Homebrew';
  spellLevel: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  attackBonus: number;
  damageBonus: number;
  speed: string;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  actions: { name: string; desc: string }[];
  traits: { name: string; desc: string }[];
  iconName: string; // Storing icon name as string for easier serialization
}
