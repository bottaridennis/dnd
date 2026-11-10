import React, { useState, useEffect } from 'react';
import { CharacterProvider, useCharacter } from './contexts/CharacterContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CharacterWizard from './components/CharacterWizard';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CharacterSheet from './components/CharacterSheet';
import HomebrewCreator from './components/HomebrewCreator';
import CampaignManager from './components/CampaignManager';
import DiceTray from './components/DiceTray';
const Dice3D = React.lazy(() => import('./components/Dice3D'));
import { DiceProvider } from './contexts/DiceContext';
import { Menu, Moon, Sun, Hexagon, X, Users, PlusCircle, LogOut, Hammer, Crown, ArrowLeft } from 'lucide-react';
import { auth } from './firebase';
import { userService } from './services/userService';
import { AnimatePresence, motion } from 'motion/react';

type View = 'dashboard' | 'wizard' | 'sheet' | 'homebrew' | 'campaigns';

const NAV: { id: View; label: string; Icon: typeof Users }[] = [
  { id: 'dashboard', label: 'Personaggi', Icon: Users },
  { id: 'campaigns', label: 'Campagne', Icon: Crown },
  { id: 'homebrew', label: 'Homebrew', Icon: Hammer },
];

function AppContent() {
  const { user, loading } = useAuth();
  const { dispatch } = useCharacter();
  const [view, setView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Garantisce l'esistenza del profilo utente (richiesto dalle regole di sicurezza)
  useEffect(() => {
    if (!user) return;
    userService.ensureUserProfile(user).catch(e => console.error("Failed to ensure user profile:", e));
  }, [user]);

  // Ogni cambio di vista riparte dall'alto della pagina
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <div className="brand-mark animate-pulse"><Hexagon className="w-5 h-5" /></div>
        <span className="eyebrow">Caricamento…</span>
      </div>
    );
  }

  if (!user) return <Login />;

  const handleNewCharacter = () => {
    dispatch({ type: 'RESET_WIZARD' });
    setView('wizard');
    setIsMobileMenuOpen(false);
  };

  const navigateTo = (viewName: View) => {
    if (viewName === 'wizard') {
      handleNewCharacter();
      return;
    }
    if (view === 'wizard') dispatch({ type: 'DISCARD_DRAFT' });
    setView(viewName);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setIsMobileMenuOpen(false);
  };

  const activeNav: View = view === 'sheet' || view === 'wizard' ? 'dashboard' : view;
  const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Avventuriero')}&background=c8102e&color=fff`;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 app-header print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 h-full">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-white/70 hover:text-white lg:hidden" aria-label="Apri menu">
              <Menu className="w-6 h-6" />
            </button>
            <button className="flex items-center gap-3" onClick={() => navigateTo('dashboard')} aria-label="Forge, vai ai personaggi">
              <span className="brand-mark"><Hexagon className="w-5 h-5" /></span>
              <span className="leading-none text-left">
                <span className="block text-xl brand-title text-white">Forge</span>
                <span className="text-[10px] text-white/60 uppercase font-bold tracking-[0.2em]">Character Companion · 2024</span>
              </span>
            </button>
            <nav className="hidden lg:flex items-stretch gap-7 ml-8 h-full" aria-label="Navigazione principale">
              {NAV.map(item => (
                <button key={item.id} onClick={() => navigateTo(item.id)} aria-current={activeNav === item.id ? 'page' : undefined} className="nav-link">
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {view === 'sheet' && (
              <button onClick={() => setView('dashboard')} className="hidden md:flex items-center gap-1.5 text-xs uppercase font-bold tracking-widest text-white/70 hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Personaggi
              </button>
            )}
            <button onClick={handleNewCharacter} className="hidden sm:flex primary-action px-4 py-2 items-center gap-2"><PlusCircle className="w-4 h-4" /> Crea personaggio</button>
            <ThemeToggle />
            <img src={avatar} alt="" className="hidden md:block w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="app-header absolute left-0 top-0 bottom-0 w-3/4 max-w-sm flex flex-col !border-b-0 border-r-4 !border-r-[#d4142f]"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
                <span className="brand-title text-xl text-white">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white" aria-label="Chiudi menu"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex items-center gap-3 p-5 border-b border-white/10">
                <img src={avatar} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{user.displayName || 'Avventuriero'}</div>
                  <div className="text-xs text-white/60 truncate">{user.email}</div>
                </div>
              </div>
              <nav className="flex flex-col p-3 gap-1 flex-1">
                {NAV.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => navigateTo(id)} className={`flex items-center gap-3 px-4 py-3 text-left uppercase font-bold tracking-wider text-sm ${activeNav === id ? 'bg-white/10 text-white border-l-4 border-[#ef3340]' : 'text-white/70 hover:bg-white/5 border-l-4 border-transparent'}`}>
                    <Icon className="w-5 h-5" /> {label}
                  </button>
                ))}
                <button onClick={handleNewCharacter} className="flex items-center gap-3 px-4 py-3 text-left uppercase font-bold tracking-wider text-sm text-white/70 hover:bg-white/5 border-l-4 border-transparent">
                  <PlusCircle className="w-5 h-5" /> Crea personaggio
                </button>
              </nav>
              <div className="p-3 border-t border-white/10">
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left uppercase font-bold tracking-wider text-sm text-[#ff6b75] hover:bg-white/5">
                  <LogOut className="w-5 h-5" /> Esci
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full relative">
        {view === 'wizard' && <CharacterWizard onComplete={() => setView('dashboard')} onCancel={() => setView('dashboard')} />}
        {view === 'homebrew' && <HomebrewCreator />}
        {view === 'campaigns' && <CampaignManager />}
        {view === 'sheet' && <CharacterSheet onBack={() => setView('dashboard')} />}
        {view === 'dashboard' && <Dashboard onNewCharacter={handleNewCharacter} onOpenSheet={() => setView('sheet')} />}
      </main>
      {view === 'sheet' && <div className="print:hidden"><DiceTray /><React.Suspense fallback={null}><Dice3D /></React.Suspense></div>}
    </div>
  );
}

function ThemeToggle() {
  // Tema scuro predefinito, come le esperienze digitali ufficiali; la scelta viene ricordata
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('forge-theme');
      if (saved) return saved === 'dark';
    } catch { /* storage non disponibile */ }
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('forge-theme', isDark ? 'dark' : 'light'); } catch { /* storage non disponibile */ }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
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
