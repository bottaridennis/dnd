import { useMemo, useRef, useState } from 'react';
import { BookOpen, Copy, Pencil, Plus, Search, Skull, Trash2, X } from 'lucide-react';
import { useBestiary } from '../hooks/useBestiary';
import { crValue, SRD_ATTRIBUTION, type Monster } from '../lib/bestiary';
import MonsterStatBlock from './MonsterStatBlock';
import MonsterEditor, { blankMonster } from './MonsterEditor';
import { EmptyState, ToggleChip } from './ui';

const CR_BANDS: [string, number, number][] = [['Tutti', 0, 99], ['0–1', 0, 1], ['2–4', 2, 4], ['5–10', 5, 10], ['11–16', 11, 16], ['17+', 17, 99]];

export default function BestiaryPage() {
  const bestiary = useBestiary();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [band, setBand] = useState(0);
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Monster | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  // Su telefono la scheda è sotto l'elenco: ci si porta lì alla selezione
  const select = (id: string) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const types = useMemo(() => Array.from(new Set<string>(bestiary.monsters.map(m => m.type))).sort((a, b) => a.localeCompare(b, 'it')), [bestiary.monsters]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('it');
    const [, min, max] = CR_BANDS[band];
    return bestiary.monsters
      .filter(m => !onlyCustom || m.custom)
      .filter(m => !type || m.type === type)
      .filter(m => { const v = crValue(m.cr); return v >= min && v <= max; })
      .filter(m => !needle || m.name.toLocaleLowerCase('it').includes(needle) || m.nameEn?.toLowerCase().includes(needle))
      .sort((a, b) => crValue(a.cr) - crValue(b.cr) || a.name.localeCompare(b.name, 'it'));
  }, [bestiary.monsters, search, type, band, onlyCustom]);

  const selected = bestiary.get(selectedId || undefined) || null;

  const save = async (m: Monster) => {
    await bestiary.save(m);
    setEditing(null);
    setSelectedId(m.id);
  };
  const customize = (m: Monster) => setEditing({ ...JSON.parse(JSON.stringify(m)), id: `hb-${crypto.randomUUID()}`, name: `${m.name} (personalizzato)`, custom: true });
  const remove = async (m: Monster) => {
    if (!window.confirm(`Eliminare il mostro “${m.name}”?`)) return;
    await bestiary.remove(m.id);
    setSelectedId(null);
  };

  return (
    <div>
      <section className="hero-band">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Strumenti del Master</p>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[.9]">Bestiario</h1>
            <p className="mt-3 text-white/70 max-w-xl">I {bestiary.monsters.length - bestiary.custom.length || ''} mostri delle regole 2024 più le tue creature: statistiche complete, attacchi e tiri salvezza cliccabili.</p>
          </div>
          <button onClick={() => setEditing(blankMonster())} className="primary-action px-5 py-3 flex items-center gap-2 self-start md:self-auto"><Plus className="w-4 h-4" /> Crea mostro</button>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 md:px-10 py-6">
        {editing ? (
          <MonsterEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />
        ) : (
          <div className="grid lg:grid-cols-[380px_1fr] gap-6 items-start">
            <div className="space-y-3 lg:sticky lg:top-24">
              <label className="field-shell"><Search className="w-4 h-4 text-text-muted" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca (anche col nome inglese)" className="w-full bg-transparent py-2.5 outline-none" aria-label="Cerca mostri" /></label>
              <div className="flex gap-2">
                <select value={type} onChange={e => setType(e.target.value)} className="field-shell py-2 text-sm flex-1" aria-label="Tipo">
                  <option value="">Tutti i tipi</option>{types.map(t => <option key={t}>{t}</option>)}
                </select>
                <ToggleChip selected={onlyCustom} onClick={() => setOnlyCustom(v => !v)}>Miei</ToggleChip>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grado di sfida">
                {CR_BANDS.map(([l], i) => <ToggleChip key={l} selected={band === i} onClick={() => setBand(i)}>GS {l}</ToggleChip>)}
              </div>
              {bestiary.error && <p className="text-sm text-danger">{bestiary.error}. Se sei offline, il bestiario sarà disponibile dopo averlo aperto una volta con la connessione.</p>}
              <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border border border-border bg-card-bg" aria-label="Mostri">
                {bestiary.loading && <li className="p-4 text-sm text-text-muted">Caricamento del bestiario…</li>}
                {!bestiary.loading && filtered.length === 0 && <li className="p-4 text-sm text-text-muted">Nessun mostro con questi filtri.</li>}
                {filtered.map(m => (
                  <li key={m.id}>
                    <button onClick={() => select(m.id)} aria-current={selectedId === m.id} className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 ${selectedId === m.id ? 'bg-accent/15 border-l-4 border-accent' : 'hover:bg-panel-bg border-l-4 border-transparent'}`}>
                      <span className="min-w-0"><span className="block font-bold truncate">{m.name}{m.custom && <span className="ml-1.5 text-[10px] text-accent uppercase">mio</span>}</span><span className="block text-[11px] text-text-muted truncate">{m.size} · {m.type}</span></span>
                      <span className="text-xs font-black font-serif text-text-muted shrink-0">GS {m.cr}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] text-text-muted leading-snug">{SRD_ATTRIBUTION}</p>
            </div>

            <div ref={detailRef} className="surface-card p-5 min-h-[50vh] scroll-mt-20">
              {selected ? (
                <>
                  <div className="flex flex-wrap justify-end gap-2 mb-2">
                    {selected.custom ? (
                      <>
                        <button onClick={() => setEditing(selected)} className="secondary-action flex items-center gap-1.5"><Pencil className="w-4 h-4" /> Modifica</button>
                        <button onClick={() => remove(selected)} className="secondary-action flex items-center gap-1.5 hover:!text-danger"><Trash2 className="w-4 h-4" /> Elimina</button>
                      </>
                    ) : (
                      <button onClick={() => customize(selected)} className="secondary-action flex items-center gap-1.5" title="Crea una copia modificabile"><Copy className="w-4 h-4" /> Personalizza</button>
                    )}
                    <button onClick={() => setSelectedId(null)} className="p-2 text-text-muted hover:text-text-primary lg:hidden" aria-label="Chiudi"><X className="w-4 h-4" /></button>
                  </div>
                  <MonsterStatBlock monster={selected} />
                </>
              ) : (
                <EmptyState icon={bestiary.monsters.length ? BookOpen : Skull} title="Scegli un mostro">Selezionalo dall’elenco per vedere il blocco statistiche. Tocca attacchi, danni e caratteristiche per tirare i dadi.</EmptyState>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
