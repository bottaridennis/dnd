import React, { useState, useEffect } from 'react';
import { CharacterProvider, useCharacter } from './contexts/CharacterContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CharacterWizard from './components/CharacterWizard';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CharacterSheet from './components/CharacterSheet';
import HomebrewCreator from './components/HomebrewCreator';
import DiceTray from './components/DiceTray';
import { DiceProvider } from './contexts/DiceContext';
import { Wand2, Menu, Moon, Sun, Swords, X, Users, PlusCircle, LogOut, Hammer } from 'lucide-react';
import { auth } from './firebase';
import { userService } from './services/userService';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const { dispatch } = useCharacter();
  const [view, setView] = useState<'dashboard' | 'wizard' | 'sheet' | 'homebrew'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Garantisce l'esistenza del profilo utente (richiesto dalle regole di sicurezza)
  useEffect(() => {
    if (!user) return;
    userService.ensureUserProfile(user).catch(e => console.error("Failed to ensure user profile:", e));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <Wand2 className="w-9 h-9 text-accent animate-spin" />
        <span className="eyebrow">Si apre il grimorio…</span>
      </div>
    );
  }

  if (!user) return <Login />;

  const handleNewCharacter = () => {
    dispatch({ type: 'RESET_WIZARD' });
    setView('wizard');
    setIsMobileMenuOpen(false);
  };

  const navigateTo = (viewName: 'dashboard' | 'wizard' | 'sheet' | 'homebrew') => {
    if (viewName === 'wizard') {
      handleNewCharacter();
    } else {
      if (view === 'wizard') dispatch({ type: 'DISCARD_DRAFT' });
      setView(viewName);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Top Header resembling D&D Beyond WotC Style */}
      <header className="sticky top-0 z-50 app-header">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="text-text-muted hover:text-accent transition-colors lg:hidden"
               aria-label="Apri menu"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div 
               className="flex items-center gap-3 cursor-pointer group"
               onClick={() => navigateTo('dashboard')}
             >
               <div className="brand-mark">
                 <Swords className="w-5 h-5" />
               </div>
               <div className="leading-none">
                 <span className="block text-xl brand-title text-text-primary">Forge</span>
                 <span className="text-[9px] text-accent uppercase font-bold tracking-[0.24em]">Cronache degli Eroi</span>
               </div>
             </div>
             
             <nav className="hidden lg:flex items-center gap-7 ml-8 border-l border-border pl-8">
                <button 
                  onClick={() => navigateTo('dashboard')} 
                  className={`py-2 text-[9px] font-extrabold uppercase tracking-[.18em] border-b transition-colors ${view === 'dashboard' ? 'text-accent border-accent' : 'text-text-muted border-transparent hover:text-text-primary'}`}
                >
                  Compagnia
                </button>
                <button 
                  onClick={() => navigateTo('homebrew')} 
                  className={`py-2 text-[9px] font-extrabold uppercase tracking-[.18em] border-b transition-colors ${view === 'homebrew' ? 'text-accent border-accent' : 'text-text-muted border-transparent hover:text-text-primary'}`}
                >
                  Forgia Homebrew
                </button>
             </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {view === 'sheet' && (
               <button 
                 onClick={() => setView('dashboard')}
                 className="hidden md:block secondary-action"
               >
                  Torna alla compagnia
               </button>
             )}
             <ThemeToggle />
             <div className="w-8 h-8 rounded-full border border-border bg-panel-bg flex items-center justify-center text-accent overflow-hidden hidden md:flex">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" referrerPolicy="no-referrer" />
             </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm bg-card-bg border-r border-border shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
               <div className="h-[72px] flex items-center justify-between px-6 border-b border-border">
                <span className="brand-title text-2xl text-text-primary">Indice</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-text-muted hover:text-accent">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col p-4 gap-2 flex-1">
                <div className="flex items-center gap-3 p-4 mb-4 border-b border-border">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" className="w-10 h-10 rounded-full border border-accent" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text-primary">{user.displayName || 'Utente'}</span>
                    <span className="text-xs text-text-muted">{user.email}</span>
                  </div>
                </div>

                <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-3 p-4 text-left font-bold text-text-muted hover:text-accent hover:bg-panel-bg transition-colors">
                  <Users className="w-5 h-5 text-accent" /> La mia compagnia
                </button>
                <button onClick={() => navigateTo('homebrew')} className="flex items-center gap-3 p-4 text-left font-bold text-text-muted hover:text-accent hover:bg-panel-bg transition-colors">
                  <Hammer className="w-5 h-5 text-accent" /> Forgia Homebrew
                </button>
                <button onClick={() => navigateTo('wizard')} className="flex items-center gap-3 p-4 text-left font-bold text-text-muted hover:text-accent hover:bg-panel-bg transition-colors">
                  <PlusCircle className="w-5 h-5 text-accent" /> Nuovo Personaggio
                </button>
              </div>

              <div className="p-4 border-t border-border">
                <button onClick={handleLogout} className="flex items-center gap-3 p-4 w-full rounded text-left font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-5 h-5" /> Esci
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {view === 'wizard' && <CharacterWizard onComplete={() => setView('dashboard')} onCancel={() => setView('dashboard')} />}
        {view === 'homebrew' && (
           <div className="p-4 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <HomebrewCreator />
           </div>
        )}
        {view === 'sheet' && (
           <div className="relative pt-4">
             {/* Mobile Back Button */}
             <div className="md:hidden px-4 mb-4">
               <button 
                 onClick={() => setView('dashboard')}
                 className="w-full py-2 bg-panel-bg border border-border text-text-primary rounded text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-transform"
               >
                 Torna alla compagnia
               </button>
             </div>
             <CharacterSheet />
           </div>
        )}
        {view === 'dashboard' && <Dashboard onNewCharacter={handleNewCharacter} onOpenSheet={() => setView('sheet')} />}
      </main>
      {view === 'sheet' && <DiceTray />}
    </div>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('forge-theme'); } catch { /* storage non disponibile */ }
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('forge-theme', isDark ? 'dark' : 'light'); } catch { /* storage non disponibile */ }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-2 text-text-muted hover:text-accent transition-colors rounded-full hover:bg-panel-bg"
      title={isDark ? 'Usa tema chiaro' : 'Usa tema scuro'}
      aria-label={isDark ? 'Usa tema chiaro' : 'Usa tema scuro'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <DiceProvider>
        <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-primary/30 transition-colors duration-300">
          <AppContent />
        </div>
        </DiceProvider>
      </CharacterProvider>
    </AuthProvider>
  );
}

