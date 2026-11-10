import React, { useMemo, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { characterService } from '../services/characterService';
import { classesData, speciesData } from '../data/rules2024';
import { getClassLevels, getTotalLevel } from '../lib/characterRules';

const classLabel = (char: Parameters<typeof getClassLevels>[0]) =>
  Object.entries(getClassLevels(char)).map(([id, data]) => `${classesData.find(c => c.id === id)?.name || id} ${data.level}`).join(' / ');
const speciesLabel = (id?: string) => speciesData.find(s => s.id === id)?.name || id || '';
const toRoman = (value: number): string => {
  if (value <= 0) return '—';
  const map: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let n = value; let out = '';
  map.forEach(([v, s]) => { while (n >= v) { out += s; n -= v; } });
  return out;
};
const timestamp = (value: any): number => (value?.toMillis ? value.toMillis() : typeof value?.seconds === 'number' ? value.seconds * 1000 : 0);
import { AlertTriangle, ArrowUpRight, BookOpen, Plus, Search, Shield, Trash2, Upload, X } from 'lucide-react';
import { initialCharacter, type CharacterData } from '../contexts/CharacterContext';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'motion/react';

interface DashboardProps { onNewCharacter:() => void; onOpenSheet:(id:string) => void; }

export default function Dashboard({ onNewCharacter,onOpenSheet }:DashboardProps) {
  const { state,dispatch } = useCharacter();
  const { characters,loading } = state;
  const [deleteConfirmId,setDeleteConfirmId] = useState<string|null>(null);
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState<'recent'|'level'|'name'>('recent');
  const visibleCharacters = useMemo(() => {
    const needle=query.trim().toLocaleLowerCase('it');
    const saved=characters.filter(char => char.id !== state.draftId);
    const filtered=saved.filter(char => [char.name,classLabel(char),speciesLabel(char.speciesId)].some(v => v?.toLocaleLowerCase('it').includes(needle)));
    return [...filtered].sort((a,b) => sort==='level'?getTotalLevel(b)-getTotalLevel(a):sort==='name'?(a.name||'').localeCompare(b.name||'','it'):timestamp(b.updatedAt)-timestamp(a.updatedAt));
  },[characters,query,sort,state.draftId]);
  const totalLevels=visibleCharacters.reduce((sum,char)=>sum+getTotalLevel(char),0);
  const handleSelect=(id:string)=>{ dispatch({ type:'SELECT_CHARACTER',payload:id }); onOpenSheet(id); };
  const { user } = useAuth();
  const [importMessage,setImportMessage] = useState<string|null>(null);
  const importJson=async(file:File)=>{
    try {
      const parsed=JSON.parse(await file.text());
      const data=(parsed?.format==='forge-character'?parsed.character:parsed) as Partial<CharacterData>;
      if(!data||typeof data!=='object'||!data.name||!data.classId||!data.abilityScores) throw new Error('Il file non contiene un personaggio valido.');
      const { createdAt, updatedAt, userId, ...rest } = data as any;
      const character:CharacterData={ ...initialCharacter, ...rest, id:crypto.randomUUID(), userId:user?.uid };
      await characterService.saveCharacter(character);
      setImportMessage(`${character.name} è stato aggiunto alla compagnia.`);
    } catch(error){
      console.error('Import failed:',error);
      setImportMessage(error instanceof Error && !error.message.startsWith('{')?error.message:'Importazione non riuscita: controlla il file.');
    }
  };
  const confirmDelete=async()=>{ if(!deleteConfirmId)return; try { await characterService.deleteCharacter(deleteConfirmId); dispatch({ type:'DELETE_CHARACTER',payload:deleteConfirmId }); setDeleteConfirmId(null); } catch(error){ console.error('Delete failed:',error); } };

  return (
    <div className="min-h-[calc(100vh-72px)] px-5 py-8 md:px-10 lg:px-14 md:py-12">
      <AnimatePresence>{deleteConfirmId&&(
        <div className="fixed inset-0 z-[80] grid place-items-center p-4 bg-primary/60 backdrop-blur-sm">
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:12 }} className="surface-card max-w-md w-full p-8 relative">
            <button onClick={()=>setDeleteConfirmId(null)} aria-label="Chiudi" className="absolute right-5 top-5 text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
            <AlertTriangle className="w-7 h-7 text-accent mb-7"/><p className="eyebrow mb-2">Scelta definitiva</p><h3 className="font-serif text-4xl">Cancellare questo eroe?</h3>
            <p className="text-sm text-text-muted leading-relaxed mt-4">La sua storia, l’equipaggiamento e i progressi verranno rimossi dall’archivio.</p>
            <div className="flex justify-end gap-3 mt-8"><button onClick={()=>setDeleteConfirmId(null)} className="secondary-action">Conserva</button><button onClick={confirmDelete} className="primary-action !bg-danger px-5 py-3">Elimina</button></div>
          </motion.div>
        </div>
      )}</AnimatePresence>

      <main className="max-w-7xl mx-auto">
        <header className="grid lg:grid-cols-[1fr_auto] gap-10 items-end pb-10">
          <div><p className="eyebrow mb-5">Libro II · La Compagnia</p><h1 className="font-display text-5xl md:text-7xl leading-[.95]">Le cronache<br/><span className="text-accent">degli eroi</span></h1></div>
          <div className="grid grid-cols-2 gap-8 lg:min-w-72">
            <div className="border-l border-border pl-5"><strong className="font-display text-5xl font-normal">{toRoman(visibleCharacters.length)}</strong><p className="eyebrow mt-2 !text-[8px]">Eroi custoditi</p></div>
            <div className="border-l border-border pl-5"><strong className="font-display text-5xl font-normal">{toRoman(totalLevels)}</strong><p className="eyebrow mt-2 !text-[8px]">Livelli vissuti</p></div>
          </div>
        </header>

        <div className="ornament-rule" style={{ ['--color-card-bg' as any]: 'var(--color-bg)' }}/>
        <section className="py-7 flex flex-col md:flex-row gap-5 md:items-center">
          <label className="field-shell flex-1"><Search className="w-4 h-4 text-accent"/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full bg-transparent py-3 outline-none text-sm" placeholder="Cerca nell’archivio…" aria-label="Cerca personaggi"/></label>
          <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className="bg-transparent border-b border-gold py-3 pr-8 text-xs uppercase tracking-widest font-bold" aria-label="Ordina personaggi"><option value="recent">Più recenti</option><option value="level">Per livello</option><option value="name">Per nome</option></select>
          <label className="secondary-action !py-3 flex items-center justify-center gap-2 cursor-pointer" title="Importa un personaggio da un backup JSON">
            <Upload className="w-4 h-4"/> Importa
            <input type="file" accept="application/json,.json" className="sr-only" onChange={e=>{const f=e.target.files?.[0]; if(f) importJson(f); e.target.value='';}}/>
          </label>
          <button onClick={onNewCharacter} className="primary-action px-6 py-3 flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Nuovo eroe</button>
        </section>

        {importMessage&&<div className="mt-4 flex items-center justify-between gap-3 border border-gold bg-card-bg px-4 py-2 text-sm"><span>{importMessage}</span><button onClick={()=>setImportMessage(null)} aria-label="Chiudi messaggio"><X className="w-4 h-4"/></button></div>}
        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-7 mt-9">
          <button onClick={onNewCharacter} className="group surface-card ornate-corners !bg-transparent border-dashed min-h-[430px] p-8 text-left flex flex-col justify-between hover:!bg-card-bg transition-colors">
            <div className="brand-mark !w-14 !h-14 group-hover:scale-105 transition-transform"><Plus className="w-5 h-5"/></div>
            <div><p className="eyebrow mb-2">Una pergamena intonsa</p><h2 className="font-serif text-3xl leading-tight">Inizia una nuova leggenda</h2><p className="mt-3 text-text-muted italic">Scegli classe, stirpe e passato del tuo prossimo eroe.</p></div>
          </button>
          {visibleCharacters.map((char,index)=>(
            <motion.article key={char.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:index*.04 }} role="button" tabIndex={0} onClick={()=>handleSelect(char.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')handleSelect(char.id)}} className="group surface-card ornate-corners min-h-[430px] cursor-pointer flex flex-col hover:-translate-y-1 transition-transform relative">
              <div className="h-52 relative overflow-hidden border-b border-gold m-[6px] mb-0">
                {char.portraitUrl?<img src={char.portraitUrl} alt={char.name} className="w-full h-full object-cover grayscale-[.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer"/>:<div className="w-full h-full grid place-items-center bg-panel-bg"><Shield className="w-20 h-20 text-gold/40" strokeWidth={1}/></div>}
                <span className="absolute left-5 top-5 bg-card-bg border border-gold px-3 py-1 text-[9px] font-bold uppercase tracking-[.18em]">Foglio {toRoman(index+1)}</span>
                <button onClick={e=>{e.stopPropagation();setDeleteConfirmId(char.id)}} aria-label={`Elimina ${char.name}`} className="absolute right-5 top-5 w-9 h-9 grid place-items-center bg-card-bg text-text-muted hover:text-danger opacity-100 md:opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4"/></button>
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div><div className="flex items-start justify-between gap-4"><h2 className="font-serif text-3xl leading-none">{char.name||'Senza nome'}</h2><span className="font-display text-xl text-accent whitespace-nowrap" title="Livello">Liv. {getTotalLevel(char)}</span></div><p className="mt-4 text-[10px] font-bold uppercase tracking-[.15em] text-text-muted">{speciesLabel(char.speciesId)} · {classLabel(char)}</p><p className="mt-3 text-text-muted italic line-clamp-2">{char.description||char.alignment||'Una storia ancora tutta da raccontare.'}</p></div>
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-gold/50"><span className="eyebrow !text-[8px]">Apri la scheda</span><ArrowUpRight className="w-4 h-4 text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/></div>
              </div>
            </motion.article>
          ))}
        </section>
        {!loading&&query&&visibleCharacters.length===0&&<div className="text-center py-20"><BookOpen className="w-8 h-8 mx-auto text-border mb-4"/><p className="font-serif text-2xl">Nessun eroe trovato nell’archivio.</p></div>}
        {loading&&characters.length===0&&<p className="text-center py-16 eyebrow animate-pulse">Sfogliando l’archivio…</p>}
      </main>
    </div>
  );
}
