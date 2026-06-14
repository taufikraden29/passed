import React from 'react';
import AccountForm from '../forms/AccountForm';
import BankForm from '../forms/BankForm';
import ContactForm from '../forms/ContactForm';

const AddEditModal = ({
  isAddEditOpen,
  closeAddEditModal,
  editingAccount,
  formType,
  setFormType,
  handleSaveAccount,
  
  // Akun states
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
  
  // Generator states
  genLength,
  setGenLength,
  genUppercase,
  setGenUppercase,
  genNumbers,
  setGenNumbers,
  genSymbols,
  setGenSymbols,
  generatePassword,

  // Rekening Bank states
  formBankName,
  setFormBankName,
  formBankAccountNumber,
  setFormBankAccountNumber,
  formBankAccountHolder,
  setFormBankAccountHolder,

  // Kontak states
  formFullName,
  setFormFullName,
  formPhoneNumber,
  setFormPhoneNumber,
  formContactEmail,
  setFormContactEmail,
  formAddress,
  setFormAddress,

  // Common states
  formTags,
  setFormTags,
  formNotes,
  setFormNotes
}) => {
  if (!isAddEditOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative animate-scale-up">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {editingAccount ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className="font-sans">
              {editingAccount 
                ? `Edit ${formType === 'akun' ? 'Akun' : formType === 'rekening' ? 'Rekening' : 'Kontak'}` 
                : `Tambah ${formType === 'akun' ? 'Akun Baru' : formType === 'rekening' ? 'Rekening Bank' : 'Kontak Baru'}`}
            </span>
          </h3>
          <button
            type="button"
            onClick={closeAddEditModal}
            className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSaveAccount} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Type Tabs Selection (Only when adding new) */}
          {!editingAccount && (
            <div className="flex border-b border-white/5 bg-slate-950/40 mb-4 rounded-xl p-1 gap-1">
              {[
                { id: 'akun', label: 'Akun' },
                { id: 'rekening', label: 'Rekening Bank' },
                { id: 'kontak', label: 'Kontak' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormType(tab.id)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    formType === tab.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* DYNAMIC FORM RENDERING */}
          {formType === 'akun' && (
            <AccountForm
              formTitle={formTitle}
              setFormTitle={setFormTitle}
              formCategory={formCategory}
              setFormCategory={setFormCategory}
              formUsername={formUsername}
              setFormUsername={setFormUsername}
              formPassword={formPassword}
              setFormPassword={setFormPassword}
              formUrl={formUrl}
              setFormUrl={setFormUrl}
              copyToClipboard={copyToClipboard}
              pwdStrength={pwdStrength}
              genLength={genLength}
              setGenLength={setGenLength}
              genUppercase={genUppercase}
              setGenUppercase={setGenUppercase}
              genNumbers={genNumbers}
              setGenNumbers={setGenNumbers}
              genSymbols={genSymbols}
              setGenSymbols={setGenSymbols}
              generatePassword={generatePassword}
            />
          )}

          {formType === 'rekening' && (
            <BankForm
              formBankName={formBankName}
              setFormBankName={setFormBankName}
              formBankAccountNumber={formBankAccountNumber}
              setFormBankAccountNumber={setFormBankAccountNumber}
              formBankAccountHolder={formBankAccountHolder}
              setFormBankAccountHolder={setFormBankAccountHolder}
            />
          )}

          {formType === 'kontak' && (
            <ContactForm
              formFullName={formFullName}
              setFormFullName={setFormFullName}
              formPhoneNumber={formPhoneNumber}
              setFormPhoneNumber={setFormPhoneNumber}
              formContactEmail={formContactEmail}
              setFormContactEmail={setFormContactEmail}
              formAddress={formAddress}
              setFormAddress={setFormAddress}
            />
          )}

          {/* COMMON FIELDS: TAGS & NOTES */}
          <div className="pt-2 border-t border-white/5 space-y-4">
            {/* Custom Tags input */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Tag (Pisahkan dengan koma)</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="misal: penting, pribadi, kantor, prioritas..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Catatan (Opsional)</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={
                  formType === 'akun'
                    ? 'Masukkan nomor pin recovery, petunjuk keamanan, atau info penting...'
                    : formType === 'rekening'
                      ? 'Masukkan cabang bank, limit harian, atau info pin lainnya...'
                      : 'Hubungan dengan kontak, tanggal lahir, atau informasi lainnya...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition h-20 resize-none"
              />
            </div>
          </div>

          {/* Modal Footer actions */}
          <div className="pt-4.5 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeAddEditModal}
              className="px-4.5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition text-slate-300 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-lg shadow-purple-500/10 cursor-pointer font-sans"
            >
              {editingAccount 
                ? 'Simpan Perubahan' 
                : formType === 'akun'
                  ? 'Simpan Kredensial'
                  : formType === 'rekening'
                    ? 'Simpan Rekening'
                    : 'Simpan Kontak'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditModal;
