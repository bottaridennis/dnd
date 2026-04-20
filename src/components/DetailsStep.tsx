
import React from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { Type, Palette, AlignLeft, Info } from 'lucide-react';

const InputField = ({ label, icon: Icon, value, field, placeholder, area = false, handleChange }: any) => (
  <div className="space-y-2">
     <label className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-text-muted tracking-widest pl-1">
        <Icon className="w-3 h-3" /> {label}
     </label>
     {area ? (
       <textarea
         value={value || ''}
         onChange={(e) => handleChange(field, e.target.value)}
         placeholder={placeholder}
         rows={4}
         className="w-full bg-panel-bg border border-border rounded px-5 py-4 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all resize-none shadow-inner"
       />
     ) : (
       <input
         type="text"
         value={value || ''}
         onChange={(e) => handleChange(field, e.target.value)}
         placeholder={placeholder}
         className="w-full bg-panel-bg border border-border rounded px-5 py-4 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent/40 transition-all shadow-inner"
       />
     )}
  </div>
);

export default function DetailsStep() {
  const { currentCharacter, dispatch } = useCharacter();

  if (!currentCharacter) return null;

  const handleChange = (field: string, value: string) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: { [field]: value } });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="space-y-8">
            <InputField 
               handleChange={handleChange}
               label="Nome Personaggio" 
               icon={Type} 
               value={currentCharacter.name} 
               field="name" 
               placeholder="Es: Valerius Flamesteed" 
            />
            <InputField 
               handleChange={handleChange}
               label="Allineamento" 
               icon={Info} 
               value={currentCharacter.alignment} 
               field="alignment" 
               placeholder="Es: Legale Neutrale" 
            />
            <InputField 
               handleChange={handleChange}
               label="Ninnolo (Trinket)" 
               icon={Info} 
               value={currentCharacter.trinket} 
               field="trinket" 
               placeholder="Un oggetto misterioso..." 
            />
         </div>
         <div className="space-y-8">
            <InputField 
               handleChange={handleChange}
               label="Aspetto Fisico" 
               icon={Palette} 
               value={currentCharacter.appearance} 
               field="appearance" 
               placeholder="Occhi, capelli, cicatrici..." 
               area
            />
            <InputField 
               handleChange={handleChange}
               label="Descrizione e Personalità" 
               icon={AlignLeft} 
               value={currentCharacter.description} 
               field="description" 
               placeholder="Cosa lo spinge all'avventura?" 
               area
            />
         </div>
      </div>
    </div>
  );
}
