import React from 'react';
import HighlightText from '../common/HighlightText';
import { getPasswordStrengthScore } from '../../utils/helpers';

const AccountCard = ({
  acc,
  searchQuery,
  showAllPasswords,
  visiblePasswords,
  togglePasswordVisibility,
  copyToClipboard,
  openEditModal,
  handleDeleteAccount
}) => {
  const strengthScore = getPasswordStrengthScore(acc.password);
  
  const daysOld = acc.updatedAt 
    ? Math.floor((new Date() - new Date(acc.updatedAt)) / (1000 * 60 * 60 * 24)) 
    : 0;

  return (
    <div className="space-y-2.5">
      {/* Username */}
      <div className="flex items-center justify-between bg-slate-950/50 px-3.5 py-2.5 rounded-xl border border-white/5 text-sm">
        <div className="truncate pr-2">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">Username / Email</span>
          <span className="text-slate-300 font-mono text-xs truncate block">
            <HighlightText text={acc.username} query={searchQuery} />
          </span>
        </div>
        <button
          onClick={() => copyToClipboard(acc.username, acc.id, 'username', 'Username', acc.title)}
          className="text-slate-400 hover:text-purple-400 transition ml-auto shrink-0 cursor-pointer"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
      </div>

      {/* Password */}
      <div className="flex items-center justify-between bg-slate-950/50 px-3.5 py-2.5 rounded-xl border border-white/5 text-sm">
        <div className="truncate pr-2">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">Password</span>
          <span className="text-slate-300 font-mono text-xs tracking-wider block">
            {showAllPasswords || visiblePasswords[acc.id] ? acc.password : '••••••••••••••••'}
          </span>
        </div>
        <div className="flex items-center gap-2.5 ml-auto shrink-0">
          <button
            onClick={() => togglePasswordVisibility(acc.id)}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            {visiblePasswords[acc.id] ? (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => copyToClipboard(acc.password, acc.id, 'password', 'Password', acc.title)}
            className="text-slate-400 hover:text-purple-400 transition cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
