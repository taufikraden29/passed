import React from 'react';

const AccountForm = ({
  formTitle,
  setFormTitle,
  formCategory,
  setFormCategory,
  formUsername,
  setFormUsername,
  formPassword,
  setFormPassword,
  formUrl,
  setFormUrl,
  copyToClipboard,
  pwdStrength,
  genLength,
  setGenLength,
  genUppercase,
  setGenUppercase,
  genNumbers,
  setGenNumbers,
  genSymbols,
  setGenSymbols,
  generatePassword
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nama Layanan</label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Gmail, Mandiri Online, Github..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Kategori</label>
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white focus:border-purple-500 focus:outline-none text-sm transition cursor-pointer"
          >
            <option value="Personal">Personal</option>
            <option value="Finansial">Finansial</option>
            <option value="Media Sosial">Media Sosial</option>
            <option value="Pekerjaan">Pekerjaan</option>
          </select>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Username / Email</label>
        <input
          type="text"
          value={formUsername}
          onChange={(e) => setFormUsername(e.target.value)}
          placeholder="Masukkan username atau email..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
          required
        />
      </div>

      {/* Password & Generator Container */}
      <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Password</label>
          <div className="relative">
            <input
              type="text"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Masukkan sandi..."
              className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-xs transition font-mono"
              required
            />
            <button
              type="button"
              onClick={() => copyToClipboard(formPassword, 'form-pwd', 'password', 'Password')}
              className="absolute right-3.5 inset-y-0 text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer shrink-0"
            >
              Salin
            </button>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {formPassword && (
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Kekuatan:</span>
              <span className={`font-semibold ${
                pwdStrength.score >= 4 ? 'text-emerald-400' : pwdStrength.score >= 3 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {pwdStrength.label}
              </span>
            </div>
            {/* Visual bar meter */}
            <div className="flex gap-1 w-24 h-1.5 rounded bg-slate-800 overflow-hidden">
              <div className={`strength-bar h-full ${pwdStrength.color}`} style={{ width: `${(pwdStrength.score / 5) * 100}%` }}></div>
            </div>
          </div>
        )}

        {/* Password Generator controls */}
        <div className="pt-3.5 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Password Generator</span>
            <span className="text-xs text-purple-300 font-mono font-bold">{genLength} Karakter</span>
          </div>

          {/* Range slider for length */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={8}
              max={32}
              value={genLength}
              onChange={(e) => setGenLength(Number(e.target.value))}
              className="flex-1 accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                <input type="checkbox" checked={genUppercase} onChange={(e) => setGenUppercase(e.target.checked)} className="accent-purple-500" />
                <span>Kapital</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                <input type="checkbox" checked={genNumbers} onChange={(e) => setGenNumbers(e.target.checked)} className="accent-purple-500" />
                <span>Angka</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                <input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} className="accent-purple-500" />
                <span>Simbol</span>
              </label>
            </div>
            <button
              type="button"
              onClick={generatePassword}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-transparent text-purple-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Acak Sandi
            </button>
          </div>
        </div>
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Website URL (Opsional)</label>
        <input
          type="text"
          value={formUrl}
          onChange={(e) => setFormUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
        />
      </div>
    </div>
  );
};

export default AccountForm;
