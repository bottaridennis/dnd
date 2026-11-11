/**
 * Privilegi di sottoclasse (PHB 2024) per livello di classe e incantesimi sempre preparati.
 * Le chiavi corrispondono ai nomi in subclasses.ts; gli incantesimi usano il nome inglese
 * del database (RAW_SPELLS.name) così da collegarsi alle schede degli incantesimi.
 */
export interface SubclassInfo {
  features: Record<number, string[]>;
  /** Livello di classe → incantesimi sempre preparati ottenuti a quel livello */
  spells?: Record<number, string[]>;
}

export const SUBCLASS_DATA: Record<string, SubclassInfo> = {
  // Barbaro
  "Cammino dell'Albero del Mondo": { features: { 3: ["Vitalità dell'Albero"], 6: ["Rami dell'Albero"], 10: ['Radici Battenti'], 14: ["Viaggio lungo l'Albero"] } },
  'Cammino del Berserker': { features: { 3: ['Frenesia'], 6: ['Ira Incurante'], 10: ['Ritorsione'], 14: ['Presenza Intimidatoria'] } },
  'Cammino del Cuore Selvaggio': { features: { 3: ['Interprete degli Animali', 'Ira della Natura Selvaggia'], 6: ['Aspetto della Natura Selvaggia'], 10: ['Interprete della Natura'], 14: ['Potere della Natura Selvaggia'] } },
  'Cammino dello Zelota': { features: { 3: ['Furia Divina', 'Guerriero degli Dei'], 6: ['Concentrazione Fanatica'], 10: ['Presenza Zelante'], 14: ['Ira degli Dei'] } },
  // Bardo
  'Collegio della Danza': { features: { 3: ['Passo Abbagliante'], 6: ['Movimento Ispirato', 'Passo in Tandem'], 14: ['Evasione Guidata'] } },
  'Collegio del Fascino': { features: { 3: ["Mantello d'Ispirazione", 'Spettacolo Ammaliante'], 6: ['Mantello di Maestà'], 14: ['Maestà Infrangibile'] } },
  'Collegio della Sapienza': { features: { 3: ['Competenze Bonus', 'Parole Taglienti'], 6: ['Segreti Magici Aggiuntivi'], 14: ['Abilità Impareggiabile'] } },
  'Collegio del Valore': { features: { 3: ['Ispirazione in Combattimento', 'Addestramento Marziale'], 6: ['Attacco Extra'], 14: ['Magia da Battaglia'] } },
  // Chierico
  'Dominio della Vita': {
    features: { 3: ['Discepolo della Vita', 'Preservare la Vita'], 6: ['Guaritore Benedetto'], 17: ['Guarigione Suprema'] },
    spells: { 3: ['Aid', 'Bless', 'Cure Wounds', 'Lesser Restoration'], 5: ['Mass Healing Word', 'Revivify'], 7: ['Aura of Life', 'Death Ward'], 9: ['Greater Restoration', 'Mass Cure Wounds'] },
  },
  'Dominio della Luce': {
    features: { 3: ['Lampo Protettivo', "Radiosità dell'Alba"], 6: ['Lampo Migliorato'], 17: ['Corona di Luce'] },
    spells: { 3: ['Burning Hands', 'Faerie Fire', 'Scorching Ray', 'See Invisibility'], 5: ['Daylight', 'Fireball'], 7: ['Arcane Eye', 'Wall of Fire'], 9: ['Flame Strike', 'Scrying'] },
  },
  "Dominio dell'Inganno": {
    features: { 3: ["Benedizione dell'Ingannatore", 'Invocare Duplicato'], 6: ["Passi dell'Ingannatore"], 17: ['Duplicato Migliorato'] },
    spells: { 3: ['Charm Person', 'Disguise Self', 'Invisibility', 'Pass without Trace'], 5: ['Hypnotic Pattern', 'Nondetection'], 7: ['Confusion', 'Dimension Door'], 9: ['Dominate Person', 'Modify Memory'] },
  },
  'Dominio della Guerra': {
    features: { 3: ['Colpo Guidato', 'Sacerdote della Guerra'], 6: ['Benedizione del Dio della Guerra'], 17: ['Avatar di Battaglia'] },
    spells: { 3: ['Guiding Bolt', 'Magic Weapon', 'Shield of Faith', 'Spiritual Weapon'], 5: ["Crusader's Mantle", 'Spirit Guardians'], 7: ['Fire Shield', 'Freedom of Movement'], 9: ['Hold Monster', 'Steel Wind Strike'] },
  },
  // Druido
  'Circolo della Terra': { features: { 3: ['Incantesimi del Circolo (secondo il terreno)', 'Aiuto della Terra'], 6: ['Recupero Naturale'], 10: ['Protezione della Natura'], 14: ['Santuario della Natura'] } },
  'Circolo della Luna': {
    features: { 3: ['Forme del Circolo', 'Incantesimi del Circolo'], 6: ['Forme del Circolo Migliorate'], 10: ['Passo Lunare'], 14: ['Forma Lunare'] },
    spells: { 3: ['Cure Wounds', 'Moonbeam', 'Starry Wisp'], 5: ['Conjure Animals'], 7: ['Fount of Moonlight'], 9: ['Mass Cure Wounds'] },
  },
  'Circolo del Mare': {
    features: { 3: ['Ira del Mare', 'Incantesimi del Circolo'], 6: ['Affinità Acquatica'], 10: ['Nato dalla Tempesta'], 14: ['Dono Oceanico'] },
    spells: { 3: ['Fog Cloud', 'Gust of Wind', 'Ray of Frost', 'Shatter', 'Thunderwave'], 5: ['Lightning Bolt', 'Water Breathing'], 7: ['Control Water', 'Ice Storm'], 9: ['Conjure Elemental', 'Hold Monster'] },
  },
  'Circolo delle Stelle': {
    features: { 3: ['Mappa Stellare', 'Forma Stellata'], 6: ['Presagio Cosmico'], 10: ['Costellazioni Scintillanti'], 14: ['Pieno di Stelle'] },
    spells: { 3: ['Guidance', 'Guiding Bolt'] },
  },
  // Guerriero
  'Maestro di Battaglia': { features: { 3: ['Superiorità in Combattimento (4 dadi d8)', 'Studioso della Guerra'], 7: ['Conosci il Nemico'], 10: ['Superiorità Migliorata (d10)'], 15: ['Implacabile'], 18: ['Superiorità Suprema (d12)'] } },
  'Campione': { features: { 3: ['Critico Migliorato (19-20)', 'Atleta Notevole'], 7: ['Stile di Combattimento Aggiuntivo'], 10: ['Guerriero Eroico'], 15: ['Critico Superiore (18-20)'], 18: ['Sopravvissuto'] } },
  'Cavaliere Arcano': { features: { 3: ['Incantesimi', "Legame con l'Arma"], 7: ['Magia da Guerra'], 10: ['Colpo Mistico'], 15: ['Carica Arcana'], 18: ['Magia da Guerra Migliorata'] } },
  'Guerriero Psionico': { features: { 3: ['Potere Psionico'], 7: ['Adepto Telecinetico'], 10: ['Mente Protetta'], 15: ['Baluardo di Forza'], 18: ['Maestro Telecinetico'] } },
  // Monaco
  'Via della Mano Aperta': { features: { 3: ['Tecnica della Mano Aperta'], 6: ['Integrità del Corpo'], 11: ['Passo Rapido'], 17: ['Palmo Tremante'] } },
  'Via degli Elementi': { features: { 3: ['Sintonia Elementale', 'Manipolare Elementi'], 6: ['Esplosione Elementale'], 11: ['Passo degli Elementi'], 17: ['Epitome Elementale'] } },
  "Via dell'Ombra": { features: { 3: ["Arti dell'Ombra"], 6: ["Passo d'Ombra"], 11: ["Passo d'Ombra Migliorato"], 17: ['Manto di Ombre'] } },
  'Via della Misericordia': { features: { 3: ['Mano del Danno', 'Mano della Guarigione', 'Strumenti della Misericordia'], 6: ['Tocco del Medico'], 11: ['Raffica di Guarigione e Danno'], 17: ['Mano della Misericordia Suprema'] } },
  // Paladino
  'Giuramento di Devozione': {
    features: { 3: ['Arma Sacra'], 7: ['Aura di Devozione'], 15: ['Colpo Purificante'], 20: ['Nimbo Sacro'] },
    spells: { 3: ['Protection from Evil and Good', 'Shield of Faith'], 5: ['Aid', 'Zone of Truth'], 9: ['Beacon of Hope', 'Dispel Magic'], 13: ['Freedom of Movement', 'Guardian of Faith'], 17: ['Commune', 'Flame Strike'] },
  },
  'Giuramento di Gloria': {
    features: { 3: ['Atleta Ineguagliato', 'Colpo Ispirante'], 7: ['Aura di Alacrità'], 15: ['Difesa Gloriosa'], 20: ['Leggenda Vivente'] },
    spells: { 3: ['Guiding Bolt', 'Heroism'], 5: ['Enhance Ability', 'Magic Weapon'], 9: ['Haste', 'Protection from Energy'], 13: ['Compulsion', 'Freedom of Movement'], 17: ['Legend Lore', "Yolande's Regal Presence"] },
  },
  'Giuramento degli Antichi': {
    features: { 3: ['Ira della Natura'], 7: ['Aura di Custodia'], 15: ['Sentinella Immortale'], 20: ['Campione Antico'] },
    spells: { 3: ['Ensnaring Strike', 'Speak with Animals'], 5: ['Misty Step', 'Moonbeam'], 9: ['Plant Growth', 'Protection from Energy'], 13: ['Ice Storm', 'Stoneskin'], 17: ['Commune with Nature', 'Tree Stride'] },
  },
  'Giuramento di Vendetta': {
    features: { 3: ['Voto di Inimicizia'], 7: ['Vendicatore Implacabile'], 15: ['Anima della Vendetta'], 20: ['Angelo Vendicatore'] },
    spells: { 3: ['Bane', "Hunter's Mark"], 5: ['Hold Person', 'Misty Step'], 9: ['Haste', 'Protection from Energy'], 13: ['Banishment', 'Dimension Door'], 17: ['Hold Monster', 'Scrying'] },
  },
  // Ranger
  'Signore delle Bestie': { features: { 3: ['Compagno Primordiale'], 7: ['Addestramento Eccezionale'], 11: ['Furia Bestiale'], 15: ['Condividere Incantesimi'] } },
  'Viandante Fatato': {
    features: { 3: ['Colpi Terribili', 'Fascino Ultraterreno'], 7: ['Svolta Seducente'], 11: ['Rinforzi Fatati'], 15: ['Viandante Nebbioso'] },
    spells: { 3: ['Charm Person'], 5: ['Misty Step'], 9: ['Summon Fey'], 13: ['Dimension Door'], 17: ['Mislead'] },
  },
  "Predatore dell'Ombra": {
    features: { 3: ['Agguato Terrificante', 'Vista Umbratile'], 7: ['Mente di Ferro'], 11: ['Raffica del Predatore'], 15: ['Schivata Ombrosa'] },
    spells: { 3: ['Disguise Self'], 5: ['Rope Trick'], 9: ['Fear'], 13: ['Greater Invisibility'], 17: ['Seeming'] },
  },
  'Cacciatore': { features: { 3: ['Preda del Cacciatore', 'Conoscenza del Cacciatore'], 7: ['Tattiche Difensive'], 11: ['Preda Superiore'], 15: ['Difesa Superiore del Cacciatore'] } },
  // Ladro
  'Mistificatore Arcano': { features: { 3: ['Incantesimi', 'Mano Magica Ingannatrice'], 9: ['Imboscata Magica'], 13: ['Mistificatore Versatile'], 17: ['Ladro di Incantesimi'] } },
  'Assassino': { features: { 3: ['Assassinare', "Attrezzi dell'Assassino"], 9: ["Specialista dell'Infiltrazione"], 13: ['Armi Avvelenate'], 17: ['Colpo Mortale'] } },
  'Lama Spirituale': { features: { 3: ['Poteri Psionici', 'Lame Psichiche'], 9: ["Lame dell'Anima"], 13: ['Velo Psichico'], 17: ['Squarciare la Mente'] } },
  'Ladro': { features: { 3: ['Mani Veloci', 'Lavoro da Secondo Piano'], 9: ['Furtività Suprema'], 13: ['Usare Oggetti Magici'], 17: ['Riflessi del Ladro'] } },
  // Stregone
  'Stregoneria Aberrante': {
    features: { 3: ['Incantesimi Psionici', 'Parlare Telepatico'], 6: ['Difese Psioniche', 'Stregoneria Psionica'], 14: ['Rivelazione nella Carne'], 18: ['Implosione Distorcente'] },
    spells: { 3: ['Arms of Hadar', 'Calm Emotions', 'Detect Thoughts', 'Dissonant Whispers', 'Mind Sliver'], 5: ['Hunger of Hadar', 'Sending'], 7: ['Black Tentacles', 'Summon Aberration'], 9: ['Telepathic Bond', 'Telekinesis'] },
  },
  'Stregoneria Meccanica': {
    features: { 3: ['Incantesimi Meccanici', "Ripristinare l'Equilibrio"], 6: ['Bastione della Legge'], 14: ["Trance dell'Ordine"], 18: ['Cavalcata Meccanica'] },
    spells: { 3: ['Aid', 'Alarm', 'Lesser Restoration', 'Protection from Evil and Good'], 5: ['Dispel Magic', 'Protection from Energy'], 7: ['Freedom of Movement', 'Summon Construct'], 9: ['Greater Restoration', 'Wall of Force'] },
  },
  'Stregoneria Draconica': {
    features: { 3: ['Resilienza Draconica', 'Incantesimi Draconici'], 6: ['Affinità Elementale'], 14: ['Ali di Drago'], 18: ['Compagno Draconico'] },
    spells: { 3: ['Alter Self', 'Chromatic Orb', 'Command', "Dragon's Breath"], 5: ['Fear', 'Fly'], 7: ['Arcane Eye', 'Charm Monster'], 9: ['Legend Lore', 'Summon Dragon'] },
  },
  'Magia Selvaggia': { features: { 3: ['Impulso di Magia Selvaggia', 'Maree del Caos'], 6: ['Piegare la Fortuna'], 14: ['Caos Controllato'], 18: ['Impulso Domato'] } },
  // Warlock
  'Patrono Arcifolletto': {
    features: { 3: ['Passi della Fata', 'Incantesimi del Patrono'], 6: ['Fuga Nebbiosa'], 10: ['Difese Seducenti'], 14: ['Magia Ammaliante'] },
    spells: { 3: ['Calm Emotions', 'Faerie Fire', 'Misty Step', 'Phantasmal Force', 'Sleep'], 5: ['Blink', 'Plant Growth'], 7: ['Dominate Beast', 'Greater Invisibility'], 9: ['Dominate Person', 'Seeming'] },
  },
  'Patrono Celestiale': {
    features: { 3: ['Luce Guaritrice', 'Incantesimi del Patrono'], 6: ['Anima Radiosa'], 10: ['Resilienza Celestiale'], 14: ['Vendetta Ardente'] },
    spells: { 3: ['Aid', 'Cure Wounds', 'Guiding Bolt', 'Lesser Restoration', 'Light', 'Sacred Flame'], 5: ['Daylight', 'Revivify'], 7: ['Guardian of Faith', 'Wall of Fire'], 9: ['Greater Restoration', 'Summon Celestial'] },
  },
  'Patrono Immondo': {
    features: { 3: ["Benedizione dell'Oscuro", 'Incantesimi del Patrono'], 6: ["Fortuna dell'Oscuro"], 10: ['Resilienza Immonda'], 14: ["Scagliare all'Inferno"] },
    spells: { 3: ['Burning Hands', 'Command', 'Scorching Ray', 'Suggestion'], 5: ['Fireball', 'Stinking Cloud'], 7: ['Fire Shield', 'Wall of Fire'], 9: ['Geas', 'Insect Plague'] },
  },
  'Patrono del Grande Antico': {
    features: { 3: ['Mente Risvegliata', 'Incantesimi Psichici', 'Incantesimi del Patrono'], 6: ['Combattente Chiaroveggente'], 10: ['Scudo Mentale'], 14: ['Creare Servitore'] },
    spells: { 3: ['Detect Thoughts', 'Dissonant Whispers', 'Phantasmal Force', 'Hideous Laughter'], 5: ['Clairvoyance', 'Hunger of Hadar'], 7: ['Confusion', 'Summon Aberration'], 9: ['Modify Memory', 'Telekinesis'] },
  },
  // Mago
  'Abiuratore': { features: { 3: ["Studioso dell'Abiurazione", 'Interdizione Arcana'], 6: ['Interdizione Proiettata'], 10: ['Rompincantesimi'], 14: ['Resistenza agli Incantesimi'] } },
  'Divinatore': { features: { 3: ['Studioso della Divinazione', 'Presagio'], 6: ['Divinazione Esperta'], 10: ['Il Terzo Occhio'], 14: ['Presagio Superiore'] } },
  'Evocatore': { features: { 3: ["Studioso dell'Invocazione", 'Trucchetto Potente'], 6: ['Scolpire Incantesimi'], 10: ['Invocazione Potenziata'], 14: ['Sovraccarico'] } },
  'Illusionista': { features: { 3: ["Studioso dell'Illusione", 'Illusioni Migliorate'], 6: ['Creature Fantasma'], 10: ['Autoillusione'], 14: ['Realtà Illusoria'] } },
};

export function getSubclassFeaturesUpTo(subclass: string | undefined, classLevel: number): { level: number; name: string }[] {
  const info = subclass ? SUBCLASS_DATA[subclass] : undefined;
  if (!info) return [];
  return Object.entries(info.features)
    .filter(([lvl]) => Number(lvl) <= classLevel)
    .flatMap(([lvl, names]) => names.map(name => ({ level: Number(lvl), name })));
}

export function getSubclassSpells(subclass: string | undefined, classLevel: number): string[] {
  const info = subclass ? SUBCLASS_DATA[subclass] : undefined;
  if (!info?.spells) return [];
  return Object.entries(info.spells).filter(([lvl]) => Number(lvl) <= classLevel).flatMap(([, spells]) => spells);
}
