
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { homebrewService, HomebrewType } from '../services/homebrewService';
import { 
  Wand2, 
  Sword, 
  Trophy, 
  Save, 
  X, 
  Sparkles,
  ChevronRight,
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HomebrewCreator() {
  const { user } = useAuth();
  const [type, setType] = useState<HomebrewType>('spell');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    level: 0,
    school: '',
    time: '',
    range: '',
    components: '',
    description: '',
    category: 'Semplice',
    damage: '',
    damageType: '',
    properties: '',
    mastery: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const data = type === 'spell' ? {
        name: formData.name,
        level: Number(formData.level),
        school: formData.school,
        castingTime: formData.time,
        range: formData.range,
        components: formData.components,
        description: formData.description
      } : type === 'weapon' ? {
        name: formData.name,
        category: formData.category,
        damage: formData.damage,
        damageType: formData.damageType,
        properties: formData.properties,
        mastery: formData.mastery,
        description: formData.description
      } : {
        name: formData.name,
        description: formData.description
      };

      await homebrewService.saveHomebrewItem(user.uid, type, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFormData({
        name: '', level: 0, school: '', time: '', range: '',
        components: '', description: '', category: 'Semplice',
        damage: '', damageType: '', properties: '', mastery: ''
      });
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-panel-bg border-2 border-border rounded-xl shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <Hammer className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-black text-text-primary uppercase tracking-tight">Fucina di Contenuti</h2>
          <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">Crea e salva il tuo Homebrew</p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="flex gap-2 mb-8 bg-bg p-1 rounded-lg border border-border">
        {(['spell', 'weapon', 'feat'] as HomebrewType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`
              flex-1 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all
              ${type === t 
                ? 'bg-primary text-white shadow-md' 
                : 'text-text-muted hover:text-text-primary'}
            `}
          >
            {t === 'spell' ? 'Incantesimo' : t === 'weapon' ? 'Arma' : 'Talento'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Common Fields */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Nome</label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-bg border border-border rounded px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Inserisci il nome..."
            />
          </div>

          {/* Spell Fields */}
          {type === 'spell' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Livello</label>
                <input type="number" name="level" value={formData.level} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" min="0" max="9" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Scuola</label>
                <input name="school" value={formData.school} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" placeholder="es. Evocazione" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Tempo</label>
                <input name="time" value={formData.time} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" placeholder="1 Azione" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Gittata</label>
                <input name="range" value={formData.range} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" placeholder="18 metri" />
              </div>
            </div>
          )}

          {/* Weapon Fields */}
          {type === 'weapon' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Categoria</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none appearance-none">
                  <option>Semplice</option>
                  <option>Marziale</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Danno</label>
                <input name="damage" value={formData.damage} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" placeholder="es. 1d8" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Tipo Danno</label>
                <input name="damageType" value={formData.damageType} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" placeholder="Tagliente" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Maestria</label>
                <input name="mastery" value={formData.mastery} onChange={handleInputChange} className="w-full bg-bg border border-border rounded px-4 py-3 text-sm outline-none" placeholder="es. Sap" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Descrizione</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full bg-bg border border-border rounded px-4 py-3 text-sm focus:border-primary outline-none transition-all resize-none"
              placeholder="Descrivi l'effetto..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-black uppercase tracking-[0.2em] rounded shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : success ? (
            <>Salvato con Successo! <Sparkles className="w-5 h-5" /></>
          ) : (
            <>Forgia Contenuto <Save className="w-5 h-5" /></>
          )}
        </button>
      </form>
    </div>
  );
}
