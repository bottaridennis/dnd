
import React from 'react';
import { useCharacter, Ability } from '../contexts/CharacterContext';
import { classesData, speciesData, backgroundsData } from '../data/rules2024';
import { getModifier, abilityMap } from '../lib/utils';
import { Shield, Heart, Zap, Eye, User, Scroll, Briefcase } from 'lucide-react';

export default function SummaryStep() {
  const { currentCharacter } = useCharacter();
  
  if (!currentCharacter) return null;

  const charClass = classesData.find(c => c.id === currentCharacter.classId);
  const charSpecies = speciesData.find(s => s.id === currentCharacter.speciesId);
  const charBackground = backgroundsData.find(b => b.id === currentCharacter.backgroundId);

  const getFinalScore = (ability: Ability) => {
    let score = currentCharacter.abilityScores[ability];
    // This is a simplified version of the logic in AbilityScoresStep
    if (currentCharacter.selectedBoosts.includes(ability)) {
       const index = currentCharacter.selectedBoosts.indexOf(ability);
       score += (index === 0 ? 2 : 1);
    }
    return score;
  };

  const str = getFinalScore('STR');
  const dex = getFinalScore('DEX');
  const con = getFinalScore('CON');
  const wis = getFinalScore('WIS');

  const proficiencyBonus = 2; // Level 1
  const hpBase = charClass?.hitDie || 8;
  const hp = hpBase + getModifier(con);
  const ac = 10 + getModifier(dex);
  const initiative = getModifier(dex);
  const passiveWisdom = 10 + getModifier(wis);

  const StatBlock = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string | number, sub?: string }) => (
    <div className="bg-card-bg border border-border rounded-lg p-6 flex flex-col items-center text-center">
       <div className="p-3 bg-panel-bg rounded border border-border mb-4 text-accent">
          <Icon className="w-8 h-8" />
       </div>
       <span className="text-[10px] font-mono font-black uppercase text-text-muted tracking-widest">{label}</span>
       <div className="text-4xl font-serif font-black text-text-primary my-1">{value}</div>
       {sub && <span className="text-[11px] text-text-muted">{sub}</span>}
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-12 items-start">
         <div className="w-full md:w-1/3 space-y-6">
            <div className="aspect-square bg-card-bg border border-accent rounded-xl flex items-center justify-center p-12 transition-all hover:bg-accent/5">
               <User className="w-full h-full text-accent/20" />
            </div>
            <div className="text-center">
               <h2 className="text-4xl font-serif font-black text-text-primary mb-2">{currentCharacter.name || 'Senza Nome'}</h2>
               <div className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded text-accent font-bold text-xs uppercase tracking-widest">
                 {charSpecies?.name} {charClass?.name} • Livello 1
               </div>
            </div>
         </div>

         <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
            <StatBlock icon={Heart} label="Hit Points" value={hp} sub={`Dado Vita: 1d${hpBase}`} />
            <StatBlock icon={Shield} label="Classe Armatura" value={ac} sub="Senza Armatura" />
            <StatBlock icon={Zap} label="Iniziativa" value={initiative >= 0 ? `+${initiative}` : initiative} />
            <StatBlock icon={Eye} label="Sagg. Passiva" value={passiveWisdom} />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-panel-bg border border-border rounded-lg p-10">
            <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.3em] mb-10 border-b border-border pb-4 flex items-center gap-3">
               <Scroll className="w-4 h-4 text-accent" /> Caratteristiche
            </h3>
            <div className="grid grid-cols-3 gap-y-10">
               {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as Ability[]).map(ab => {
                  const score = getFinalScore(ab);
                  const mod = getModifier(score);
                  return (
                    <div key={ab} className="flex flex-col items-center">
                       <span className="text-[10px] font-mono font-black text-text-muted tracking-widest mb-2">{abilityMap[ab]}</span>
                       <div className="text-3xl font-serif font-black text-text-primary leading-none mb-1">{score}</div>
                       <div className="w-10 h-6 bg-bg border border-border rounded flex items-center justify-center text-[11px] font-black text-accent">
                         {mod >= 0 ? `+${mod}` : mod}
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>

         <div className="bg-panel-bg border border-border rounded-lg p-10">
            <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.3em] mb-10 border-b border-border pb-4">Info Origine</h3>
            <div className="space-y-8">
               <div>
                  <span className="text-[10px] font-mono font-black text-text-muted tracking-[0.2em] uppercase">Background</span>
                  <p className="text-text-primary text-xl font-serif font-bold mt-1">{charBackground?.name}</p>
               </div>
               <div>
                  <span className="text-[10px] font-mono font-black text-text-muted tracking-[0.2em] uppercase mb-3 block">Abilità Competenti</span>
                  <div className="flex flex-wrap gap-2">
                     {charBackground?.skills.map(s => (
                       <span key={s} className="px-3 py-1 bg-card-bg border border-border rounded text-[11px] font-bold text-text-primary tracking-tight">{s}</span>
                     ))}
                  </div>
               </div>
               <div>
                  <span className="text-[10px] font-mono font-black text-text-muted tracking-[0.2em] uppercase">Talento di Origine</span>
                  <p className="text-accent text-lg font-bold mt-1">{charBackground?.feat}</p>
               </div>
            </div>
         </div>

         <div className="bg-panel-bg border border-border rounded-lg p-10 col-span-1 md:col-span-2">
            <h3 className="text-sm font-black uppercase text-text-muted tracking-[0.3em] mb-10 border-b border-border pb-4 flex items-center gap-3">
               <Briefcase className="w-4 h-4 text-accent" /> Inventario e Risorse
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <span className="text-[10px] font-mono font-black text-text-muted tracking-[0.2em] uppercase">Oggetti Selezionati</span>
                  <div className="grid grid-cols-1 gap-2">
                     {currentCharacter.inventoryItems && currentCharacter.inventoryItems.length > 0 ? (
                       currentCharacter.inventoryItems.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center p-3 bg-card-bg border border-border rounded">
                            <span className="text-xs font-bold text-text-primary">{item.name}</span>
                            <span className="text-[10px] text-text-muted">x{item.quantity}</span>
                         </div>
                       ))
                     ) : (
                       <div className="text-xs italic text-text-muted opacity-50 py-4">Nessun oggetto in inventario.</div>
                     )}
                  </div>
               </div>
               <div className="space-y-4">
                  <span className="text-[10px] font-mono font-black text-text-muted tracking-[0.2em] uppercase block">Ricchezza Iniziale</span>
                  <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-serif font-black text-accent">{currentCharacter.currency?.gp || 0}</span>
                     <span className="text-xs font-bold text-text-muted uppercase">Monete d'Oro (GP)</span>
                   </div>
                   <p className="text-[10px] text-text-muted leading-relaxed italic">
                      L'oro totale include sia i benefici del background che le opzioni della classe scelta.
                   </p>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
