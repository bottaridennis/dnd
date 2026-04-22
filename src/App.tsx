import React, { useState, useEffect } from 'react';
import { CharacterProvider } from './contexts/CharacterContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CharacterWizard from './components/CharacterWizard';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CharacterSheet from './components/CharacterSheet';
import HomebrewCreator from './components/HomebrewCreator';
import { Wand2, Menu, Moon, Sun, Shield, X, Users, PlusCircle, LogOut, Hammer } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, getDocsFromServer, limit, query } from 'firebase/firestore';
import { userService } from './services/userService';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'dashboard' | 'wizard' | 'sheet' | 'homebrew'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Test Firestore Connection & Ensure User Profile
  useEffect(() => {
    async function init() {
      if (user) {
        try {
          await userService.ensureUserProfile(user);
        } catch (e) {
          console.error("Failed to ensure user profile:", e);
        }
      }
      
      try {
        await getDocsFromServer(query(collection(db, 'characters'), limit(1)));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore Connection Error: Please check your Firebase configuration or network.");
        }
      }
    }
    init();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <Wand2 className="w-12 h-12 text-primary animate-spin" />
        <span className="text-[10px] font-black uppercase text-text-muted tracking-widest text-primary">Incanalando la magia...</span>
      </div>
    );
  }

  if (!user) return <Login />;

  const navigateTo = (viewName: 'dashboard' | 'wizard' | 'sheet' | 'homebrew') => {
    setView(viewName);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Top Header resembling D&D Beyond WotC Style */}
      <header className="sticky top-0 z-50 bg-[#121212] border-b-2 border-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="text-gray-300 hover:text-white transition-colors lg:hidden"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div 
               className="flex items-center gap-2 cursor-pointer group"
               onClick={() => setView('dashboard')}
             >
               <div className="bg-primary p-1.5 rounded flex items-center justify-center transform group-hover:scale-105 transition-transform">
                 <Shield className="w-5 h-5 text-white" />
               </div>
               <span className="text-lg md:text-xl font-serif font-black text-white uppercase tracking-wider">
                 D&D <span className="text-primary font-sans font-bold text-xs md:text-sm ml-1 tracking-tight">MANAGEMENT</span>
               </span>
             </div>
             
             <nav className="hidden lg:flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                <button 
                  onClick={() => setView('dashboard')} 
                  className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'dashboard' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setView('homebrew')} 
                  className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest transition-colors ${view === 'homebrew' ? 'text-primary' : 'text-gray-400 hover:text-white'}`}
                >
                  Homebrew
                </button>
             </nav>
          </div>
          
          <div className="flex items-center gap-4">
             {view === 'sheet' && (
               <button 
                 onClick={() => setView('dashboard')}
                 className="hidden md:block px-4 py-1.5 border border-primary/50 text-white rounded hover:bg-primary/20 text-xs font-bold uppercase tracking-wider transition-colors"
               >
                 Torna alla Dashboard
               </button>
             )}
             <ThemeToggle />
             <div className="w-8 h-8 rounded-full border-2 border-accent bg-panel-bg flex items-center justify-center text-accent overflow-hidden shadow-sm hidden md:flex">
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
              className="absolute left-0 top-0 bottom-0 w-3/4 max-w-sm bg-[#1a1a1a] border-r-2 border-primary shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                <span className="text-lg font-serif font-black text-white uppercase tracking-wider">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col p-4 gap-2 flex-1">
                <div className="flex items-center gap-3 p-4 mb-4 bg-black/20 rounded-lg">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" className="w-10 h-10 rounded-full border border-accent" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{user.displayName || 'Utente'}</span>
                    <span className="text-xs text-gray-400">{user.email}</span>
                  </div>
                </div>

                <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-3 p-4 rounded text-left font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Users className="w-5 h-5 text-accent" /> Dashboard
                </button>
                <button onClick={() => navigateTo('homebrew')} className="flex items-center gap-3 p-4 rounded text-left font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Hammer className="w-5 h-5 text-accent" /> Creatore Homebrew
                </button>
                <button onClick={() => navigateTo('wizard')} className="flex items-center gap-3 p-4 rounded text-left font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
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
                 Torna alla Dashboard
               </button>
             </div>
             <CharacterSheet />
           </div>
        )}
        {view === 'dashboard' && <Dashboard onNewCharacter={() => setView('wizard')} onOpenSheet={() => setView('sheet')} />}
      </main>
    </div>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
      title="Toggle Dark/Light Theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-gray-200" />}
    </button>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-primary/30 transition-colors duration-300">
          <AppContent />
        </div>
      </CharacterProvider>
    </AuthProvider>
  );
}

