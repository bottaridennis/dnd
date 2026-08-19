import React, { useMemo, useState } from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { characterService } from '../services/characterService';
import { AlertTriangle, ArrowUpRight, BookOpen, Plus, Search, Trash2, User, X } from 'lucide-react';
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
    const filtered=characters.filter(char => [char.name,char.classId,char.speciesId].some(v => v?.toLocaleLowerCase('it').includes(needle)));
    return [...filtered].sort((a,b) => sort==='level'?(b.level||0)-(a.level||0):sort==='name'?(a.name||'').localeCompare(b.name||'','it'):0);
  },[characters,query,sort]);
  const totalLevels=characters.reduce((sum,char)=>sum+(char.level||0),0);
  const handleSelect=(id:string)=>{ dispatch({ type:'SELECT_CHARACTER',payload:id }); onOpenSheet(id); };
  const confirmDelete=async()=>{ if(!deleteConfirmId)return; try { await characterService.deleteCharacter(deleteConfirmId); setDeleteConfirmId(null); } catch(error){ console.error('Delete failed:',error); } };

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
        <header className="grid lg:grid-cols-[1fr_auto] gap-10 items-end pb-10 border-b border-border">
          <div><p className="eyebrow mb-5">Volume II · Compagnia</p><h1 className="font-serif text-6xl md:text-8xl leading-[.85] tracking-[-.055em]">Le storie<br/><em className="text-accent font-normal">in cammino.</em></h1></div>
          <div className="grid grid-cols-2 gap-8 lg:min-w-72">
            <div className="border-l border-border pl-5"><strong className="font-serif text-5xl font-normal">{String(characters.length).padStart(2,'0')}</strong><p className="eyebrow mt-2 !text-[8px]">Eroi custoditi</p></div>
            <div className="border-l border-border pl-5"><strong className="font-serif text-5xl font-normal">{String(totalLevels).padStart(2,'0')}</strong><p className="eyebrow mt-2 !text-[8px]">Livelli vissuti</p></div>
          </div>
        </header>

        <section className="py-7 flex flex-col md:flex-row gap-5 md:items-center border-b border-border">
          <label className="field-shell flex-1"><Search className="w-4 h-4 text-accent"/><input value={query} onChange={e=>setQuery(e.target.value)} className="w-full bg-transparent py-3 outline-none text-sm" placeholder="Cerca nell’archivio…" aria-label="Cerca personaggi"/></label>
          <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)} className="bg-transparent border-b border-border py-3 pr-8 text-xs uppercase tracking-widest font-bold" aria-label="Ordina personaggi"><option value="recent">Più recenti</option><option value="level">Per livello</option><option value="name">Per nome</option></select>
          <button onClick={onNewCharacter} className="primary-action px-6 py-3 flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Nuovo eroe</button>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-px bg-border border border-border mt-9">
          <button onClick={onNewCharacter} className="group bg-bg min-h-[430px] p-8 text-left flex flex-col justify-between hover:bg-card-bg transition-colors">
            <div className="w-14 h-14 rounded-full border border-accent text-accent grid place-items-center group-hover:bg-accent group-hover:text-card-bg transition-colors"><Plus className="w-5 h-5"/></div>
            <div><span className="font-serif text-7xl text-border">+</span><p className="eyebrow mb-2">Una pagina bianca</p><h2 className="font-serif text-4xl">Inizia una nuova leggenda</h2></div>
          </button>
          {visibleCharacters.map((char,index)=>(
            <motion.article key={char.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:index*.04 }} role="button" tabIndex={0} onClick={()=>handleSelect(char.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')handleSelect(char.id)}} className="group bg-card-bg min-h-[430px] cursor-pointer flex flex-col hover:bg-panel-bg transition-colors relative">
              <div className="h-52 relative overflow-hidden border-b border-border">
                {char.portraitUrl?<img src={char.portraitUrl} alt={char.name} className="w-full h-full object-cover grayscale-[.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer"/>:<div className="w-full h-full grid place-items-center bg-primary/5"><User className="w-20 h-20 text-primary/15"/></div>}
                <span className="absolute left-5 top-5 bg-card-bg px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.18em]">Folio {String(index+1).padStart(2,'0')}</span>
                <button onClick={e=>{e.stopPropagation();setDeleteConfirmId(char.id)}} aria-label={`Elimina ${char.name}`} className="absolute right-5 top-5 w-9 h-9 grid place-items-center bg-card-bg text-text-muted hover:text-danger opacity-100 md:opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4"/></button>
              </div>
              <div className="p-7 flex-1 flex flex-col justify-between">
                <div><div className="flex items-start justify-between gap-4"><h2 className="font-serif text-4xl leading-none">{char.name||'Senza nome'}</h2><span className="font-serif text-2xl text-accent">L{char.level}</span></div><p className="mt-4 text-[10px] font-bold uppercase tracking-[.15em] text-text-muted">{char.speciesId} · {char.classId}</p><p className="mt-3 text-sm text-text-muted line-clamp-2">{char.description||char.alignment||'Una storia ancora tutta da raccontare.'}</p></div>
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-border"><span className="eyebrow !text-[8px]">Apri la scheda</span><ArrowUpRight className="w-4 h-4 text-accent group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/></div>
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
