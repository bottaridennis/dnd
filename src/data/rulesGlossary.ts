/**
 * Compendio rapido delle regole 2024 (Manuale del Giocatore 2024 / SRD 5.2), riassunte in italiano
 * per la consultazione al tavolo. Non sostituisce il manuale.
 */

export type RuleCategory = 'Condizioni' | 'Azioni' | 'Combattimento' | 'Maestrie delle armi' | 'Salute e riposo' | 'Ambiente';

export interface RuleEntry {
  id: string;
  name: string;
  category: RuleCategory;
  /** Riassunto in punti */
  points: string[];
  /** Altri nomi con cui cercarla */
  aliases?: string[];
}

export const RULE_CATEGORIES: RuleCategory[] = ['Condizioni', 'Azioni', 'Combattimento', 'Maestrie delle armi', 'Salute e riposo', 'Ambiente'];

export const RULES: RuleEntry[] = [
  // ---------------- Condizioni
  { id: 'accecato', name: 'Accecato', category: 'Condizioni', aliases: ['blinded'], points: [
    'Non puoi vedere e fallisci automaticamente le prove che richiedono la vista.',
    'I tiri per colpire contro di te hanno Vantaggio; i tuoi tiri per colpire hanno Svantaggio.'] },
  { id: 'affascinato', name: 'Affascinato', category: 'Condizioni', aliases: ['charmed'], points: [
    'Non puoi attaccare chi ti ha affascinato né bersagliarlo con capacità o effetti magici dannosi.',
    'Chi ti ha affascinato ha Vantaggio alle prove di caratteristica per interagire socialmente con te.'] },
  { id: 'afferrato', name: 'Afferrato', category: 'Condizioni', aliases: ['grappled', 'lotta'], points: [
    'La tua Velocità è 0 e non può aumentare.',
    'Hai Svantaggio ai tiri per colpire contro bersagli diversi da chi ti afferra.',
    'Chi ti afferra può trascinarti: ogni metro gli costa un metro extra di movimento (a meno che tu sia Minuscolo o di due taglie più piccolo).',
    'Per liberarti usi un’azione: prova di Forza (Atletica) o Destrezza (Acrobazia) contro la CD per sfuggire.'] },
  { id: 'assordato', name: 'Assordato', category: 'Condizioni', aliases: ['deafened'], points: ['Non puoi sentire e fallisci automaticamente le prove che richiedono l’udito.'] },
  { id: 'avvelenato', name: 'Avvelenato', category: 'Condizioni', aliases: ['poisoned'], points: ['Hai Svantaggio ai tiri per colpire e alle prove di caratteristica.'] },
  { id: 'esaurimento', name: 'Esaurimento', category: 'Condizioni', aliases: ['exhaustion', 'indebolimento', 'sfinimento'], points: [
    'È cumulativo in livelli da 1 a 6.',
    'Ogni livello sottrae 2 a tutti i tuoi Test del d20 (tiri per colpire, prove, tiri salvezza) e riduce la Velocità di 1,5 metri.',
    'Al 6° livello muori.',
    'Un Riposo Lungo completato rimuove un livello.'] },
  { id: 'immobilizzato', name: 'Immobilizzato', category: 'Condizioni', aliases: ['restrained', 'trattenuto'], points: [
    'La tua Velocità è 0 e non può aumentare.',
    'I tiri per colpire contro di te hanno Vantaggio; i tuoi hanno Svantaggio.',
    'Hai Svantaggio ai tiri salvezza su Destrezza.'] },
  { id: 'incapacitato', name: 'Incapacitato', category: 'Condizioni', aliases: ['incapacitated'], points: [
    'Non puoi effettuare azioni, Azioni Bonus né Reazioni, e non puoi parlare.',
    'La tua Concentrazione si interrompe.',
    'Se sei Incapacitato quando tiri l’Iniziativa, hai Svantaggio.'] },
  { id: 'invisibile', name: 'Invisibile', category: 'Condizioni', aliases: ['invisible'], points: [
    'Hai Vantaggio al tiro di Iniziativa.',
    'Non sei influenzato da effetti che richiedono di vedere il bersaglio, a meno che chi li crea possa vederti; anche ciò che indossi o trasporti è celato.',
    'I tiri per colpire contro di te hanno Svantaggio e i tuoi hanno Vantaggio, a meno che l’altra creatura possa vederti.'] },
  { id: 'paralizzato', name: 'Paralizzato', category: 'Condizioni', aliases: ['paralyzed'], points: [
    'Sei Incapacitato e la tua Velocità è 0.',
    'Fallisci automaticamente i tiri salvezza su Forza e Destrezza.',
    'I tiri per colpire contro di te hanno Vantaggio; ogni colpo da un attaccante entro 1,5 metri è un Colpo Critico.'] },
  { id: 'pietrificato', name: 'Pietrificato', category: 'Condizioni', aliases: ['petrified'], points: [
    'Diventi una sostanza solida inanimata (di solito pietra); il peso aumenta di dieci volte e smetti di invecchiare.',
    'Sei Incapacitato, la Velocità è 0 e fallisci i tiri salvezza su Forza e Destrezza.',
    'I tiri per colpire contro di te hanno Vantaggio.',
    'Hai Resistenza a tutti i danni e sei immune alla condizione Avvelenato.'] },
  { id: 'privo_di_sensi', name: 'Privo di Sensi', category: 'Condizioni', aliases: ['unconscious', 'incosciente'], points: [
    'Sei Incapacitato e Prono e lasci cadere ciò che impugni; non sei consapevole di ciò che ti circonda.',
    'La tua Velocità è 0 e fallisci i tiri salvezza su Forza e Destrezza.',
    'I tiri per colpire contro di te hanno Vantaggio; ogni colpo da un attaccante entro 1,5 metri è un Colpo Critico.'] },
  { id: 'prono', name: 'Prono', category: 'Condizioni', aliases: ['prone', 'a terra'], points: [
    'Puoi solo strisciare (ogni metro costa un metro extra) oppure rialzarti spendendo metà della tua Velocità.',
    'Hai Svantaggio ai tiri per colpire.',
    'I tiri per colpire contro di te hanno Vantaggio se l’attaccante è entro 1,5 metri, altrimenti Svantaggio.'] },
  { id: 'spaventato', name: 'Spaventato', category: 'Condizioni', aliases: ['frightened', 'paura'], points: [
    'Hai Svantaggio a prove e tiri per colpire finché la fonte della paura è nella tua linea di vista.',
    'Non puoi avvicinarti volontariamente alla fonte della paura.'] },
  { id: 'stordito', name: 'Stordito', category: 'Condizioni', aliases: ['stunned'], points: [
    'Sei Incapacitato.',
    'Fallisci automaticamente i tiri salvezza su Forza e Destrezza.',
    'I tiri per colpire contro di te hanno Vantaggio.'] },

  // ---------------- Azioni
  { id: 'azione-attacco', name: 'Attacco', category: 'Azioni', aliases: ['attack'], points: [
    'Effettui un attacco con un’arma o un Colpo Senz’Armi (anche per lottare o spingere).',
    'Con Attacco Extra effettui più attacchi con la stessa azione e puoi muoverti tra un attacco e l’altro.'] },
  { id: 'azione-aiuto', name: 'Aiuto', category: 'Azioni', aliases: ['help'], points: [
    'Aiuti un alleato in una prova con un’abilità o uno strumento in cui sei competente: ha Vantaggio alla prossima prova di quel tipo prima del tuo prossimo turno.',
    'Oppure distrai un nemico entro 1,5 metri: il prossimo tiro per colpire di un alleato contro di lui ha Vantaggio.'] },
  { id: 'azione-cercare', name: 'Cercare', category: 'Azioni', aliases: ['search'], points: ['Prova di Saggezza (Intuizione, Medicina, Percezione o Sopravvivenza) per notare qualcosa di non evidente.'] },
  { id: 'azione-disimpegno', name: 'Disimpegno', category: 'Azioni', aliases: ['disengage'], points: ['Per il resto del turno il tuo movimento non provoca Attacchi di Opportunità.'] },
  { id: 'azione-influenzare', name: 'Influenzare', category: 'Azioni', aliases: ['influence'], points: [
    'Cerchi di cambiare l’atteggiamento di una creatura: prova di Carisma (Inganno, Intimidire, Intrattenere o Persuasione) o di Saggezza (Addestrare Animali).',
    'Il Master decide in base all’atteggiamento (amichevole, indifferente, ostile) se serve una prova.'] },
  { id: 'azione-magia', name: 'Magia', category: 'Azioni', aliases: ['magic', 'lanciare incantesimo'], points: ['Lanci un incantesimo con tempo di lancio di un’azione, usi un oggetto magico o un privilegio magico.'] },
  { id: 'azione-nascondersi', name: 'Nascondersi', category: 'Azioni', aliases: ['hide'], points: [
    'Devi essere Pesantemente Oscurato o dietro Copertura tre quarti o totale, fuori dalla vista dei nemici.',
    'Prova di Destrezza (Furtività) CD 15: se riesci hai la condizione Invisibile e il risultato diventa la CD per trovarti.',
    'Smetti di essere nascosto se fai rumore, attacchi, lanci un incantesimo con componente Verbale o vieni trovato.'] },
  { id: 'azione-preparare', name: 'Preparare', category: 'Azioni', aliases: ['ready'], points: [
    'Scegli un innesco percepibile e un’azione (o un movimento): quando accade, usi la Reazione per eseguirla.',
    'Preparare un incantesimo richiede di lanciarlo subito e mantenerlo con la Concentrazione fino all’innesco.'] },
  { id: 'azione-scatto', name: 'Scatto', category: 'Azioni', aliases: ['dash'], points: ['Ottieni movimento extra pari alla tua Velocità (con i modificatori) per questo turno.'] },
  { id: 'azione-schivata', name: 'Schivata', category: 'Azioni', aliases: ['dodge'], points: [
    'Fino all’inizio del tuo prossimo turno i tiri per colpire contro di te hanno Svantaggio (se vedi l’attaccante) e hai Vantaggio ai tiri salvezza su Destrezza.',
    'Perdi il beneficio se diventi Incapacitato o la tua Velocità scende a 0.'] },
  { id: 'azione-studiare', name: 'Studiare', category: 'Azioni', aliases: ['study'], points: ['Prova di Intelligenza (Arcano, Indagare, Natura, Religione o Storia) per ricordare o analizzare qualcosa.'] },
  { id: 'azione-utilizzare', name: 'Utilizzare', category: 'Azioni', aliases: ['utilize', 'usare oggetto'], points: ['Usi un oggetto non magico che richiede un’azione (ad esempio aprire una serratura con gli arnesi o bere una pozione da solo, se il Master non la considera Azione Bonus).'] },

  // ---------------- Combattimento
  { id: 'azione-bonus', name: 'Azione Bonus', category: 'Combattimento', aliases: ['bonus action'], points: ['Al massimo una per turno, solo se un privilegio, un incantesimo o un’altra regola te la concede.'] },
  { id: 'reazione', name: 'Reazione', category: 'Combattimento', aliases: ['reaction'], points: ['Una risposta immediata a un innesco, anche nel turno di altri. Ne hai una e la recuperi all’inizio del tuo turno.'] },
  { id: 'attacco-opportunita', name: 'Attacco di Opportunità', category: 'Combattimento', aliases: ['opportunity attack'], points: [
    'Quando una creatura che puoi vedere esce dalla tua portata, puoi usare la Reazione per un attacco in mischia contro di lei.',
    'Non lo provoca chi usa Disimpegno, chi viene teletrasportato o spostato senza usare il proprio movimento.'] },
  { id: 'vantaggio', name: 'Vantaggio e Svantaggio', category: 'Combattimento', aliases: ['advantage', 'disadvantage'], points: [
    'Con Vantaggio tiri due d20 e tieni il più alto; con Svantaggio il più basso.',
    'Più fonti non si sommano; se hai sia Vantaggio sia Svantaggio si annullano.'] },
  { id: 'critico', name: 'Colpo Critico', category: 'Combattimento', aliases: ['critical hit', '20 naturale'], points: [
    'Un 20 naturale al tiro per colpire colpisce sempre ed è un Colpo Critico: tira due volte i dadi di danno dell’attacco e aggiungi i modificatori una volta sola.',
    'Un 1 naturale manca sempre.'] },
  { id: 'copertura', name: 'Copertura', category: 'Combattimento', aliases: ['cover'], points: [
    'Mezza copertura: +2 a CA e tiri salvezza su Destrezza.',
    'Copertura tre quarti: +5 a CA e tiri salvezza su Destrezza.',
    'Copertura totale: non puoi essere bersagliato direttamente.'] },
  { id: 'concentrazione', name: 'Concentrazione', category: 'Combattimento', aliases: ['concentration'], points: [
    'Puoi concentrarti su un solo incantesimo alla volta; lanciarne un altro a concentrazione termina il primo.',
    'Quando subisci danni fai un tiro salvezza su Costituzione con CD 10 o metà del danno (il più alto, massimo 30).',
    'La Concentrazione termina anche se diventi Incapacitato o muori.'] },
  { id: 'lottare', name: 'Lottare', category: 'Combattimento', aliases: ['grapple', 'afferrare'], points: [
    'Al posto di un Colpo Senz’Armi: il bersaglio (al massimo di una taglia più grande) fa un tiro salvezza su Forza o Destrezza (a sua scelta) con CD 8 + modificatore di Forza + bonus di competenza.',
    'Se fallisce ha la condizione Afferrato; ti serve una mano libera.'] },
  { id: 'spingere', name: 'Spingere', category: 'Combattimento', aliases: ['shove'], points: ['Al posto di un Colpo Senz’Armi: stesso tiro salvezza della lotta; se fallisce, il bersaglio viene spinto di 1,5 metri o diventa Prono (a tua scelta).'] },
  { id: 'due-armi', name: 'Combattere con due armi', category: 'Combattimento', aliases: ['two-weapon', 'leggera'], points: [
    'Se attacchi con un’arma con la proprietà Leggera, puoi usare l’Azione Bonus per attaccare con un’altra arma Leggera.',
    'Al danno del secondo attacco non aggiungi il modificatore di caratteristica, a meno che sia negativo.'] },
  { id: 'iniziativa', name: 'Iniziativa e sorpresa', category: 'Combattimento', aliases: ['initiative', 'sorpresa'], points: [
    'All’inizio del combattimento ognuno tira una prova di Destrezza: si agisce dal risultato più alto.',
    'Chi è sorpreso ha Svantaggio al tiro di Iniziativa.'] },
  { id: 'colpo-senza-armi', name: 'Colpo Senz’Armi', category: 'Combattimento', aliases: ['unarmed strike', 'pugno'], points: ['Tiro per colpire con bonus di Forza e competenza: 1 + modificatore di Forza danni Contundenti, oppure lotti o spingi.'] },

  // ---------------- Maestrie
  { id: 'maestria-cleave', name: 'Fendere (Cleave)', category: 'Maestrie delle armi', points: ['Se colpisci una creatura con un attacco in mischia, puoi attaccarne una seconda entro 1,5 metri dalla prima e a portata. Al danno non aggiungi il modificatore (se positivo). Una volta per turno.'] },
  { id: 'maestria-graze', name: 'Sfiorare (Graze)', category: 'Maestrie delle armi', points: ['Se manchi, il bersaglio subisce comunque danni pari al modificatore di caratteristica usato per l’attacco, dello stesso tipo dell’arma.'] },
  { id: 'maestria-nick', name: 'Intaccare (Nick)', category: 'Maestrie delle armi', points: ['L’attacco extra della proprietà Leggera fa parte dell’azione Attacco invece di richiedere l’Azione Bonus. Una volta per turno.'] },
  { id: 'maestria-push', name: 'Spinta (Push)', category: 'Maestrie delle armi', points: ['Se colpisci, puoi spingere il bersaglio di Grande taglia o inferiore fino a 3 metri lontano da te in linea retta.'] },
  { id: 'maestria-sap', name: 'Fiaccare (Sap)', category: 'Maestrie delle armi', points: ['Se colpisci, il bersaglio ha Svantaggio al suo prossimo tiro per colpire prima dell’inizio del tuo prossimo turno.'] },
  { id: 'maestria-slow', name: 'Rallentare (Slow)', category: 'Maestrie delle armi', points: ['Se colpisci e infliggi danni, la Velocità del bersaglio diminuisce di 3 metri fino all’inizio del tuo prossimo turno (non si somma).'] },
  { id: 'maestria-topple', name: 'Rovesciare (Topple)', category: 'Maestrie delle armi', points: ['Se colpisci, il bersaglio fa un tiro salvezza su Costituzione (CD 8 + modificatore usato + competenza) o diventa Prono.'] },
  { id: 'maestria-vex', name: 'Irritare (Vex)', category: 'Maestrie delle armi', points: ['Se colpisci e infliggi danni, hai Vantaggio al tuo prossimo tiro per colpire contro quella creatura prima della fine del tuo prossimo turno.'] },

  // ---------------- Salute e riposo
  { id: 'zero-pf', name: 'Tiri salvezza contro la morte', category: 'Salute e riposo', aliases: ['death saves', '0 pf', 'morente'], points: [
    'A 0 Punti Ferita sei Privo di Sensi e all’inizio di ogni tuo turno tiri un d20: 10 o più è un successo, sotto 10 un fallimento.',
    'Tre successi: sei stabile. Tre fallimenti: muori. Un 1 vale due fallimenti; un 20 ti fa recuperare 1 PF.',
    'Subire danni a 0 PF conta come un fallimento (due se è un Colpo Critico).',
    'Una prova di Saggezza (Medicina) CD 10 o un Kit del Guaritore stabilizza una creatura.'] },
  { id: 'danno-massiccio', name: 'Morte istantanea', category: 'Salute e riposo', aliases: ['massive damage'], points: ['Se un danno ti porta a 0 PF e il danno rimanente è pari o superiore ai tuoi PF massimi, muori sul colpo.'] },
  { id: 'pf-temporanei', name: 'Punti Ferita temporanei', category: 'Salute e riposo', aliases: ['temporary hit points'], points: [
    'Assorbono i danni prima dei PF normali e non si sommano: se ne ricevi altri scegli se tenere i vecchi o i nuovi.',
    'Non sono cure e svaniscono con un Riposo Lungo.'] },
  { id: 'riposo-breve', name: 'Riposo Breve', category: 'Salute e riposo', aliases: ['short rest'], points: ['Almeno 1 ora di attività leggere: puoi spendere Dadi Vita, tirandoli e aggiungendo il modificatore di Costituzione per recuperare PF.'] },
  { id: 'riposo-lungo', name: 'Riposo Lungo', category: 'Salute e riposo', aliases: ['long rest'], points: [
    'Almeno 8 ore (dormendo almeno 6): recuperi tutti i PF e tutti i Dadi Vita spesi, e riduci l’Esaurimento di un livello.',
    'Puoi trarne beneficio una volta ogni 16 ore; un’interruzione di combattimento o di più di un’ora lo annulla.'] },

  // ---------------- Ambiente
  { id: 'terreno-difficile', name: 'Terreno difficile', category: 'Ambiente', aliases: ['difficult terrain'], points: ['Ogni metro di movimento costa un metro extra. Lo è anche lo spazio di altre creature non alleate.'] },
  { id: 'luce', name: 'Luce e oscurità', category: 'Ambiente', aliases: ['luce fioca', 'oscurità', 'oscurato'], points: [
    'Luce Fioca (area Leggermente Oscurata): Svantaggio alle prove di Saggezza (Percezione) basate sulla vista.',
    'Oscurità (area Pesantemente Oscurata): sei di fatto Accecato quando cerchi di vedere al suo interno.'] },
  { id: 'scurovisione', name: 'Scurovisione', category: 'Ambiente', aliases: ['darkvision'], points: ['Entro la portata vedi nella Luce Fioca come in Luce Intensa e nell’Oscurità come in Luce Fioca, senza distinguere i colori.'] },
  { id: 'caduta', name: 'Caduta', category: 'Ambiente', aliases: ['falling'], points: ['Subisci 1d6 danni Contundenti ogni 3 metri di caduta (massimo 20d6) e atterri Prono, a meno di evitare il danno.'] },
  { id: 'soffocamento', name: 'Soffocamento', category: 'Ambiente', aliases: ['suffocation', 'trattenere il respiro'], points: ['Puoi trattenere il respiro per 1 + modificatore di Costituzione minuti (minimo 30 secondi). Dopo, alla fine di ogni tuo turno ottieni un livello di Esaurimento finché non respiri di nuovo.'] },
];
