import React, { useState, useEffect } from 'react';
import { RegistrationForm } from './components/RegistrationForm';
import { HistoryView } from './components/HistoryView';
import { ClipboardCheck, Box, History, ArrowUpCircle, ArrowDownCircle, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, logout, onAuthStateChanged, User as FirebaseUser } from './firebase';

function App() {
  const [activeTab, setActiveTab] = useState<'retiro' | 'devolucion' | 'history'>('retiro');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setAuthError(error.message || "Error al iniciar sesión");
      setTimeout(() => setAuthError(null), 5000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans">
      {/* Auth Error Toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">{authError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">ClickShare</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Gestión de Salas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-gray-900">{user.displayName}</p>
                  <p className="text-[10px] text-gray-500">{user.email}</p>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isLoggingIn ? 'Iniciando...' : 'Acceso Admin'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          {/* Navigation Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-2xl w-fit overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('retiro')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'retiro' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Registrar Retiro
            </button>
            <button
              onClick={() => setActiveTab('devolucion')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'devolucion' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Devolución
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'history' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4" />
              Historial
            </button>
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'retiro' && <RegistrationForm type="retiro" />}
              {activeTab === 'devolucion' && <RegistrationForm type="devolucion" />}
              {activeTab === 'history' && <HistoryView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-black/5 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">© 2026 ClickShare Management System. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
