
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import HistoryList from './components/HistoryList';
import { FinancialData, LoadingState } from './types';
import { analyzeFinancialPDF } from './services/aiService';
import { auth, db } from './lib/firebase';
/* Fix: Correctly import modular functions and interfaces from Firebase packages */
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'analyze' | 'history'>('analyze');
  const [result, setResult] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ status: 'idle', message: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [authChecking, setAuthChecking] = useState(true);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean, mode: 'login' | 'signup' }>({ isOpen: false, mode: 'login' });

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    // Correctly using onAuthStateChanged from firebase/auth
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
      if (!currentUser) {
        setResult(null);
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const historyPath = ref(db, `users/${user.uid}/history`);
      const unsubscribe = onValue(historyPath, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const items = Object.entries(data).map(([id, val]: any) => ({ id, ...val }));
          setHistory(items);
        } else {
          setHistory([]);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      setAuthModal({ isOpen: true, mode: 'signup' });
      return;
    }
    setLoading({ status: 'loading', message: "Analyzing document..." });
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const data = await analyzeFinancialPDF(base64);
          if (!data.is_financial_statement) {
            setLoading({ status: 'error', message: 'Sorry, this PDF is not finance related.' });
            return;
          }
          setResult(data);
          
          // Save analysis results to user history using modular SDK functions
          const historyPath = ref(db, `users/${user.uid}/history`);
          await push(historyPath, { 
            ...data, 
            timestamp: serverTimestamp() 
          });
          
          setLoading({ status: 'success', message: '' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: any) {
          setLoading({ status: 'error', message: error.message });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setLoading({ status: 'error', message: 'Unexpected error occurred.' });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    
    setContactLoading(true);
    try {
      const inquiriesRef = ref(db, 'inquiries');
      await push(inquiriesRef, {
        ...contactForm,
        timestamp: serverTimestamp()
      });
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      alert("Failed to send message. Please try again.");
    } finally {
      setContactLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setLoading({ status: 'idle', message: '' });
  };

  if (authChecking) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 scroll-smooth">
      <Header 
        user={user} 
        activeView={activeView}
        onViewChange={(v) => {
          setActiveView(v);
          if (v === 'analyze' && result) resetAnalysis();
        }}
        onAuthClick={(mode) => setAuthModal({ isOpen: true, mode })} 
      />
      
      {authModal.isOpen && (
        <Auth 
          mode={authModal.mode} 
          onClose={() => setAuthModal({ ...authModal, isOpen: false })} 
          onSwitch={(mode) => setAuthModal({ isOpen: true, mode })}
        />
      )}

      <main>
        {user ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
            {activeView === 'history' ? (
              <div className="max-w-4xl mx-auto">
                 <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-10 tracking-tight">Your Analysis Library</h2>
                 <HistoryList 
                  history={history} 
                  onSelect={(item) => {
                    setResult(item);
                    setActiveView('analyze');
                  }} 
                 />
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                {loading.status === 'loading' ? (
                  <div className="bg-slate-50 rounded-[2rem] md:rounded-[3rem] p-8 md:p-24 flex flex-col items-center justify-center min-h-[400px] md:min-h-[500px] border border-slate-100 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6 md:mb-8"></div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2">Analyzing Report</h3>
                    <p className="text-slate-500 text-sm md:text-base">Extracting institutional insights from your PDF...</p>
                  </div>
                ) : loading.status === 'error' ? (
                  <div className="bg-rose-50 rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 flex flex-col items-center justify-center text-center border border-rose-100">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
                       <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">{loading.message}</h3>
                    <button onClick={resetAnalysis} className="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold">Try Another File</button>
                  </div>
                ) : result ? (
                  <Dashboard data={result} onReset={resetAnalysis} />
                ) : (
                  <div className="space-y-12">
                    <div className="text-center">
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-tight">New Analysis</h2>
                      <p className="text-slate-500 text-base md:text-lg mt-4 max-w-lg mx-auto">Upload your PDF report to generate the verified dashboard.</p>
                    </div>
                    <FileUpload onFileSelect={handleFileSelect} isLoading={false} />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-1000">
            {/* HERO SECTION */}
            <section id="home" className="pt-16 md:pt-24 pb-16 md:pb-20 px-4 md:px-6 scroll-mt-20">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center text-center lg:text-left">
                <div className="space-y-6 md:space-y-8">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mx-auto lg:mx-0">
                     <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                     AI-Powered Financial Analysis
                  </div>
                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                    Institutional Grade <br className="hidden sm:block"/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-emerald-400 to-emerald-500">Financial Insights</span>
                  </h1>
                  <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Instantly extract, analyze, and verify financial data from PDF reports. Built for investors who demand accuracy and speed.
                  </p>
                  <button 
                    onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                    className="w-full sm:w-auto bg-blue-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl text-lg font-black shadow-2xl shadow-blue-200 hover:scale-[1.05] active:scale-95 transition-all inline-flex items-center justify-center gap-3"
                  >
                    Start Analyzing Free
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                </div>

                <div 
                  className="relative group cursor-pointer w-full max-w-lg mx-auto lg:max-w-none"
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-[2rem] md:rounded-[3.5rem] blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                  <div className="relative p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/60 backdrop-blur-md shadow-xl hover:shadow-2xl hover:border-blue-400 hover:-translate-y-2 transition-all duration-500 ease-out">
                     <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner group-hover:scale-110 transition-all duration-500 transform">
                        <svg className="w-10 h-10 md:w-12 md:h-12" viewBox="0 0 24 24" fill="currentColor">
                           <rect x="5" y="13" width="3.5" height="6" rx="1.5" />
                           <rect x="10.25" y="9" width="3.5" height="10" rx="1.5" />
                           <rect x="15.5" y="5" width="3.5" height="14" rx="1.5" />
                        </svg>
                     </div>
                     <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 text-center">Upload Report</h3>
                     <p className="text-slate-400 text-xs md:text-sm text-center font-medium">Drag & drop PDF files here to start analyzing.</p>
                     
                     <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-100 flex flex-col items-center">
                        <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mb-4">Free forever for analysts</p>
                        <div className="flex gap-3">
                           <div className="w-2 h-2 rounded-full bg-blue-200 animate-bounce delay-75"></div>
                           <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-150"></div>
                           <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-300"></div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="py-20 md:py-32 bg-white px-4 md:px-6 scroll-mt-20">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                <div className="text-center lg:text-left">
                  <span className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-4 block">Free Analysis</span>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6 md:mb-8">Institutional intelligence available for all.</h2>
                  <p className="text-base md:text-lg text-slate-500 max-w-md mx-auto lg:mx-0 leading-relaxed">
                    We've built a financial operating system that streamlines your research and provides clear, actionable insights without paywalls.
                  </p>
                </div>
                <div className="space-y-8 md:space-y-12">
                   {[
                     { title: "Smarter Data Extraction", desc: "Automatically extract key financial metrics from any company's PDF report and convert them into clean, comparable insights.", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
                     { title: "Multi-sector intelligence", desc: "Whether banking, pharmaceutical, FMCG, oil & gas, or telecom — your dashboard adapts to the sector and displays the right metrics.", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                     { title: "Reliable & Transparent", desc: "View every number along with source references, confidence scores, and audit-friendly verification indicators.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.158-2.046-.452-2.992z" },
                     { title: "AI-Powered Synthesis", desc: "Beyond raw numbers, our multi-agent AI system provides investor-grade summaries and automated risk assessments.", icon: "M13 10V3L4 14h7v7l9-11h-7z" }
                   ].map((f, i) => (
                     <div key={i} className="flex flex-col sm:flex-row gap-6 group text-center sm:text-left items-center sm:items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon} /></svg>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 mb-2">{f.title}</h4>
                          <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </section>

            {/* TEAM SECTION */}
            <section id="team" className="py-20 md:py-32 bg-slate-50 px-4 md:px-6 scroll-mt-20">
              <div className="max-w-7xl mx-auto text-center">
                <span className="text-blue-600 font-black uppercase text-[10px] tracking-[0.5em] mb-4 block">Who Made It</span>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-12 md:mb-20 uppercase tracking-tighter">Meet The Team</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                   {[
                     { name: "Iqra Mahjabeen", role: "Developer" },
                     { name: "Khadija-Tul-Kubra", role: "Developer" },
                     { name: "Umair Ahmed", role: "Research Lead" }
                   ].map((m, i) => (
                     <div key={i} className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 text-slate-200 border border-slate-100">
                           <svg className="w-10 h-10 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-slate-900 mb-3">{m.name}</h4>
                        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{m.role}</span>
                     </div>
                   ))}
                </div>
              </div>
            </section>

            {/* CONTACT SECTION */}
            <section id="contact" className="py-20 md:py-32 px-4 md:px-6 scroll-mt-20">
               <div className="max-w-3xl mx-auto bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl shadow-slate-100 border border-slate-50 relative min-h-[500px] flex flex-col justify-center">
                  {contactSuccess ? (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                       <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                          <svg className="w-10 h-10 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Thank You!</h2>
                       <p className="text-slate-500 text-base md:text-lg mb-10 max-w-sm mx-auto">Your inquiry has been received. Our team will get back to you within 24 hours.</p>
                       <button 
                        onClick={() => setContactSuccess(false)}
                        className="w-full bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all"
                       >
                          Send Another Message
                       </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center mb-10 md:mb-12">
                         <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Get in Touch</h2>
                         <p className="text-slate-500 text-sm md:text-base">Have questions or feature requests? Send us a message.</p>
                      </div>
                      <form onSubmit={handleContactSubmit} className="space-y-5 md:space-y-6">
                         <div className="space-y-2">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Name</label>
                            <input 
                              type="text" 
                              required
                              value={contactForm.name}
                              onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                              placeholder="Your Name" 
                              className="w-full bg-slate-50 border-none rounded-2xl py-4 md:py-5 px-6 outline-none focus:ring-2 ring-blue-100 transition-all font-medium" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                            <input 
                              type="email" 
                              required
                              value={contactForm.email}
                              onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                              placeholder="Example@gmail.com" 
                              className="w-full bg-slate-50 border-none rounded-2xl py-4 md:py-5 px-6 outline-none focus:ring-2 ring-blue-100 transition-all font-medium" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Message</label>
                            <textarea 
                              rows={4} 
                              required
                              value={contactForm.message}
                              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                              placeholder="How can we help you?" 
                              className="w-full bg-slate-50 border-none rounded-2xl py-4 md:py-5 px-6 outline-none focus:ring-2 ring-blue-100 transition-all resize-none font-medium"
                            ></textarea>
                         </div>
                         <button 
                           type="submit" 
                           disabled={contactLoading}
                           className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-3"
                         >
                            {contactLoading ? 'Sending Inquiry...' : 'Send Message'}
                            {!contactLoading && (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                            )}
                         </button>
                      </form>
                    </>
                  )}
               </div>
            </section>

            {/* FOOTER */}
            <footer className="py-16 md:py-24 border-t border-slate-100 px-4 md:px-6">
               <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16 mb-16 md:mb-20">
                     <div className="space-y-6 md:space-y-8 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                           <div className="bg-blue-600 p-1.5 rounded-xl shadow-lg shadow-blue-200">
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="5" y="13" width="3.5" height="6" rx="1.5" />
                                <rect x="10.25" y="9" width="3.5" height="10" rx="1.5" />
                                <rect x="15.5" y="5" width="3.5" height="14" rx="1.5" />
                              </svg>
                           </div>
                           <span className="text-xl font-bold text-slate-900">Alpha<span className="text-blue-600">Insight</span></span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto sm:mx-0 font-medium">Empowering investors with institutional-grade financial analysis using advanced AI extraction.</p>
                     </div>
                     <div className="text-center sm:text-left">
                        <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-900 mb-6 md:mb-8">Quick Links</h5>
                        <ul className="space-y-4 text-sm font-bold text-slate-500">
                           <li><a href="#home" className="hover:text-blue-600 transition-colors">Home</a></li>
                           <li><a href="#features" className="hover:text-blue-600 transition-colors">Features</a></li>
                           <li><a href="#team" className="hover:text-blue-600 transition-colors">Meet the Team</a></li>
                           <li><a href="#contact" className="hover:text-blue-600 transition-colors">Get in Touch</a></li>
                        </ul>
                     </div>
                     <div className="text-center sm:text-left">
                        <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-900 mb-6 md:mb-8">Contact Info</h5>
                        <ul className="space-y-4 text-sm font-bold text-slate-500">
                           <li className="flex items-center justify-center sm:justify-start gap-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              Alphainsight@gmail.com
                           </li>
                           <li className="flex items-center justify-center sm:justify-start gap-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              Karachi, Pakistan
                           </li>
                        </ul>
                     </div>
                     <div className="text-center sm:text-left">
                        <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-900 mb-6 md:mb-8">Legal</h5>
                        <ul className="space-y-4 text-sm font-bold text-slate-500">
                           <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                           <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                        </ul>
                     </div>
                  </div>
                  <div className="pt-12 border-t border-slate-50 text-center">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 AlphaInsight. All rights reserved.</p>
                  </div>
               </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
