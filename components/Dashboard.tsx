
import React from 'react';
import { FinancialData } from '../types';
import FinancialChart from './FinancialChart';

interface DashboardProps {
  data: FinancialData;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const formatValue = (val: number) => {
    if (Math.abs(val) >= 1.0e+9) return (val / 1.0e+9).toFixed(2) + "B";
    if (Math.abs(val) >= 1.0e+6) return (val / 1.0e+6).toFixed(2) + "M";
    return new Intl.NumberFormat('en-US').format(val);
  };

  // Safe check for conclusion string
  const verdictStr = data?.invest_conclusion || '';
  const isPositiveVerdict = verdictStr.toUpperCase().includes('YES');

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700"> {/* Tightened space-y */}
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <span className="font-black text-lg md:text-xl">{data.company_name?.charAt(0) || 'C'}</span>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">{data.company_name}</h2>
            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] mt-0.5">
              FY {data.reporting_year} • {data.currency}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="w-full md:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-blue-500 transition-all text-xs active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          New Analysis
        </button>
      </div>

      {/* 2. Institutional Commentary */}
      <section className="w-full">
        <div className="bg-[#2563eb] text-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Expert Verdict</h4>
              <div className={`px-3 py-1 rounded-full text-[15px] font-black ${isPositiveVerdict ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {verdictStr}
              </div>
            </div>

            <p className="text-base md:text-xl text-slate-200 font-medium italic leading-relaxed border-l-2 border-white pl-5">
              "{data.investor_summary}"
            </p>
          </div>
        </div>
      </section>

      {/* 3. Visual Analysis Chart Section */}
      <section className="w-full">
        <div className="bg-white p-4 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <FinancialChart metrics={data.metrics} currency={data.currency} />
        </div>
      </section>

      {/* 4. Detailed Breakdown Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data.metrics || []).map((m, idx) => {
            const growth = ((m.current_year - m.previous_year) / (m.previous_year || 1)) * 100;
            const isPositive = growth >= 0;

            return (
              <div key={idx} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{m.label}</div>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatValue(m.current_year)}</h3>
                </div>

                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 border-t border-slate-50 pt-3">
                  <span>Prev. Year</span>
                  <span className="text-slate-900 font-black">{formatValue(m.previous_year)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
