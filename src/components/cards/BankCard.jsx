import React from 'react';
import HighlightText from '../common/HighlightText';
import { formatBankNumber } from '../../utils/helpers';

/**
 * BankCard Component
 * Renders bank accounts in a premium debit card styled design with a formatted transfer details copy button.
 */
const BankCard = ({
  acc,
  searchQuery,
  copyToClipboard
}) => {
  const formattedBankNumber = formatBankNumber(acc.bankAccountNumber);

  return (
    <div className="relative rounded-2xl p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 overflow-hidden shadow-inner flex flex-col justify-between h-40">
      {/* Card Glow Effect */}
      <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl"></div>
      
      {/* Card Top: Logo & Chip */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest text-slate-400 font-bold font-mono">REKENING BANK</span>
        {/* stylized bank chip */}
        <div className="w-8 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-md border border-amber-300/20 shadow-inner flex items-center justify-around p-0.5">
          <div className="w-px h-full bg-amber-900/30"></div>
          <div className="w-px h-full bg-amber-900/30"></div>
          <div className="w-px h-full bg-amber-900/30"></div>
        </div>
      </div>

      {/* Card Middle: Bank Name & Account Number */}
      <div className="my-2.5">
        <div className="text-slate-400 text-[10px] font-bold tracking-wider font-mono">{acc.bankName}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white text-base font-mono font-bold tracking-widest leading-none">
            <HighlightText text={formattedBankNumber} query={searchQuery} />
          </span>
          <button
            onClick={() => copyToClipboard(acc.bankAccountNumber, acc.id, 'bankAccountNumber', 'Nomor Rekening', acc.bankName)}
            className="text-slate-400 hover:text-cyan-300 transition shrink-0 cursor-pointer"
            title="Salin Rekening"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Bottom: Holder Name & Format Copy Action */}
      <div className="flex items-end justify-between border-t border-white/5 pt-2">
        <div className="truncate pr-2">
          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-semibold font-sans">Pemilik Rekening</span>
          <span className="text-slate-300 text-xs font-semibold block truncate max-w-[130px]">
            <HighlightText text={acc.bankBankAccountHolder} query={searchQuery} />
          </span>
        </div>
        
        <button
          onClick={() => {
            const copyFormat = `Bank ${acc.bankName} ${acc.bankAccountNumber} a/n ${acc.bankBankAccountHolder}`;
            copyToClipboard(copyFormat, acc.id, 'bankCopyFormat', 'Format Transfer', acc.bankName);
          }}
          className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1 font-sans shrink-0"
          title="Salin info rekening lengkap untuk transfer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Salin Format
        </button>
      </div>
    </div>
  );
};

export default BankCard;
