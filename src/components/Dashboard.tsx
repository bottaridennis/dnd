import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ChevronRight, Crown, Plus, Search, Shield, Trash2, Upload, Users, X } from 'lucide-react';
import { useCharacter, initialCharacter, type CharacterData } from '../contexts/CharacterContext';
import { useAuth } from '../contexts/AuthContext';
import { characterService } from '../services/characterService';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { computeCharacterStats, getClassLevels, getTotalLevel } from '../lib/characterRules';

const classLabel = (char: Parameters<typeof getClassLevels>[0]) =>
  Object.entries(getClassLevels(char)).map(([id, data]) => `${classesData.find(c => c.id === id)?.name || id} ${data.level}`).join(' / ');
const speciesLabel = (id?: string) => speciesData.find(s => s.id === id)?.name || id || '';
const timestamp = (value: any): number => (value?.toMillis ? value.toMillis() : typeof value?.seconds === 'number' ? value.seconds * 1000 : 0);

interface DashboardProps { onNewCharacter: () => void; onOpenSheet: (id: string) => void; }

export default function Dashboard({ onNewCharacter, onOpenSheet }: DashboardProps) {
  const { state, dispatch } = useCharacter();
  const { user } = useAuth();
  const { characters, loading } = state;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'level' | 'name'>('recent');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const visibleCharacters = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('it');
    const saved = characters.filter(char => char.id !== state.draftId);
    const filtered = saved.filter(char => [char.name, classLabel(char), speciesLabel(char.speciesId)].some(v => v?.toLocaleLowerCase('it').includes(needle)));
    return [...filtered].sort((a, b) => sort === 'level' ? getTotalLevel(b) - getTotalLevel(a) : sort === 'name' ? (a.name || '').localeCompare(b.name || '', 'it') : timestamp(b.updatedAt) - timestamp(a.updatedAt));
  }, [characters, query, sort, state.draftId]);

  const handleSelect = (id: string) => { dispatch({ type: 'SELECT_CHARACTER', payload: id }); onOpenSheet(id); };
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await characterService.deleteCharacter(deleteConfirmId);
      dispatch({ type: 'DELETE_CHARACTER', payload: deleteConfirmId });
      setDeleteConfirmId(null);
    } catch (error) { console.error('Delete failed:', error); }
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const data = (parsed?.format === 'forge-character' ? parsed.character : parsed) as Partial<CharacterData>;
      if (!data || typeof data !== 'object' || !data.name || !data.classId || !data.abilityScores) throw new Error('Il file non contiene un personaggio valido.');
      const { createdAt, updatedAt, userId, campaignId, campaignDmId, campaignName, ...rest } = data as any;
      const character: CharacterData = { ...initialCharacter, ...rest, id: crypto.randomUUID(), userId: user?.uid };
      await characterService.saveCharacter(character);
      setImportMessage(`${character.name} è stato aggiunto ai tuoi personaggi.`);
    } catch (error) {
      console.error('Import failed:', error);
      setImportMessage(error instanceof Error && !error.message.startsWith('{') ? error.message : 'Importazione non riuscita: controlla il file.');
    }
  };

  const toDelete = characters.find(c => c.id === deleteConfirmId);

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <AnimatePresence>{deleteConfirmId && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} role="dialog" aria-modal="true" aria-labelledby="delete-title" className="surface-card max-w-md w-full p-7 relative border-t-4 !border-t-danger">
            <button onClick={() => setDeleteConfirmId(null)} aria-label="Chiudi" className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            <AlertTriangle className="w-7 h-7 text-danger mb-4" />
            <h3 id="delete-title" className="text-2xl uppercase">Eliminare {toDelete?.name || 'questo personaggio'}?</h3>
            <p className="text-sm text-text-muted leading-relaxed mt-3">Scheda, equipaggiamento e progressi verranno cancellati definitivamente. Puoi prima scaricarne un backup dalla scheda.</p>
            <div className="flex justify-end gap-3 mt-7">
              <button onClick={() => setDeleteConfirmId(null)} className="secondary-action">Annulla</button>
              <button onClick={confirmDelete} className="primary-action px-5 py-2.5">Elimina</button>
            </div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <section className="hero-band">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-12 md:py-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="eyebrow mb-3">La tua collezione</p>
            <h1 className="text-5xl md:text-7xl font-black uppercase leading-[.9]">I miei personaggi</h1>
            <p className="mt-4 text-white/70 max-w-xl">Apri una scheda per giocare, creane una nuova con la creazione guidata o importa un backup.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-black/30 border border-white/10 px-5 py-3 text-center min-w-28">
              <div className="text-4xl font-black">{visibleCharacters.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">Personaggi</div>
            </div>
            <div className="bg-black/30 border border-white/10 px-5 py-3 text-center min-w-28">
              <div className="text-4xl font-black">{characters.filter(c => c.campaignId).length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">In campagna</div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 md:px-10 py-8">
        <section className="flex flex-col md:flex-row gap-3 md:items-center">
          <label className="field-shell flex-1"><Search className="w-4 h-4 text-text-muted" /><input value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-transparent py-2.5 outline-none" placeholder="Cerca per nome, classe o specie" aria-label="Cerca personaggi" /></label>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="field-shell py-2.5 uppercase text-xs font-bold tracking-wider" aria-label="Ordina personaggi">
            <option value="recent">Modificati di recente</option><option value="level">Per livello</option><option value="name">Per nome</option>
          </select>
          <label className="secondary-action !py-2.5 flex items-center justify-center gap-2 cursor-pointer" title="Importa un personaggio da un backup JSON">
            <Upload className="w-4 h-4" /> Importa
            <input type="file" accept="application/json,.json" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ''; }} />
          </label>
          <button onClick={onNewCharacter} className="primary-action px-5 py-2.5 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Crea personaggio</button>
        </section>

        {importMessage && (
          <div className="mt-4 flex items-center justify-between gap-3 surface-card px-4 py-3 text-sm border-l-4 !border-l-accent">
            <span>{importMessage}</span>
            <button onClick={() => setImportMessage(null)} aria-label="Chiudi messaggio"><X className="w-4 h-4" /></button>
          </div>
        )}

        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
          {visibleCharacters.map((char, index) => {
            const stats = computeCharacterStats(char);
            const bg = backgroundsData.find(b => b.id === char.backgroundId)?.name;
            const hpPct = Math.max(0, Math.min(100, ((char.hpCurrent ?? stats.hpMax) / stats.hpMax) * 100));
            return (
              <motion.article
                key={char.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className="surface-card overflow-hidden group hover:border-accent transition-colors cursor-pointer flex flex-col"
                role="button" tabIndex={0}
                onClick={() => handleSelect(char.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(char.id); } }}
                aria-label={`Apri la scheda di ${char.name}`}
              >
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#2a0a10] to-[#0d0d10]">
                  {char.portraitUrl
                    ? <img src={char.portraitUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                    : <div className="w-full h-full grid place-items-center"><Shield className="w-16 h-16 text-white/15" strokeWidth={1.25} /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute left-4 bottom-3 right-4 flex items-end justify-between text-white">
                    <div className="min-w-0">
                      <h2 className="text-2xl uppercase leading-none truncate">{char.name || 'Senza nome'}</h2>
                      <p className="text-xs text-white/75 mt-1 truncate">{speciesLabel(char.speciesId)} · {classLabel(char)}</p>
                    </div>
                    <div className="shrink-0 bg-[#d4142f] px-2 py-1 text-center leading-none">
                      <div className="text-[9px] uppercase font-bold">Liv.</div>
                      <div className="text-xl font-black">{getTotalLevel(char)}</div>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirmId(char.id); }}
                    aria-label={`Elimina ${char.name}`}
                    className="absolute right-3 top-3 w-8 h-8 grid place-items-center bg-black/60 text-white/80 hover:text-white hover:bg-danger opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 text-center border-b border-border">
                  {[['CA', stats.acBase], ['PF', `${Math.min(char.hpCurrent ?? stats.hpMax, stats.hpMax)}/${stats.hpMax}`], ['Iniz.', `${stats.initiative >= 0 ? '+' : ''}${stats.initiative}`]].map(([k, v]) => (
                    <div key={k} className="py-2.5 border-r last:border-r-0 border-border">
                      <div className="text-lg font-display font-black leading-none">{v}</div>
                      <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">{k}</div>
                    </div>
                  ))}
                </div>
                <div className="h-1 bg-panel-bg"><div className="h-full bg-success" style={{ width: `${hpPct}%` }} /></div>
                <div className="px-4 py-3 flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs text-text-muted truncate flex items-center gap-1.5">
                    {char.campaignId ? <><Crown className="w-3.5 h-3.5 text-accent" /> {char.campaignName || char.campaignId}</> : bg}
                  </span>
                  <span className="text-xs uppercase font-bold tracking-wider text-accent flex items-center gap-1">Apri <ChevronRight className="w-4 h-4" /></span>
                </div>
              </motion.article>
            );
          })}

          <button onClick={onNewCharacter} className="min-h-[260px] border-2 border-dashed border-border hover:border-accent text-text-muted hover:text-accent transition-colors flex flex-col items-center justify-center gap-3 p-6 rounded-[var(--radius-lg)]">
            <span className="w-14 h-14 rounded-full border-2 border-current grid place-items-center"><Plus className="w-6 h-6" /></span>
            <span className="uppercase font-bold tracking-wider">Crea un nuovo personaggio</span>
            <span className="text-xs">Creazione guidata in 7 passi</span>
          </button>
        </section>

        {!loading && query && visibleCharacters.length === 0 && (
          <div className="text-center py-16 text-text-muted"><Users className="w-8 h-8 mx-auto mb-3" />Nessun personaggio corrisponde alla ricerca.</div>
        )}
        {loading && characters.length === 0 && <p className="text-center py-16 eyebrow animate-pulse">Caricamento dei personaggi…</p>}
      </main>
    </div>
  );
}
