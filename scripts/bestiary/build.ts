/**
 * Genera public/data/bestiary.json dai mostri dell'SRD 5.2 (dataset open source 5e-bits/5e-database).
 *
 *   npx tsx scripts/bestiary/build.ts [percorso/5e-SRD-Monsters.json]
 *
 * Senza argomenti scarica il file da GitHub. Il System Reference Document 5.2 di Wizards of the Coast
 * è distribuito con licenza CC-BY-4.0: l'attribuzione è mostrata nel Bestiario.
 * Vengono tradotti in italiano nomi, tipi, statistiche e le righe standard di attacchi e tiri salvezza;
 * i testi descrittivi liberi restano quelli originali dell'SRD.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ACTION_NAMES_IT, MONSTER_NAMES_IT } from './names.it';
import { RAW_SPELLS } from '../../src/data/spells';

const SPELL_IT = new Map((RAW_SPELLS as { name: string; displayName?: string }[]).map(sp => [sp.name.toLowerCase(), sp.displayName || sp.name]));
const spellName = (n: string) => SPELL_IT.get(n.toLowerCase()) || n;

const SOURCE = 'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en/5e-SRD-Monsters.json';
const OUT = new URL('../../public/data/bestiary.json', import.meta.url);

const SIZE: Record<string, string> = { Tiny: 'Minuscola', Small: 'Piccola', Medium: 'Media', Large: 'Grande', Huge: 'Enorme', Gargantuan: 'Mastodontica', 'Medium or small': 'Media o Piccola' };
const TYPE: Record<string, string> = {
  aberration: 'Aberrazione', beast: 'Bestia', celestial: 'Celestiale', construct: 'Costrutto', dragon: 'Drago', elemental: 'Elementale', fey: 'Fatato',
  fiend: 'Immondo', giant: 'Gigante', humanoid: 'Umanoide', monstrosity: 'Mostruosità', ooze: 'Melma', plant: 'Vegetale', undead: 'Non Morto',
  'swarm of tiny beasts': 'Sciame di Bestie Minuscole', 'swarm of tiny undead': 'Sciame di Non Morti Minuscoli',
};
const ALIGN: Record<string, string> = {
  unaligned: 'Senza allineamento', neutral: 'Neutrale', 'chaotic evil': 'Caotico Malvagio', 'lawful evil': 'Legale Malvagio', 'neutral evil': 'Neutrale Malvagio',
  'lawful good': 'Legale Buono', 'chaotic good': 'Caotico Buono', 'neutral good': 'Neutrale Buono', 'chaotic neutral': 'Caotico Neutrale', 'lawful neutral': 'Legale Neutrale',
};
export const DAMAGE: Record<string, string> = {
  acid: 'Acido', bludgeoning: 'Contundenti', cold: 'Freddo', fire: 'Fuoco', force: 'Forza', lightning: 'Fulmine', necrotic: 'Necrotici', piercing: 'Perforanti',
  poison: 'Veleno', psychic: 'Psichici', radiant: 'Radiosi', slashing: 'Taglienti', thunder: 'Tuono',
};
const CONDITION: Record<string, string> = {
  blinded: 'Accecato', charmed: 'Affascinato', deafened: 'Assordato', exhaustion: 'Esaurimento', frightened: 'Spaventato', grappled: 'Afferrato',
  incapacitated: 'Incapacitato', invisible: 'Invisibile', paralyzed: 'Paralizzato', petrified: 'Pietrificato', poisoned: 'Avvelenato', prone: 'Prono',
  restrained: 'Immobilizzato', stunned: 'Stordito', unconscious: 'Privo di Sensi',
};
const ABILITY: Record<string, string> = { Strength: 'Forza', Dexterity: 'Destrezza', Constitution: 'Costituzione', Intelligence: 'Intelligenza', Wisdom: 'Saggezza', Charisma: 'Carisma' };
const ABILITY_KEY: Record<string, string> = { STR: 'STR', DEX: 'DEX', CON: 'CON', INT: 'INT', WIS: 'WIS', CHA: 'CHA' };
const SKILL: Record<string, string> = {
  Acrobatics: 'Acrobazia', 'Animal Handling': 'Addestrare Animali', Arcana: 'Arcano', Athletics: 'Atletica', Deception: 'Inganno', History: 'Storia',
  Insight: 'Intuizione', Intimidation: 'Intimidire', Investigation: 'Indagare', Medicine: 'Medicina', Nature: 'Natura', Perception: 'Percezione',
  Performance: 'Intrattenere', Persuasion: 'Persuasione', Religion: 'Religione', 'Sleight of Hand': 'Rapidità di Mano', Stealth: 'Furtività', Survival: 'Sopravvivenza',
};
const SENSE: Record<string, string> = { darkvision: 'Scurovisione', blindsight: 'Vista Cieca', tremorsense: 'Percezione Tellurica', truesight: 'Vista Pura' };
const SPEED: Record<string, string> = { walk: '', burrow: 'scavare', climb: 'scalare', fly: 'volare', swim: 'nuotare', hover: '(fluttuare)' };
const LANGUAGE: Record<string, string> = {
  Common: 'Comune', Draconic: 'Draconico', Dwarvish: 'Nanico', Elvish: 'Elfico', Giant: 'Gigante', Gnomish: 'Gnomesco', Goblin: 'Goblin', Halfling: 'Halfling',
  Orc: 'Orchesco', Abyssal: 'Abissale', Celestial: 'Celestiale', Infernal: 'Infernale', Primordial: 'Primordiale', Sylvan: 'Silvano', Undercommon: 'Sottocomune',
  'Deep Speech': 'Linguaggio delle Profondità', telepathy: 'telepatia', understands: 'comprende', "but can't speak": 'ma non sa parlare', 'but can’t speak': 'ma non sa parlare',
  'Thieves’ Cant': 'Gergo dei Ladri', any: 'qualsiasi', languages: 'lingue', language: 'lingua', 'one': 'una', 'two': 'due', 'plus': 'più', 'All': 'Tutte', 'and': 'e',
};

/** Piedi → metri (convenzione italiana: 1,5 m ogni 5 piedi). */
const m = (feet: number) => String(Math.round(feet * 0.3 * 10) / 10).replace('.', ',');
const SHAPE: Record<string, [string, string]> = { Cone: ['un', 'Cono'], Line: ['una', 'Linea'], Sphere: ['una', 'Sfera'], Emanation: ['un’', 'Emanazione'], Cube: ['un', 'Cubo'], Cylinder: ['un', 'Cilindro'] };
const feetText = (text: string) => text
  // "a 90-foot-long, 10-foot-wide Line", "a 20-foot-radius Sphere", "a 60-foot Cone"
  .replace(/an? (\d+)-foot-long, (\d+)-foot-?wide (Line)/g, (_, l, w, sh) => `${SHAPE[sh][0]}${SHAPE[sh][0].endsWith('’') ? '' : ' '}${SHAPE[sh][1]} lunga ${m(+l)} metri e larga ${m(+w)} metri`)
  .replace(/an? (\d+)-foot-radius, (\d+)-foot-high (Cylinder)/g, (_, r, h, sh) => `${SHAPE[sh][0]}${SHAPE[sh][0].endsWith('’') ? '' : ' '}${SHAPE[sh][1]} di ${m(+r)} metri di raggio e ${m(+h)} metri di altezza`)
  .replace(/an? (\d+)-foot-radius (Sphere|Cylinder|Emanation)/g, (_, r, sh) => `${SHAPE[sh][0]}${SHAPE[sh][0].endsWith('’') ? '' : ' '}${SHAPE[sh][1]} di ${m(+r)} metri di raggio`)
  .replace(/an? (\d+)-foot (Cone|Line|Sphere|Emanation|Cube|Cylinder)/g, (_, a, sh) => `${SHAPE[sh][0]}${SHAPE[sh][0].endsWith('’') ? '' : ' '}${SHAPE[sh][1]} di ${m(+a)} metri`)
  .replace(/(\d+)\/(\d+) ft\./g, (_, a, b) => `${m(+a)}/${m(+b)} m.`)
  .replace(/(\d+)-foot/g, (_, a) => `${m(+a)} metri`)
  .replace(/(\d+) feet/g, (_, a) => `${m(+a)} metri`)
  .replace(/(\d+) ft\./g, (_, a) => `${m(+a)} m.`);

const NUM: Record<string, string> = { one: 'un', two: 'due', three: 'tre', four: 'quattro', five: 'cinque', six: 'sei' };
const actName = (n: string) => ACTION_NAMES_IT[n] || n;

const damageWord = (type: string) => {
  const it = DAMAGE[type.toLowerCase()];
  return it ? (['Contundenti', 'Necrotici', 'Perforanti', 'Psichici', 'Radiosi', 'Taglienti'].includes(it) ? `danni ${it}` : `danni da ${it}`) : `danni ${type}`;
};

/** Traduce le formule standard dei blocchi statistiche 2024; il resto del testo resta invariato. */
export function translateText(text: string): string {
  let t = feetText(text);
  t = t.replace(/Melee or Ranged Attack Roll:/g, 'Tiro per colpire in mischia o a distanza:')
    .replace(/Melee Attack Roll:/g, 'Tiro per colpire in mischia:')
    .replace(/Ranged Attack Roll:/g, 'Tiro per colpire a distanza:')
    .replace(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw: DC (\d+)/g, (_, a, dc) => `Tiro salvezza su ${ABILITY[a]}: CD ${dc}`)
    .replace(/, reach /g, ', portata ').replace(/, range /g, ', gittata ')
    .replace(/Failure or Success:/g, 'Fallimento o successo:').replace(/\bHit:/g, 'Colpito:').replace(/\bFailure:/g, 'Fallimento:').replace(/\bSuccess:/g, 'Successo:')
    .replace(/Failure or Success:/g, 'Fallimento o successo:').replace(/Half damage\.?/g, 'Metà danni.')
    .replace(/(\d+ \(\d+d\d+(?: [+-] \d+)?\)|\b\d+\b) ([A-Z][a-z]+) damage/g, (_, n, type) => `${n} ${damageWord(type)}`)
    .replace(/ plus /g, ' più ')
    .replace(/each creature in an? /g, 'ogni creatura in un ').replace(/one creature/g, 'una creatura').replace(/one target/g, 'un bersaglio')
    .replace(/\bCone\b/g, 'Cono').replace(/\bLine\b/g, 'Linea').replace(/\bSphere\b/g, 'Sfera').replace(/\bEmanation\b/g, 'Emanazione').replace(/\bCube\b/g, 'Cubo').replace(/\bCylinder\b/g, 'Cilindro')
    .replace(/has the (Blinded|Charmed|Deafened|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious) condition/g, (_, c) => `ha la condizione ${CONDITION[c.toLowerCase()]}`)
    .replace(/\(escape DC (\d+)\)/g, '(CD per sfuggire $1)')
    .replace(/Trigger:/g, 'Innesco:').replace(/Response:/g, 'Risposta:')
    .replace(/ if the attack roll had Advantage/g, ' se il tiro per colpire aveva Vantaggio')
    .replace(/^The [^.]*? makes (one|two|three|four|five|six) ([A-Z][\w’' -]*?) attacks?(?= |\.|,)/, (_, n, a) => `Effettua ${NUM[n]} attacc${n === 'one' ? 'o' : 'hi'} con ${actName(a)}`)
    .replace(/^The [^.]*? makes (one|two|three|four|five|six) attacks?/, (_, n) => `Effettua ${NUM[n]} attacc${n === 'one' ? 'o' : 'hi'}`)
    .replace(/^The [^.]*? moves up to half its Speed/, 'Si muove fino a metà della sua Velocità')
    .replace(/The [^.]*? can’t take this action again until the start of its next turn\./g, 'Non può ripetere questa azione fino all’inizio del suo prossimo turno.')
    .replace(/^The [^.]*? takes the (Disengage|Hide|Dash|Dodge)(?: or (Disengage|Hide|Dash|Dodge))? action\./, (_, a, b) => {
      const it: Record<string, string> = { Disengage: 'Disimpegno', Hide: 'Nascondersi', Dash: 'Scatto', Dodge: 'Schivata' };
      return `Effettua l’azione ${it[a]}${b ? ` o ${it[b]}` : ''}.`;
    })
    .replace(/^If the [^,]*? fails a saving throw, it can choose to succeed instead\./, 'Se fallisce un tiro salvezza, può scegliere di superarlo.')
    .replace(/^The [^.]*? casts one of the following spells, (?:requiring no (?:Material|Somatic or Material|Verbal, Somatic, or Material) components and )?using (\w+) as the spellcasting ability \(spell save DC (\d+)(?:, \+(\d+) to hit with spell attacks)?\):?/,
      (_, ab, dc, hit) => `Lancia uno dei seguenti incantesimi usando ${ABILITY[ab] || ab} come caratteristica da incantatore (CD ${dc}${hit ? `, +${hit} per colpire con gli incantesimi` : ''}):`)
    .replace(/ It can replace one attack with a use of Spellcasting to cast ([^.]+)\./, ' Può sostituire un attacco con un uso di Incantesimi per lanciare $1.');
  t = t
    .replace(/The [^.]*? uses Spellcasting to cast ([A-Z][\w’' ]+?)(?= \(|\.|,)/g, (_, n) => `Usa Incantesimi per lanciare ${spellName(n)}`)
    .replace(/^The [^.]*? casts ([A-Z][\w’' ]+?)(?= or | \(|\.|,)/, (_, n) => `Lancia ${spellName(n)}`)
    .replace(/ or ([A-Z][\w’' ]+?) in response to/, (_, n) => ` o ${spellName(n)} in risposta a`)
    .replace(/lanciare ([A-Z][\w’' ]+?)(?=\.|,| \()/g, (_, n) => `lanciare ${spellName(n)}`)
    .replace(/each creature in /g, 'ogni creatura in ').replace(/each creature within /g, 'ogni creatura entro ')
    .replace(/, using the same spellcasting ability as Spellcasting/g, ', con la stessa caratteristica da incantatore di Incantesimi')
    .replace(/, and the target /g, ', e il bersaglio ').replace(/ or range /g, ' o gittata ')
    .replace(/until the start of the [^’]+’s next turn/g, 'fino all’inizio del suo prossimo turno')
    .replace(/until the end of the [^’]+’s next turn/g, 'fino alla fine del suo prossimo turno')
    .replace(/\(level (\d) version\)/g, '(versione di $1° livello)');
  return t;
}

const cr = (value: number) => (value === 0.125 ? '1/8' : value === 0.25 ? '1/4' : value === 0.5 ? '1/2' : String(value));

interface RawAction { name: string; desc: string; attack_bonus?: number; damage?: any[]; dc?: any; usage?: any; spellcasting?: any }

const spellUsage = (u: any) => (!u ? '' : u.type === 'at will' ? 'a volontà' : u.type === 'per day' ? `${u.times}/giorno` : u.type);

function action(a: RawAction) {
  // Danni con condizione ("plus 2 (1d4) Slashing damage if the attack roll had Advantage"): non si sommano al colpo
  const conditional = Array.from(a.desc.matchAll(/\((\d+d\d+(?: [+-] \d+)?)\) (\w+) damage if ([^.—]+)/g), mm => ({ dice: mm[1].replace(/\s+/g, ''), type: mm[2].toLowerCase(), cond: mm[3] }));
  const condText = (c: string) => (/had Advantage/.test(c) ? 'con Vantaggio'
    : /is Bloodied/.test(c) ? (/the target/.test(c) ? 'se il bersaglio è Sanguinante' : 'se è Sanguinante')
      : /moved (\d+)\+ feet straight toward/.test(c) ? `dopo una carica di ${m(+c.match(/moved (\d+)/)![1])}+ metri`
        : /is Grappled/.test(c) ? 'se il bersaglio è Afferrato'
          : translateText(`se ${c}`));
  const damage = (a.damage || []).flatMap((d: any) => {
    if (!d.damage_dice) return [];
    const dice = String(d.damage_dice).replace(/\s+/g, '');
    const type = d.damage_type?.index || '';
    const cond = conditional.find(c => c.dice === dice && c.type === type);
    return [{ dice, type: DAMAGE[type] || d.damage_type?.name || '', ...(cond ? { condition: condText(cond.cond) } : {}) }];
  });
  const usage = a.usage?.type === 'recharge on roll' ? `Ricarica ${a.usage.min_value}${a.usage.min_value < 6 ? '–6' : ''}`
    : a.usage?.type === 'per day' ? `${a.usage.times}/giorno${a.usage.times_in_lair ? ` (${a.usage.times_in_lair} nella tana)` : ''}`
      : a.usage?.type === 'at will' ? 'A volontà' : undefined;
  // I nomi di incantesimi citati nel testo diventano quelli italiani
  const desc = translateText(a.desc);
  return {
    name: ACTION_NAMES_IT[a.name] || a.name,
    desc,
    ...(typeof a.attack_bonus === 'number' ? { attack: a.attack_bonus } : {}),
    ...(damage.length ? { damage } : {}),
    ...(a.dc?.dc_value ? { save: { ability: ABILITY_KEY[a.dc.dc_type?.name] || a.dc.dc_type?.name, dc: a.dc.dc_value } } : {}),
    ...(usage ? { usage } : {}),
    ...(a.spellcasting?.spells?.length ? { spells: a.spellcasting.spells.map((sp: any) => `${spellName(sp.name)}${sp.usage ? ` (${spellUsage(sp.usage)})` : ''}`) } : {}),
  };
}

async function main() {
  const path = process.argv[2];
  const raw: any[] = path ? JSON.parse(readFileSync(path, 'utf8')) : await (await fetch(SOURCE)).json();
  const missing: string[] = [];
  const out = raw.map(mon => {
    if (!MONSTER_NAMES_IT[mon.name]) missing.push(mon.name);
    const saves: Record<string, number> = {};
    const skills: Record<string, number> = {};
    (mon.proficiencies || []).forEach((p: any) => {
      const n: string = p.proficiency?.name || '';
      if (n.startsWith('Saving Throw: ')) saves[n.slice(14)] = p.value;
      else if (n.startsWith('Skill: ')) skills[SKILL[n.slice(7)] || n.slice(7)] = p.value;
    });
    const speed = Object.entries(mon.speed || {}).filter(([k]) => k !== 'hover').map(([k, v]) => {
      const feet = parseInt(String(v), 10);
      const label = SPEED[k] ?? k;
      return `${label ? `${label} ` : ''}${Number.isFinite(feet) ? `${m(feet)} m` : v}${k === 'fly' && mon.speed.hover ? ' (fluttuare)' : ''}`;
    }).join(', ');
    const senses = Object.entries(mon.senses || {}).filter(([k]) => k !== 'passive_perception').map(([k, v]) => { const ft = parseInt(String(v), 10); return `${SENSE[k] || k} ${Number.isFinite(ft) ? `${m(ft)} m` : v}`; });
    const legendary = (mon.legendary_actions || []).map(action);
    const languages = String(mon.languages || '—').split(/(,\s*|\s+)/).map((w: string) => LANGUAGE[w] ?? w).join('');
    return {
      id: mon.index,
      name: MONSTER_NAMES_IT[mon.name] || mon.name,
      nameEn: mon.name,
      size: SIZE[mon.size] || mon.size,
      type: TYPE[mon.type] || mon.type,
      alignment: ALIGN[mon.alignment] || mon.alignment,
      ac: mon.armor_class?.[0]?.value ?? 10,
      hp: mon.hit_points,
      hpRoll: String(mon.hit_points_roll || mon.hit_dice || '').replace(/\s+/g, ''),
      speed,
      abilities: { STR: mon.strength, DEX: mon.dexterity, CON: mon.constitution, INT: mon.intelligence, WIS: mon.wisdom, CHA: mon.charisma },
      ...(Object.keys(saves).length ? { saves } : {}),
      ...(Object.keys(skills).length ? { skills } : {}),
      ...(mon.damage_vulnerabilities?.length ? { vulnerabilities: mon.damage_vulnerabilities.map((d: string) => DAMAGE[d] || d) } : {}),
      ...(mon.damage_resistances?.length ? { resistances: mon.damage_resistances.map((d: string) => DAMAGE[d] || d) } : {}),
      ...(mon.damage_immunities?.length ? { immunities: mon.damage_immunities.map((d: string) => DAMAGE[d] || d) } : {}),
      ...(mon.condition_immunities?.length ? { conditionImmunities: mon.condition_immunities.map((c: any) => CONDITION[c.index] || c.name) } : {}),
      senses: [...senses, `Percezione passiva ${mon.senses?.passive_perception ?? 10}`].join(', '),
      languages,
      cr: cr(mon.challenge_rating),
      xp: mon.xp,
      ...(mon.xp_in_lair ? { xpLair: mon.xp_in_lair } : {}),
      pb: mon.proficiency_bonus,
      ...(mon.special_abilities?.length ? { traits: mon.special_abilities.map(action) } : {}),
      actions: (mon.actions || []).map(action),
      ...(mon.bonus_actions?.length ? { bonusActions: mon.bonus_actions.map(action) } : {}),
      ...(mon.reactions?.length ? { reactions: mon.reactions.map(action) } : {}),
      // PHB/MM 2024: 3 azioni leggendarie per round, 4 se il mostro combatte nella sua tana
      ...(legendary.length ? { legendary: { uses: 3, usesInLair: mon.xp_in_lair ? 4 : 3, actions: legendary } } : {}),
    };
  });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`${out.length} mostri scritti in public/data/bestiary.json`);
  if (missing.length) console.log('Nomi senza traduzione:', missing.join(', '));
}

main();
