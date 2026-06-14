import React from 'react';

const ContactForm = ({
  formFullName,
  setFormFullName,
  formPhoneNumber,
  setFormPhoneNumber,
  formContactEmail,
  setFormContactEmail,
  formAddress,
  setFormAddress
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nama Lengkap</label>
          <input
            type="text"
            value={formFullName}
            onChange={(e) => setFormFullName(e.target.value)}
            placeholder="Nama lengkap kontak..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nomor Handphone</label>
          <input
            type="text"
            value={formPhoneNumber}
            onChange={(e) => setFormPhoneNumber(e.target.value)}
            placeholder="081234567890..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition font-mono"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Email (Opsional)</label>
        <input
          type="email"
          value={formContactEmail}
          onChange={(e) => setFormContactEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Alamat (Opsional)</label>
        <input
          type="text"
          value={formAddress}
          onChange={(e) => setFormAddress(e.target.value)}
          placeholder="Alamat rumah, kantor, atau domisili..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
        />
      </div>
    </div>
  );
};

export default ContactForm;
