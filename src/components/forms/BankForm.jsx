import React from 'react';

/**
 * BankForm Component
 * Input fields for bank name, account holder name, and account number.
 */
const BankForm = ({
  formBankName,
  setFormBankName,
  formBankAccountNumber,
  setFormBankAccountNumber,
  formBankAccountHolder,
  setFormBankAccountHolder
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bank Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nama Bank</label>
          <input
            type="text"
            value={formBankName}
            onChange={(e) => setFormBankName(e.target.value)}
            placeholder="BCA, Mandiri, BNI, BRI..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
            required
          />
        </div>

        {/* Holder Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nama Pemilik Rekening</label>
          <input
            type="text"
            value={formBankAccountHolder}
            onChange={(e) => setFormBankAccountHolder(e.target.value)}
            placeholder="Nama lengkap pemilik..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
            required
          />
        </div>
      </div>

      {/* Account Number */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nomor Rekening</label>
        <input
          type="text"
          value={formBankAccountNumber}
          onChange={(e) => setFormBankAccountNumber(e.target.value)}
          placeholder="Masukkan nomor rekening bank..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition font-mono"
          required
        />
      </div>
    </div>
  );
};

export default BankForm;
