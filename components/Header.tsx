
import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  activeView: 'analyze' | 'history';
  onViewChange: (view: 'analyze' | 'history') => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
}

const Header: React.FC<HeaderProps> = ({ user, activeView, onViewChange, onAuthClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
  };

  const navigate = (view: 'analyze' | 'history') => {
    onViewChange(view);
    setIsMenuOpen(false);
  };

  const handleAuth = (mode: 'login' | 'signup') => {
    onAuthClick(mode);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-[100] border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo Section */}
        <div 
          className="flex items-center gap-2 cursor-pointer z-[110]" 
          onClick={() => navigate('analyze')}
        >
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="13" width="3.5" height="6" rx="1.5" />
              <rect x="10.25" y="9" width="3.5" height="10" rx="1.5" />
              <rect x="15.5" y="5" width="3.5" height="14" rx="1.5" />
            </svg>
          </div>
          <span className="text-base md:text-xl font-bold tracking-tight text-slate-900">
            Alpha<span className="text-blue-600">Insight</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <nav className="flex items-center gap-8">
                <button 
                  onClick={() => onViewChange('analyze')} 
                  className={`text-sm font-bold transition-colors ${activeView === 'analyze' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Analyze
                </button>
                <button 
                  onClick={() => onViewChange('history')} 
                  className={`text-sm font-bold transition-colors ${activeView === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  History
                </button>
              </nav>
              <div className="h-4 w-px bg-slate-200"></div>
              <button 
                onClick={handleLogout} 
                className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-6">
              <button 
                onClick={() => onAuthClick('login')} 
                className="text-sm font-bold text-slate-600 hover:text-slate-900"
              >
                Log in
              </button>
              <button 
                onClick={() => onAuthClick('signup')} 
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                Sign up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 z-[110] transition-transform active:scale-90"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>

        {/* Mobile Navigation Dropdown - Fixed with Opaque Background */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-white z-[100] md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col h-full pt-20 px-6 pb-10">
              <div className="space-y-6">
                {user ? (
                  <>
                    <div className="space-y-4">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Dashboard</p>
                      <button 
                        onClick={() => navigate('analyze')} 
                        className={`w-full text-left text-sm font-bold py-2.5 px-4 rounded-xl ${activeView === 'analyze' ? 'bg-blue-50 text-blue-600' : 'text-slate-900'}`}
                      >
                        New Analysis
                      </button>
                      <button 
                        onClick={() => navigate('history')} 
                        className={`w-full text-left text-sm font-bold py-2.5 px-4 rounded-xl ${activeView === 'history' ? 'bg-blue-50 text-blue-600' : 'text-slate-900'}`}
                      >
                        View Library
                      </button>
                    </div>
                    
                    <div className="pt-6 border-t border-slate-100">
                      <button 
                        onClick={handleLogout} 
                        className="w-full bg-slate-50 text-rose-600 py-3 rounded-xl font-bold text-[9px] uppercase tracking-widest text-center border border-rose-100/30"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Portal</p>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">Join the AlphaInsight Intelligence Network</h3>
                    </div>
                    <div className="space-y-3 pt-2">
                      <button 
                        onClick={() => handleAuth('signup')} 
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-blue-50"
                      >
                        Get Started
                      </button>
                      <button 
                        onClick={() => handleAuth('login')} 
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-[9px] uppercase tracking-widest"
                      >
                        Sign In
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-50 text-center">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">© 2026 ALPHAINSIGHT LABS</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
