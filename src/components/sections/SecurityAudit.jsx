import React from 'react';

/**
 * SecurityAudit Component
 * Renders the real-time password security audit statistics dashboard section.
 */
export default function SecurityAudit({ accounts, auditStats }) {
  if (!accounts || accounts.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/5 bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white font-sans">Security Audit Vault</h4>
          <p className="text-xs text-slate-400">Menjaga kesehatan keamanan sandi-sandi penting Anda secara real-time.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 text-center min-w-[100px]">
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Sandi Lemah</span>
          <span className={`text-base font-bold ${auditStats.weakCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {auditStats.weakCount} akun
          </span>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 text-center min-w-[100px]">
          <span className="text-[10px] text-slate-500 uppercase block font-bold">Sandi Ganda</span>
          <span className={`text-base font-bold ${auditStats.reusedCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {auditStats.reusedCount} akun
          </span>
        </div>
      </div>
    </div>
  );
}
