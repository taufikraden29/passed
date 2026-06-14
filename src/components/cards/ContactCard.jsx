import React from 'react';
import HighlightText from '../common/HighlightText';

const ContactCard = ({
  acc,
  searchQuery,
  copyToClipboard
}) => {
  return (
    <div className="space-y-2.5">
      {/* Phone number */}
      <div className="flex items-center justify-between bg-slate-950/50 px-3.5 py-2.5 rounded-xl border border-white/5 text-sm">
        <div className="truncate pr-2">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">Nomor Handphone</span>
          <a href={`tel:${acc.phoneNumber}`} className="text-emerald-400 hover:text-emerald-300 font-mono text-xs block font-bold transition">
            <HighlightText text={acc.phoneNumber} query={searchQuery} />
          </a>
        </div>
        <button
          onClick={() => copyToClipboard(acc.phoneNumber, acc.id, 'phoneNumber', 'Nomor Handphone', acc.fullName)}
          className="text-slate-400 hover:text-emerald-400 transition ml-auto shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </button>
      </div>

      {/* Email */}
      {acc.contactEmail && (
        <div className="flex items-center justify-between bg-slate-950/50 px-3.5 py-2.5 rounded-xl border border-white/5 text-sm">
          <div className="truncate pr-2">
            <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">Email</span>
            <a href={`mailto:${acc.contactEmail}`} className="text-slate-300 hover:text-white font-mono text-xs block transition">
              <HighlightText text={acc.contactEmail} query={searchQuery} />
            </a>
          </div>
          <button
            onClick={() => copyToClipboard(acc.contactEmail, acc.id, 'contactEmail', 'Email Kontak', acc.fullName)}
            className="text-slate-400 hover:text-purple-400 transition ml-auto shrink-0 cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      )}

      {/* Address */}
      {acc.address && (
        <div className="bg-slate-950/30 px-3.5 py-2.5 rounded-xl border border-white/5 text-xs">
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">Alamat</span>
          <span className="text-slate-400 leading-normal block font-medium">
            <HighlightText text={acc.address} query={searchQuery} />
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactCard;
