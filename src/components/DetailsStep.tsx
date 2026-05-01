
import React from 'react';
import { useCharacter } from '../contexts/CharacterContext';
import { Type, Palette, AlignLeft, Info, Camera } from 'lucide-react';

const InputField = ({ label, icon: Icon, value, field, placeholder, area = false, handleChange, type = "text" }: any) => (
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
         type={type}
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
             <InputField 
                handleChange={handleChange}
                label="URL Immagine Ritratto" 
                icon={Camera} 
                value={currentCharacter.portraitUrl} 
                field="portraitUrl" 
                placeholder="https://link-immagine.com/foto.jpg" 
             />
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-mono font-black uppercase text-text-muted tracking-widest pl-1">
                   <Camera className="w-3 h-3" /> Oppure Carica Foto
                </label>
                <div className="relative group">
                   <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                               // Optional: compress image before saving
                               const img = new Image();
                               img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 400;
                                  const MAX_HEIGHT = 400;
                                  let width = img.width;
                                  let height = img.height;

                                  if (width > height) {
                                     if (width > MAX_WIDTH) {
                                        height *= MAX_WIDTH / width;
                                        width = MAX_WIDTH;
                                     }
                                  } else {
                                     if (height > MAX_HEIGHT) {
                                        width *= MAX_HEIGHT / height;
                                        height = MAX_HEIGHT;
                                     }
                                  }

                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                  handleChange('portraitUrl', dataUrl);
                               };
                               img.src = reader.result as string;
                            };
                            reader.readAsDataURL(file);
                         }
                      }}
                      className="hidden" 
                      id="portrait-upload"
                   />
                   <label 
                      htmlFor="portrait-upload"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg border-2 border-dashed border-border rounded-lg text-text-muted hover:border-accent hover:text-accent transition-all cursor-pointer group-hover:bg-accent/5"
                   >
                      <Camera className="w-5 h-5" />
                      <span className="font-mono text-xs font-black uppercase">Seleziona Immagine</span>
                   </label>
                </div>
                <p className="text-[9px] text-text-muted/60 italic pl-1">L'immagine verrà ridimensionata e salvata nel database.</p>
             </div>
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
