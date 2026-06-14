import React from 'react';

const SettingsModal = ({
  isSettingsOpen,
  setIsSettingsOpen,
  settingsTab,
  setSettingsTab,
  logs,
  isLocked,
  handleExportData,
  handleExportCSV,
  handleImportData,
  handleResetDatabase,
  handleClearLogs
}) => {
  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-scale-up">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>

        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <span>Pengaturan & Aktivitas Vault</span>
          </h3>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-slate-950/20 px-6">
          <button
            onClick={() => setSettingsTab('config')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${
              settingsTab === 'config'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Pengaturan & Backup
          </button>
          <button
            onClick={() => setSettingsTab('logs')}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              settingsTab === 'logs'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Log Aktivitas
            {logs.length > 0 && (
              <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          
          {/* TAB 1: CONFIG & BACKUP */}
          {settingsTab === 'config' && (
            <div className="space-y-6">
              {/* Backup / Export */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* JSON */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 font-sans">Cadangan Database (JSON)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Ekspor data terenkripsi. Aman disimpan di cloud atau media luar karena membutuhkan Master Password Anda untuk membukanya.
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={isLocked}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10 font-sans"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ekspor JSON Terenkripsi
                  </button>
                </div>

                {/* CSV */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1 text-red-400 font-sans">Ekspor Excel / CSV (Teks Biasa)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Unduh seluruh kredensial tanpa enkripsi (plain text). Gunakan hanya jika Anda ingin mencetak data Anda. **Beresiko Tinggi!**
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    disabled={isLocked}
                    className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-transparent text-red-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Ekspor CSV (Beresiko)
                  </button>
                </div>
              </div>

              {/* Import */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5">
                <h4 className="font-bold text-white text-sm mb-1 font-sans">Pulihkan / Impor Database</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Unggah file cadangan JSON SecurePass Anda untuk mengganti database saat ini.
                </p>
                <label className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer font-bold text-white text-xs transition flex items-center justify-center gap-2 font-sans">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Pilih File JSON & Pulihkan
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reset database section */}
              <div className="p-4 rounded-xl bg-red-950/10 border border-red-500/10 flex items-center justify-between gap-4 font-sans">
                <div>
                  <h4 className="font-bold text-red-400 text-sm mb-0.5">Reset Database</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">Hapus seluruh data terenkripsi di browser ini secara permanen.</p>
                </div>
                <button
                  onClick={handleResetDatabase}
                  className="px-4 py-2 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Hapus Semua
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVITY LOGS */}
          {settingsTab === 'logs' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Menampilkan {logs.length} riwayat aktivitas terakhir (maksimal 100 entri).</span>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-purple-400 hover:text-purple-300 font-semibold underline cursor-pointer"
                  >
                    Bersihkan Riwayat Log
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-10 text-center text-slate-500 text-sm border border-dashed border-white/5 rounded-xl">
                  Belum ada riwayat aktivitas yang tercatat.
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {logs.map((log, index) => {
                    const date = new Date(log.timestamp);
                    const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const formattedDate = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

                    return (
                      <div
                        key={index}
                        className="bg-slate-950/40 border border-white/5 rounded-lg p-3 text-xs flex justify-between items-start gap-4"
                      >
                        <span className="text-slate-300 leading-normal">{log.message}</span>
                        <div className="text-[10px] text-slate-500 shrink-0 font-mono text-right">
                          <div>{formattedTime}</div>
                          <div>{formattedDate}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="p-3 bg-slate-900/40 border border-white/5 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                💡 **Keamanan Data**: Log aktivitas ini dienkripsi penuh di browser klien menggunakan kunci master Anda. Tidak ada pihak luar yang dapat membaca log ini.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
