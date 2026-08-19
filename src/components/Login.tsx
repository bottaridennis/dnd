import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Sword, ShieldCheck, BookOpen, Cloud } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5 md:p-10 login-stage">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-5xl grid lg:grid-cols-[1.15fr_.85fr] gap-8 items-center"
      >
        <div className="text-left space-y-8 py-8">
           <div className="brand-mark w-14 h-14">
              <Sword className="w-7 h-7" />
           </div>
           <div>
              <p className="eyebrow mb-4">Il tuo tavolo, sempre con te</p>
              <h1 className="text-5xl md:text-7xl font-serif font-black text-text-primary tracking-[-0.05em] leading-[.92]">Dai forma alla tua prossima leggenda.</h1>
              <p className="text-base md:text-lg text-text-muted mt-6 max-w-xl leading-relaxed">Crea eroi, gestisci risorse e affronta ogni sessione con una scheda pensata per le regole 2024.</p>
           </div>
           <div className="grid sm:grid-cols-3 gap-3">
             {[{ label: 'Schede complete', Icon: BookOpen }, { label: 'Dati al sicuro', Icon: Cloud }, { label: 'Regole 2024', Icon: ShieldCheck }].map(({ label, Icon }) => (
               <div key={label} className="feature-chip"><Icon className="w-4 h-4" /><span>{label}</span></div>
             ))}
           </div>
        </div>

        <div className="surface-card p-8 md:p-10 space-y-8 relative overflow-hidden">
           <div className="relative z-10 text-center space-y-2">
              <h2 className="text-2xl font-serif font-bold text-text-primary">Apri il tuo grimorio</h2>
              <p className="text-sm text-text-muted leading-relaxed mt-3">Accedi per ritrovare la tua compagnia e continuare da dove avevi lasciato.</p>
           </div>

           <button 
             onClick={loginWithGoogle}
             className="primary-action w-full relative z-10 py-4 flex items-center justify-center gap-3 group"
           >
              Accedi con Google
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
           </button>

           <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        </div>

      </motion.div>
    </div>
  );
}
