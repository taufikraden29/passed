import React, { useState, useEffect, useRef } from 'react';
import {
  deriveKey,
  encryptData,
  decryptData,
  generateSalt
} from './utils/crypto';

// Text Highlighting Component for search results
const HighlightText = ({ text = '', query = '' }) => {
  if (!query) return <span>{text}</span>;
  
  // Escape regex characters
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-purple-500/40 text-purple-200 border-b border-purple-400 rounded-sm px-0.5">{part}</mark>
          : part
      )}
    </span>
  );
};

// Custom Toast notification component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full font-sans">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="glass-panel rounded-xl p-4 shadow-xl flex items-center justify-between border-l-4 border-l-purple-500 animate-slide-in"
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <span className="text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            ) : (
              <span className="text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            )}
            <p className="text-sm font-medium text-slate-200">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white transition ml-3 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

// Consistent colorful gradient based on service name
const getGradientStyle = (text = 'A') => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-teal-500 to-emerald-500',
    'from-amber-500 to-orange-500',
    'from-fuchsia-500 to-purple-600'
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function App() {
  // Authentication & Vault State
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [derivedKey, setDerivedKey] = useState(null);
  const [authError, setAuthError] = useState('');

  // Accounts state (decrypted in memory)
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // Activity logs state (decrypted in memory)
  const [logs, setLogs] = useState([]);

  // Global show password toggle
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('config'); // 'config' or 'logs'

  // Quick Copy Feedback states
  const [copiedId, setCopiedId] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // Toasts notifications list
  const [toasts, setToasts] = useState([]);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');

  // Password Generator Configuration
  const [genLength, setGenLength] = useState(16);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  // Password Visibility toggles
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Auto-lock setup
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const activityTimer = useRef(null);

  // Security Audit statistics
  const [auditStats, setAuditStats] = useState({ weakCount: 0, reusedCount: 0 });

  // Password Strength State (Calculated live from formPassword)
  const [pwdStrength, setPwdStrength] = useState({ score: 0, label: 'Kosong', color: 'bg-slate-700' });

  const categories = ['Semua', 'Personal', 'Finansial', 'Media Sosial', 'Pekerjaan'];

  // Calculate password strength score (0 to 5) helper
  const getPasswordStrengthScore = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 14) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  // Run security audit on accounts
  useEffect(() => {
    if (isLocked || accounts.length === 0) {
      setAuditStats({ weakCount: 0, reusedCount: 0 });
      return;
    }

    let weak = 0;
    const passwordCounts = {};

    accounts.forEach(acc => {
      const score = getPasswordStrengthScore(acc.password);
      if (score <= 2) weak++;

      if (acc.password) {
        passwordCounts[acc.password] = (passwordCounts[acc.password] || 0) + 1;
      }
    });

    let reused = 0;
    Object.values(passwordCounts).forEach(count => {
      if (count > 1) {
        reused += count;
      }
    });

    setAuditStats({ weakCount: weak, reusedCount: reused });
  }, [accounts, isLocked]);

  // Init check and .env Auto-Unlock / Auto-Initialize integration
  useEffect(() => {
    const salt = localStorage.getItem('sp_salt');
    const token = localStorage.getItem('sp_token');
    const hasDb = !!(salt && token);
    setHasMasterPassword(hasDb);

    // Check if master password is provided in .env
    const envMasterPassword = import.meta.env.VITE_MASTER_PASSWORD;

    if (envMasterPassword && envMasterPassword.length >= 8) {
      if (!hasDb) {
        // Auto-initialize vault with .env password
        const initEnvVault = async () => {
          try {
            const newSalt = generateSalt();
            const key = await deriveKey(envMasterPassword, newSalt);
            const tokenObj = await encryptData('securepass_verified', key);
            
            localStorage.setItem('sp_salt', newSalt);
            localStorage.setItem('sp_token', JSON.stringify(tokenObj));
            localStorage.setItem('sp_accounts', JSON.stringify([]));

            setDerivedKey(key);
            setAccounts([]);
            setIsLocked(false);
            setHasMasterPassword(true);
            
            // Decrypt empty logs
            await loadAndDecryptLogs(key);
            await addLogEntry('Inisialisasi vault otomatis menggunakan .env', key);
            showToast('Vault otomatis diinisialisasi menggunakan .env', 'success');
          } catch (err) {
            console.error('Failed to auto-init vault with env password:', err);
          }
        };
        initEnvVault();
      } else {
        // Auto-unlock vault with .env password
        const unlockEnvVault = async () => {
          try {
            const tokenObj = JSON.parse(token);
            const key = await deriveKey(envMasterPassword, salt);
            const verified = await decryptData(tokenObj.ciphertext, tokenObj.iv, key);
            
            if (verified === 'securepass_verified') {
              setDerivedKey(key);
              setIsLocked(false);
              await loadAndDecryptAccounts(key);
              await loadAndDecryptLogs(key);
              await addLogEntry('Vault dibuka otomatis menggunakan konfigurasi .env', key);
              showToast('Vault otomatis dibuka menggunakan .env', 'success');
            } else {
              setAuthError('Kunci master di .env tidak cocok dengan database saat ini.');
            }
          } catch (err) {
            setAuthError('Gagal mendekripsi database otomatis via .env.');
          }
        };
        unlockEnvVault();
      }
    }
  }, []);

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 2500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Decrypt accounts helper
  const loadAndDecryptAccounts = async (key) => {
    if (!key) return;
    const encAccountsStr = localStorage.getItem('sp_accounts');
    if (!encAccountsStr) {
      setAccounts([]);
      return;
    }
    try {
      const encAccounts = JSON.parse(encAccountsStr);
      const decryptedAccounts = [];
      for (const item of encAccounts) {
        try {
          const decryptedStr = await decryptData(item.ciphertext, item.iv, key);
          const accountData = JSON.parse(decryptedStr);
          decryptedAccounts.push({
            id: item.id,
            ...accountData
          });
        } catch (e) {
          console.error(`Gagal mendekripsi akun dengan ID ${item.id}:`, e);
        }
      }
      setAccounts(decryptedAccounts);
    } catch (err) {
      console.error('Failed to decrypt accounts list:', err);
      setAccounts([]);
    }
  };

  // Activity logs helper
  const loadAndDecryptLogs = async (key) => {
    const encLogsStr = localStorage.getItem('sp_logs');
    if (!encLogsStr) {
      setLogs([]);
      return;
    }
    try {
      const encLogsObj = JSON.parse(encLogsStr);
      const decryptedLogsStr = await decryptData(encLogsObj.ciphertext, encLogsObj.iv, key);
      setLogs(JSON.parse(decryptedLogsStr));
    } catch (err) {
      console.error('Failed to decrypt logs:', err);
      setLogs([]);
    }
  };

  const addLogEntry = async (actionMessage, key = derivedKey) => {
    if (!key) return;
    const now = new Date().toISOString();
    const newEntry = { timestamp: now, message: actionMessage };
    
    // Get existing logs
    const encLogsStr = localStorage.getItem('sp_logs');
    let decLogs = [];
    if (encLogsStr) {
      try {
        const encLogsObj = JSON.parse(encLogsStr);
        const decryptedLogsStr = await decryptData(encLogsObj.ciphertext, encLogsObj.iv, key);
        decLogs = JSON.parse(decryptedLogsStr);
      } catch (e) {
        console.error('Failed to load logs before writing:', e);
      }
    }

    // Append and keep only the latest 100 entries to prevent localStorage bloat
    const updatedLogs = [newEntry, ...decLogs].slice(0, 100);
    setLogs(updatedLogs);

    // Encrypt and save back
    try {
      const encryptedLogs = await encryptData(JSON.stringify(updatedLogs), key);
      localStorage.setItem('sp_logs', JSON.stringify(encryptedLogs));
    } catch (e) {
      console.error('Failed to encrypt and save logs:', e);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus seluruh riwayat log aktivitas?')) return;
    setLogs([]);
    try {
      const encryptedLogs = await encryptData(JSON.stringify([]), derivedKey);
      localStorage.setItem('sp_logs', JSON.stringify(encryptedLogs));
      showToast('Log aktivitas berhasil dibersihkan.');
    } catch (e) {
      showToast('Gagal membersihkan log.', 'error');
    }
  };

  // Activity timer listener for Auto-lock
  const resetActivityTimer = () => {
    if (isLocked) return;
    if (activityTimer.current) clearTimeout(activityTimer.current);
    
    activityTimer.current = setTimeout(() => {
      if (!import.meta.env.VITE_MASTER_PASSWORD) {
        handleLock();
        showToast('Vault terkunci otomatis karena tidak aktif.', 'error');
      }
    }, autoLockMinutes * 60 * 1000);
  };

  useEffect(() => {
    if (!isLocked) {
      window.addEventListener('mousemove', resetActivityTimer);
      window.addEventListener('keypress', resetActivityTimer);
      window.addEventListener('click', resetActivityTimer);
      resetActivityTimer();
    }
    return () => {
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keypress', resetActivityTimer);
      window.removeEventListener('click', resetActivityTimer);
      if (activityTimer.current) clearTimeout(activityTimer.current);
    };
  }, [isLocked, autoLockMinutes]);

  // Live password strength calculation
  useEffect(() => {
    const score = getPasswordStrengthScore(formPassword);
    if (score === 0) {
      setPwdStrength({ score: 0, label: 'Kosong', color: 'bg-slate-700' });
      return;
    }

    let label = 'Sangat Lemah';
    let color = 'bg-red-500';
    
    if (score >= 5) {
      label = 'Sangat Kuat 🔒';
      color = 'bg-emerald-400';
    } else if (score >= 4) {
      label = 'Kuat';
      color = 'bg-teal-400';
    } else if (score >= 3) {
      label = 'Sedang';
      color = 'bg-amber-400';
    } else if (score >= 2) {
      label = 'Lemah';
      color = 'bg-orange-400';
    }

    setPwdStrength({ score, label, color });
  }, [formPassword]);

  // Reset database completely
  const handleResetDatabase = () => {
    if (confirm('APAKAH ANDA YAKIN?\n\nTindakan ini akan menghapus seluruh database lokal (localStorage) secara permanen. Semua akun yang tercatat akan hilang.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Actions
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (masterPassword.length < 8) {
      setAuthError('Master Password minimal harus 8 karakter.');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setAuthError('Konfirmasi password tidak cocok.');
      return;
    }

    try {
      const salt = generateSalt();
      const key = await deriveKey(masterPassword, salt);
      const tokenObj = await encryptData('securepass_verified', key);
      
      localStorage.setItem('sp_salt', salt);
      localStorage.setItem('sp_token', JSON.stringify(tokenObj));
      localStorage.setItem('sp_accounts', JSON.stringify([]));

      setDerivedKey(key);
      setAccounts([]);
      setIsLocked(false);
      setHasMasterPassword(true);
      setMasterPassword('');
      setConfirmPassword('');
      await loadAndDecryptLogs(key);
      await addLogEntry('Inisialisasi Master Password & Vault baru', key);
      showToast('Vault berhasil dibuat! Selamat datang.', 'success');
    } catch (err) {
      setAuthError('Gagal inisialisasi: ' + err.message);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');

    const salt = localStorage.getItem('sp_salt');
    const tokenStr = localStorage.getItem('sp_token');

    try {
      const tokenObj = JSON.parse(tokenStr);
      const key = await deriveKey(masterPassword, salt);
      const verified = await decryptData(tokenObj.ciphertext, tokenObj.iv, key);
      
      if (verified === 'securepass_verified') {
        setDerivedKey(key);
        setIsLocked(false);
        setMasterPassword('');
        await loadAndDecryptAccounts(key);
        await loadAndDecryptLogs(key);
        await addLogEntry('Vault dibuka secara manual menggunakan Master Password', key);
        showToast('Vault berhasil dibuka.', 'success');
      } else {
        setAuthError('Master Password salah.');
      }
    } catch (err) {
      setAuthError('Gagal masuk. Sandi salah atau data korup.');
    }
  };

  const handleLock = () => {
    setDerivedKey(null);
    setAccounts([]);
    setLogs([]);
    setIsLocked(true);
    setAuthError('');
    setVisiblePasswords({});
    setShowAllPasswords(false);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!formTitle || !formUsername || !formPassword) {
      showToast('Judul, Username, & Password wajib diisi!', 'error');
      return;
    }

    // Clean tags safely
    const tagsArray = (formTags || '')
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const nowStr = new Date().toISOString();

    const accountData = {
      title: formTitle,
      category: formCategory,
      username: formUsername,
      password: formPassword,
      url: formUrl,
      notes: formNotes,
      tags: tagsArray,
      createdAt: editingAccount ? (editingAccount.createdAt || editingAccount.updatedAt || nowStr) : nowStr,
      updatedAt: nowStr
    };

    try {
      const encryptedObj = await encryptData(JSON.stringify(accountData), derivedKey);
      const encAccountsStr = localStorage.getItem('sp_accounts') || '[]';
      let encAccounts = JSON.parse(encAccountsStr);

      if (editingAccount) {
        encAccounts = encAccounts.map(item => 
          item.id === editingAccount.id 
            ? { ...item, ciphertext: encryptedObj.ciphertext, iv: encryptedObj.iv }
            : item
        );
        
        // Safeguard: Ensure log failure doesn't block saving the account
        try {
          await addLogEntry(`Mengubah kredensial akun: [${formTitle}]`);
        } catch (logErr) {
          console.error('Logging failed:', logErr);
        }
        
        showToast('Akun berhasil diperbarui.');
      } else {
        encAccounts.push({
          id: Date.now().toString(),
          ciphertext: encryptedObj.ciphertext,
          iv: encryptedObj.iv
        });
        
        // Safeguard: Ensure log failure doesn't block saving the account
        try {
          await addLogEntry(`Menambahkan kredensial akun baru: [${formTitle}]`);
        } catch (logErr) {
          console.error('Logging failed:', logErr);
        }
        
        showToast('Akun baru berhasil ditambahkan.');
      }

      localStorage.setItem('sp_accounts', JSON.stringify(encAccounts));
      await loadAndDecryptAccounts(derivedKey);
      closeAddEditModal();
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    }
  };

  const handleDeleteAccount = async (id) => {
    const accToDelete = accounts.find(a => a.id === id);
    if (!accToDelete) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus akun [${accToDelete.title}]?`)) return;

    const encAccountsStr = localStorage.getItem('sp_accounts') || '[]';
    let encAccounts = JSON.parse(encAccountsStr);
    encAccounts = encAccounts.filter(item => item.id !== id);
    
    localStorage.setItem('sp_accounts', JSON.stringify(encAccounts));
    
    // Safeguard logging
    try {
      await addLogEntry(`Menghapus kredensial akun: [${accToDelete.title}]`);
    } catch (logErr) {
      console.error('Logging failed:', logErr);
    }
    
    loadAndDecryptAccounts(derivedKey);
    showToast('Akun berhasil dihapus.', 'success');
  };

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = lowercase;
    if (genUppercase) pool += uppercase;
    if (genNumbers) pool += numbers;
    if (genSymbols) pool += symbols;

    let generated = '';
    for (let i = 0; i < genLength; i++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      generated += pool[randomIndex];
    }
    setFormPassword(generated);
    showToast('Sandi acak dibuat.', 'success');
  };

  const copyToClipboard = async (text, id, field, labelName = 'Data', serviceTitle = '') => {
    navigator.clipboard.writeText(text).then(async () => {
      setCopiedId(id);
      setCopiedField(field);
      showToast(`${labelName} disalin ke clipboard!`);
      const details = serviceTitle ? ` untuk akun [${serviceTitle}]` : '';
      
      // Safeguard logging
      try {
        await addLogEntry(`Menyalin ${labelName.toLowerCase()}${details} ke clipboard`);
      } catch (logErr) {
        console.error('Logging failed:', logErr);
      }
      
      setTimeout(() => {
        setCopiedId(null);
        setCopiedField('');
      }, 2000);
    });
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setFormTitle('');
    setFormCategory('Personal');
    setFormUsername('');
    setFormPassword('');
    setFormUrl('');
    setFormNotes('');
    setFormTags('');
    setIsAddEditOpen(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormTitle(account.title);
    setFormCategory(account.category);
    setFormUsername(account.username);
    setFormPassword(account.password);
    setFormUrl(account.url || '');
    setFormNotes(account.notes || '');
    setFormTags(account.tags ? account.tags.join(', ') : '');
    setIsAddEditOpen(true);
  };

  const closeAddEditModal = () => {
    setIsAddEditOpen(false);
    setEditingAccount(null);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExportData = async () => {
    try {
      const salt = localStorage.getItem('sp_salt');
      const token = localStorage.getItem('sp_token');
      const accounts = localStorage.getItem('sp_accounts');

      const backupData = {
        version: '1.0.0',
        salt,
        token: JSON.parse(token),
        accounts: JSON.parse(accounts)
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SecurePass-Backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      try {
        await addLogEntry('Mengekspor cadangan database JSON terenkripsi');
      } catch (logErr) {
        console.error(logErr);
      }
      
      showToast('Cadangan terenkripsi berhasil diunduh.', 'success');
    } catch (err) {
      showToast('Gagal ekspor: ' + err.message, 'error');
    }
  };

  const handleExportCSV = async () => {
    if (!confirm('PERINGATAN KEAMANAN TINGGI!\n\nEkspor ke CSV akan menyimpan seluruh password Anda dalam bentuk TEKS BIASA (tidak terenkripsi). Siapa saja yang membuka file ini bisa melihat semua password Anda.\n\nApakah Anda benar-benar ingin melanjutkan?')) {
      return;
    }

    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Judul,Kategori,Username,Password,URL,Catatan,Tag,DibuatAt,DiubahAt\n';

      accounts.forEach(acc => {
        const title = `"${(acc.title || '').replace(/"/g, '""')}"`;
        const cat = `"${(acc.category || '').replace(/"/g, '""')}"`;
        const user = `"${(acc.username || '').replace(/"/g, '""')}"`;
        const pwd = `"${(acc.password || '').replace(/"/g, '""')}"`;
        const url = `"${(acc.url || '').replace(/"/g, '""')}"`;
        const notes = `"${(acc.notes || '').replace(/"/g, '""')}"`;
        const tags = `"${(acc.tags ? acc.tags.join(', ') : '').replace(/"/g, '""')}"`;
        const created = `"${acc.createdAt || ''}"`;
        const updated = `"${acc.updatedAt || ''}"`;
        
        csvContent += `${title},${cat},${user},${pwd},${url},${notes},${tags},${created},${updated}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SecurePass-PlainText-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      try {
        await addLogEntry('Mengekspor seluruh kredensial ke file CSV teks biasa (Tindakan berisiko)');
      } catch (logErr) {
        console.error(logErr);
      }
      
      showToast('File CSV Plain Text berhasil diunduh.', 'success');
    } catch (err) {
      showToast('Gagal ekspor CSV: ' + err.message, 'error');
    }
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.salt || !data.token || !data.accounts) {
          showToast('Format backup tidak valid!', 'error');
          return;
        }

        if (confirm('Menimpa semua data aktif saat ini? Tindakan ini tidak bisa dibatalkan.')) {
          localStorage.setItem('sp_salt', data.salt);
          localStorage.setItem('sp_token', JSON.stringify(data.token));
          localStorage.setItem('sp_accounts', JSON.stringify(data.accounts));
          
          showToast('Data diimpor! Masuk dengan Master Password cadangan.', 'success');
          setHasMasterPassword(true);
          handleLock();
          setIsSettingsOpen(false);
        }
      } catch (err) {
        showToast('Gagal memproses file cadangan.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const filteredAccounts = accounts.filter(acc => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      acc.title?.toLowerCase().includes(query) ||
      acc.username?.toLowerCase().includes(query) ||
      acc.url?.toLowerCase().includes(query) ||
      acc.tags?.some(tag => tag.toLowerCase().includes(query));
    const matchesCategory = activeCategory === 'Semua' || acc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen bg-[#070a13] text-[#e2e8f0] overflow-hidden flex flex-col font-sans">
      {/* Background soft lighting */}
      <div className="bg-glow top-0 left-10"></div>
      <div className="bg-glow bottom-0 right-10" style={{ animationDelay: '-6s' }}></div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-white/5 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <svg className="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent font-sans">SecurePass</h1>
            <span className="text-[10px] text-purple-400 font-mono tracking-widest uppercase block -mt-1 font-semibold">Local-First Vault</span>
          </div>
        </div>

        {!isLocked && (
          <div className="flex items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setSettingsTab('config');
                setIsSettingsOpen(true);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Pengaturan & Log
            </button>
            <button
              onClick={handleLock}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 transition flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Kunci Vault
            </button>
          </div>
        )}
      </header>

      {/* Main viewport */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col justify-center">
        {isLocked ? (
          <div className="w-full max-w-md mx-auto">
            {!hasMasterPassword ? (
              /* REGISTRATION SCREEN */
              <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-scale-up">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                <h2 className="text-2xl font-bold text-white mb-2 text-center font-sans">Setel Master Password</h2>
                <p className="text-sm text-slate-400 text-center mb-6">
                  Vault Anda akan dienkripsi secara lokal menggunakan algoritma AES-256. Password ini tidak dikirim ke internet.
                </p>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Master Password Baru</label>
                    <input
                      type="password"
                      placeholder="Minimal 8 karakter..."
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-sm transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Konfirmasi Password</label>
                    <input
                      type="password"
                      placeholder="Masukkan ulang password..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-sm transition"
                      required
                    />
                  </div>
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs text-center">
                      ⚠️ {authError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-white transition duration-200 shadow-lg shadow-purple-500/15 cursor-pointer font-sans"
                  >
                    Inisialisasi Vault
                  </button>
                </form>
              </div>
            ) : (
              /* UNLOCK SCREEN */
              <div className="glass-panel rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-scale-up">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                
                {/* Pulsing lock ring */}
                <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-purple-500/20 bg-purple-500/5 animate-pulse"></div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 relative">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1.5 text-center font-sans">Masukkan Kunci Vault</h2>
                <p className="text-xs text-slate-400 text-center mb-6">
                  Gunakan Master Password untuk mendekripsi data kredensial Anda.
                </p>
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      placeholder="Master Password..."
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-950/60 border border-white/10 focus:border-purple-500 focus:outline-none text-white text-center text-sm transition"
                      required
                      autoFocus
                    />
                  </div>
                  {authError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs text-center flex flex-col gap-2">
                      <span>{authError}</span>
                      <button
                        type="button"
                        onClick={handleResetDatabase}
                        className="text-orange-400 underline font-semibold hover:text-orange-300 transition text-[11px] cursor-pointer"
                      >
                        Reset Database & Hapus Data Lama?
                      </button>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold text-white transition duration-200 shadow-lg shadow-purple-500/15 cursor-pointer font-sans"
                  >
                    Buka Vault
                  </button>
                </form>
                <div className="mt-6 text-center flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setSettingsTab('config');
                      setIsSettingsOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-purple-400 transition hover:underline"
                  >
                    Impor file cadangan untuk memulihkan?
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MAIN APP INTERFACE (UNLOCKED) */
          <div className="flex-1 flex flex-col gap-6 animate-scale-up">
            
            {/* COLLAPSIBLE SECURITY AUDIT SYSTEM */}
            {accounts.length > 0 && (
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
            )}

            {/* Dashboard top section */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Search input */}
              <div className="relative w-full lg:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari nama layanan, username, URL, atau tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-purple-500 focus:outline-none text-sm placeholder-slate-500 transition"
                />
              </div>

              {/* Add account button, lock all toggle, and timeout config */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-stretch sm:justify-end gap-3">
                {/* Global show all passwords button */}
                {accounts.length > 0 && (
                  <button
                    onClick={() => setShowAllPasswords(!showAllPasswords)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto ${
                      showAllPasswords 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {showAllPasswords ? 'Sembunyikan Semua' : 'Tampilkan Semua'}
                  </button>
                )}

                <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl w-full sm:w-auto">
                  <span>Kunci otomatis:</span>
                  <select
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                    className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 focus:outline-none focus:border-purple-500 text-slate-300 font-medium"
                  >
                    <option value={1}>1 mnt</option>
                    <option value={5}>5 mnt</option>
                    <option value={15}>15 mnt</option>
                    <option value={30}>30 mnt</option>
                  </select>
                </div>

                <button
                  onClick={openAddModal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold text-white transition shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer font-sans w-full sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Akun
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
              {categories.map(cat => {
                const count = cat === 'Semua' 
                  ? accounts.length 
                  : accounts.filter(a => a.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeCategory === cat
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                        : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeCategory === cat ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Credentials Listing Grid */}
            {filteredAccounts.length === 0 ? (
              <div className="glass-panel rounded-2xl p-16 text-center border border-dashed border-white/10 max-w-lg mx-auto w-full">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-5 text-slate-400">
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-sans">Belum Ada Kredensial</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {accounts.length === 0 
                    ? 'Vault Anda kosong. Klik tombol di kanan atas untuk mencatat akun penting pertama Anda.' 
                    : 'Tidak menemukan akun dengan kata kunci atau filter kategori yang dipilih.'}
                </p>
                {accounts.length === 0 && (
                  <button
                    onClick={openAddModal}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition"
                  >
                    Mulai Sekarang
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredAccounts.map(acc => {
                  const gradient = getGradientStyle(acc.title);
                  const strengthScore = getPasswordStrengthScore(acc.password);
                  
                  // Calculate Password Age
                  const daysOld = acc.updatedAt 
                    ? Math.floor((new Date() - new Date(acc.updatedAt)) / (1000 * 60 * 60 * 24)) 
                    : 0;
                  
                  return (
                    <div key={acc.id} className="glass-panel-light rounded-xl p-5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5">
                      <div>
                        {/* Card Header with Colored Initial Avatars */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-extrabold text-lg shadow-md uppercase`}>
                              {(acc.title || 'A').charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-white text-base leading-tight truncate max-w-[110px]" title={acc.title}>
                                  <HighlightText text={acc.title} query={searchQuery} />
                                </h3>
                                {/* Weak Password Warning Dot */}
                                {strengthScore <= 2 && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 block shrink-0" title="Sandi Lemah! Segera ganti." />
                                )}
                              </div>
                              <span className="text-[9px] bg-slate-900 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                                {acc.category}
                              </span>
                            </div>
                          </div>
                          
                          {/* Edit / Delete Row */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(acc)}
                              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-purple-400 transition"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Custom Tags rendering */}
                        {acc.tags && acc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3.5">
                            {acc.tags.map((tag, idx) => (
                              <span key={idx} className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                                #<HighlightText text={tag} query={searchQuery} />
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Credentials Container */}
                        <div className="space-y-3">
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
                      </div>

                      {/* Card footer details */}
                      <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400 flex flex-col gap-2">
                        {/* URL and notes */}
                        <div className="flex items-center justify-between">
                          {acc.url ? (
                            <a
                              href={acc.url.startsWith('http') ? acc.url : `https://${acc.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 max-w-[150px] truncate font-medium transition"
                            >
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="truncate">
                                <HighlightText text={acc.url} query={searchQuery} />
                              </span>
                            </a>
                          ) : (
                            <span></span>
                          )}
                          {acc.notes && (
                            <span className="italic max-w-[130px] truncate text-slate-500 font-medium" title={acc.notes}>
                              📝 {acc.notes}
                            </span>
                          )}
                        </div>

                        {/* Timestamps Section */}
                        <div className="flex flex-col gap-1 text-[9px] text-slate-500 font-medium mt-1 pt-1.5 border-t border-white/5">
                          <div className="flex justify-between">
                            <span>Dibuat: {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('id-ID') : 'Baru'}</span>
                            <span>Diubah: {acc.updatedAt ? new Date(acc.updatedAt).toLocaleDateString('id-ID') : 'Baru'}</span>
                          </div>
                          {daysOld > 90 && (
                            <span className="text-orange-400 flex items-center gap-1 font-semibold self-end mt-0.5 animate-pulse" title={`Sandi berumur ${daysOld} hari. Disarankan untuk merotasi.`}>
                              ⚠️ Sandi Usang ({daysOld} hari)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer credits */}
      <footer className="relative z-10 w-full text-center py-6 text-[11px] text-slate-600 border-t border-white/5">
        &copy; {new Date().getFullYear()} SecurePass. Zero-Knowledge Cryptography. Made Offline & Local.
      </footer>

      {/* MODAL: ADD / EDIT ACCOUNT DETAILS */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingAccount ? (
                  <>
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="font-sans">Edit Akun</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-sans">Tambah Akun Baru</span>
                  </>
                )}
              </h3>
              <button
                onClick={closeAddEditModal}
                className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Nama Layanan</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Gmail, Bank Mandiri, Github..."
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

              {/* Notes */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">Catatan (Opsional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Masukkan nomor pin recovery, petunjuk keamanan, atau info penting..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-white/10 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none text-sm transition h-20 resize-none"
                />
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
                  {editingAccount ? 'Simpan Akun' : 'Simpan Kredensial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS & LOGS MODAL (SETTINGS MENU) */}
      {isSettingsOpen && (
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
                className="text-slate-400 hover:text-white transition p-1 hover:bg-white/5 rounded-lg"
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
                          Unduh seluruh kredensial tanpa enkripsi (plain text). Gunakan hanya jika Anda ingin mencetak password Anda. **Beresiko Tinggi!**
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
      )}
    </div>
  );
}
