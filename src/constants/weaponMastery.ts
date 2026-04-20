
export interface WeaponMastery {
  name: string;
  description: string;
  effect: string;
}

export const weaponMasteryData: Record<string, WeaponMastery> = {
  Cleave: {
    name: "Cleave",
    description: "Colpisci un secondo bersaglio vicino.",
    effect: "Se colpisci una creatura con un attacco in mischia usando questa arma, puoi infliggere il danno dell'arma a un'altra creatura entro 1,5 metri dal bersaglio originale che sia anche nel tuo raggio d'azione. Puoi farlo solo una volta per turno."
  },
  Graze: {
    name: "Graze",
    description: "Infliggi danni anche se manchi.",
    effect: "Se manchi una creatura con un attacco usando questa arma, la creatura subisce comunque danni pari al modificatore della caratteristica usata per l'attacco (minimo 0)."
  },
  Nick: {
    name: "Nick",
    description: "Attacco rapido extra.",
    effect: "Quando effettui l'azione di Attacco e attacchi con un'arma che ha la proprietà Leggera, puoi effettuare l'attacco extra fornito dalla proprietà Leggera come parte della stessa azione di Attacco, invece che come Azione Bonus. Puoi farlo solo una volta per turno."
  },
  Push: {
    name: "Push",
    description: "Spingi via il bersaglio.",
    effect: "Se colpisci una creatura con questa arma, puoi spingerla fino a 3 metri lontano da te se è di taglia Grande o inferiore."
  },
  Sap: {
    name: "Sap",
    description: "Disorienta il bersaglio.",
    effect: "Se colpisci una creatura con questa arma, il bersaglio ha Svantaggio al suo prossimo tiro per colpire prima dell'inizio del tuo prossimo turno."
  },
  Slow: {
    name: "Slow",
    description: "Rallenta il bersaglio.",
    effect: "Se colpisci una creatura con questa arma, puoi ridurre la sua velocità di 3 metri fino all'inizio del tuo prossimo turno. Questo effetto non è cumulabile."
  },
  Topple: {
    name: "Topple",
    description: "Butta a terra il bersaglio.",
    effect: "Se colpisci una creatura con questa arma, puoi obbligarla a effettuare un Tiro Salvezza su Costituzione (CD 8 + Bonus Competenza + Modificatore caratteristica usata per l'attacco). Se fallisce, cade Prona."
  },
  Vex: {
    name: "Vex",
    description: "Ottieni Vantaggio sul prossimo attacco.",
    effect: "Se colpisci una creatura con questa arma, hai Vantaggio al tuo prossimo tiro per colpire contro quella creatura prima della fine del tuo prossimo turno."
  }
};

export const DAMAGE_TYPES = [
  "Acido", "Contundente", "Freddo", "Fuoco", "Forza", 
  "Fulmine", "Necrotico", "Perforante", "Veleno", 
  "Psichico", "Radioso", "Tagliente", "Tuono"
];
