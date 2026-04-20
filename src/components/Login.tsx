import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Sword } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_40%,rgba(212,175,55,0.05)_0%,transparent_100%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-12"
      >
        <div className="flex flex-col items-center gap-4">
           <div className="w-20 h-20 rounded-2xl bg-panel-bg border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <Sword className="w-10 h-10" />
           </div>
           <div>
              <h1 className="text-5xl font-serif font-black text-text-primary tracking-tighter">Forge of Heroes</h1>
              <p className="text-xs text-text-muted mt-2 uppercase font-black tracking-[0.3em]">Companion 5.5 Edition</p>
           </div>
        </div>

        <div className="bg-panel-bg border border-border p-10 rounded-2xl space-y-8 shadow-2xl relative overflow-hidden">
           <div className="relative z-10 text-center space-y-2">
              <h2 className="text-xl font-serif font-bold text-text-primary">Benvenuto, Viandante</h2>
              <p className="text-sm text-text-muted leading-relaxed">Accedi con il tuo account Google per salvare e gestire i tuoi personaggi nel tempo.</p>
           </div>

           <button 
             onClick={loginWithGoogle}
             className="w-full relative z-10 py-4 bg-accent text-bg rounded font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-95 group"
           >
              Accedi con Google
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
           </button>

           <div className="absolute top-0 left-0 w-full h-1 bg-accent/20" />
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <p className="text-[10px] text-text-muted/40 uppercase font-black tracking-widest">Powered by AIS & D&D Rules 2024</p>
      </motion.div>
    </div>
  );
}
