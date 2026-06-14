import React, { useState, useEffect, useRef } from 'react';
import {
  deriveKey,
  encryptData,
  decryptData,
  generateSalt
} from './utils/crypto';
import HighlightText from './components/common/HighlightText';
import ToastContainer from './components/common/Toast';
import {
  getGradientStyle,
  getPasswordStrengthScore,
  getPasswordStrengthDetails
} from './utils/helpers';
import AccountCard from './components/cards/AccountCard';
import BankCard from './components/cards/BankCard';
import ContactCard from './components/cards/ContactCard';
import AddEditModal from './components/modals/AddEditModal';
import SettingsModal from './components/modals/SettingsModal';
import Header from './components/sections/Header';
import SecurityAudit from './components/sections/SecurityAudit';

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
  const [formType, setFormType] = useState('akun'); // 'akun' | 'rekening' | 'kontak'
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Personal');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  
  // Kontak fields
  const [formFullName, setFormFullName] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Rekening Bank fields
  const [formBankName, setFormBankName] = useState('');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState('');
  const [formBankAccountHolder, setFormBankAccountHolder] = useState('');
  const [formBankPin, setFormBankPin] = useState('');

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

  // Init check
  useEffect(() => {
    const salt = localStorage.getItem('sp_salt');
    const token = localStorage.getItem('sp_token');
    const hasDb = !!(salt && token);
    setHasMasterPassword(hasDb);
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
      handleLock();
      showToast('Vault terkunci otomatis karena tidak aktif.', 'error');
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
    if (formType === 'akun') {
      if (!formTitle || !formUsername || !formPassword) {
        showToast('Judul, Username, & Password wajib diisi!', 'error');
        return;
      }
    } else if (formType === 'rekening') {
      if (!formBankName || !formBankAccountNumber || !formBankAccountHolder) {
        showToast('Nama Bank, Nomor Rekening, & Nama Pemilik wajib diisi!', 'error');
        return;
      }
    } else if (formType === 'kontak') {
      if (!formFullName || !formPhoneNumber) {
        showToast('Nama Lengkap & Nomor Handphone wajib diisi!', 'error');
        return;
      }
    }

    // Clean tags safely
    const tagsArray = (formTags || '')
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const nowStr = new Date().toISOString();

    let displayTitle = formTitle;
    if (formType === 'rekening') {
      displayTitle = `${formBankName} - ${formBankAccountNumber}`;
    } else if (formType === 'kontak') {
      displayTitle = formFullName;
    }

    const accountData = {
      type: formType,
      title: displayTitle,
      notes: formNotes,
      tags: tagsArray,
      createdAt: editingAccount ? (editingAccount.createdAt || editingAccount.updatedAt || nowStr) : nowStr,
      updatedAt: nowStr,

      // Akun fields
      category: formCategory,
      username: formUsername,
      password: formPassword,
      url: formUrl,

      // Rekening Bank fields
      bankName: formBankName,
      bankAccountNumber: formBankAccountNumber,
      bankBankAccountHolder: formBankAccountHolder,
      bankPin: formBankPin,

      // Kontak fields
      fullName: formFullName,
      phoneNumber: formPhoneNumber,
      contactEmail: formContactEmail,
      address: formAddress
    };

    try {
      const encryptedObj = await encryptData(JSON.stringify(accountData), derivedKey);
      const encAccountsStr = localStorage.getItem('sp_accounts') || '[]';
      let encAccounts = JSON.parse(encAccountsStr);

      const logTypeName = formType === 'akun' ? 'akun' : formType === 'rekening' ? 'rekening bank' : 'kontak';

      if (editingAccount) {
        encAccounts = encAccounts.map(item => 
          item.id === editingAccount.id 
            ? { ...item, ciphertext: encryptedObj.ciphertext, iv: encryptedObj.iv }
            : item
        );
        
        // Safeguard: Ensure log failure doesn't block saving
        try {
          await addLogEntry(`Mengubah ${logTypeName}: [${displayTitle}]`);
        } catch (logErr) {
          console.error('Logging failed:', logErr);
        }
        
        showToast(`${formType === 'akun' ? 'Akun' : formType === 'rekening' ? 'Rekening Bank' : 'Kontak'} berhasil diperbarui.`);
      } else {
        encAccounts.push({
          id: Date.now().toString(),
          ciphertext: encryptedObj.ciphertext,
          iv: encryptedObj.iv
        });
        
        // Safeguard: Ensure log failure doesn't block saving
        try {
          await addLogEntry(`Menambahkan ${logTypeName} baru: [${displayTitle}]`);
        } catch (logErr) {
          console.error('Logging failed:', logErr);
        }
        
        showToast(`${formType === 'akun' ? 'Akun' : formType === 'rekening' ? 'Rekening Bank' : 'Kontak'} baru berhasil ditambahkan.`);
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
    const logTypeName = (accToDelete.type || 'akun') === 'akun' ? 'akun' : (accToDelete.type || 'akun') === 'rekening' ? 'rekening bank' : 'kontak';
    if (!confirm(`Apakah Anda yakin ingin menghapus ${logTypeName} [${accToDelete.title}]?`)) return;

    const encAccountsStr = localStorage.getItem('sp_accounts') || '[]';
    let encAccounts = JSON.parse(encAccountsStr);
    encAccounts = encAccounts.filter(item => item.id !== id);
    
    localStorage.setItem('sp_accounts', JSON.stringify(encAccounts));
    
    // Safeguard logging
    try {
      await addLogEntry(`Menghapus ${logTypeName}: [${accToDelete.title}]`);
    } catch (logErr) {
      console.error('Logging failed:', logErr);
    }
    
    loadAndDecryptAccounts(derivedKey);
    showToast('Data berhasil dihapus.', 'success');
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
      const details = serviceTitle ? ` untuk [${serviceTitle}]` : '';
      
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
    setFormType('akun');
    setFormTitle('');
    setFormCategory('Personal');
    setFormUsername('');
    setFormPassword('');
    setFormUrl('');
    setFormNotes('');
    setFormTags('');
    setFormFullName('');
    setFormPhoneNumber('');
    setFormContactEmail('');
    setFormAddress('');
    setFormBankName('');
    setFormBankAccountNumber('');
    setFormBankAccountHolder('');
    setFormBankPin('');
    setIsAddEditOpen(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    const type = account.type || 'akun';
    setFormType(type);
    setFormNotes(account.notes || '');
    setFormTags(account.tags ? account.tags.join(', ') : '');

    // Akun fields
    setFormTitle(account.title || '');
    setFormCategory(account.category || 'Personal');
    setFormUsername(account.username || '');
    setFormPassword(account.password || '');
    setFormUrl(account.url || '');

    // Kontak fields
    setFormFullName(account.fullName || '');
    setFormPhoneNumber(account.phoneNumber || '');
    setFormContactEmail(account.contactEmail || '');
    setFormAddress(account.address || '');

    // Rekening Bank fields
    setFormBankName(account.bankName || '');
    setFormBankAccountNumber(account.bankAccountNumber || '');
    setFormBankAccountHolder(account.bankBankAccountHolder || '');
    setFormBankPin(account.bankPin || '');

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
    if (!confirm('PERINGATAN KEAMANAN TINGGI!\n\nEkspor ke CSV akan menyimpan seluruh data Anda dalam bentuk TEKS BIASA (tidak terenkripsi). Siapa saja yang membuka file ini bisa melihat semua password dan informasi penting Anda.\n\nApakah Anda benar-benar ingin melanjutkan?')) {
      return;
    }

    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Tipe,Judul/Nama,Username/Email,Password/PIN,URL,Nama Bank,No Rekening,Pemilik Rekening,No Handphone,Alamat,Catatan,Tag,DibuatAt,DiubahAt\n';

      accounts.forEach(acc => {
        const type = `"${(acc.type || 'akun').replace(/"/g, '""')}"`;
        const title = `"${(acc.title || '').replace(/"/g, '""')}"`;
        const user = `"${(acc.username || acc.contactEmail || '').replace(/"/g, '""')}"`;
        const pwd = `"${(acc.password || acc.bankPin || '').replace(/"/g, '""')}"`;
        const url = `"${(acc.url || '').replace(/"/g, '""')}"`;
        const bankName = `"${(acc.bankName || '').replace(/"/g, '""')}"`;
        const bankAcc = `"${(acc.bankAccountNumber || '').replace(/"/g, '""')}"`;
        const bankHolder = `"${(acc.bankBankAccountHolder || '').replace(/"/g, '""')}"`;
        const phone = `"${(acc.phoneNumber || '').replace(/"/g, '""')}"`;
        const address = `"${(acc.address || '').replace(/"/g, '""')}"`;
        const notes = `"${(acc.notes || '').replace(/"/g, '""')}"`;
        const tags = `"${(acc.tags ? acc.tags.join(', ') : '').replace(/"/g, '""')}"`;
        const created = `"${acc.createdAt || ''}"`;
        const updated = `"${acc.updatedAt || ''}"`;
        
        csvContent += `${type},${title},${user},${pwd},${url},${bankName},${bankAcc},${bankHolder},${phone},${address},${notes},${tags},${created},${updated}\n`;
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
    const type = acc.type || 'akun';
    
    // Type filtering
    const matchesCategory = activeCategory === 'Semua' || type === activeCategory;
    
    if (!matchesCategory) return false;
    if (!query) return true;

    // Search query matches
    const matchesCommon = 
      acc.title?.toLowerCase().includes(query) || 
      acc.notes?.toLowerCase().includes(query) ||
      acc.tags?.some(tag => tag.toLowerCase().includes(query));

    if (type === 'akun') {
      return matchesCommon || 
        acc.username?.toLowerCase().includes(query) ||
        acc.url?.toLowerCase().includes(query);
    } else if (type === 'rekening') {
      return matchesCommon ||
        acc.bankName?.toLowerCase().includes(query) ||
        acc.bankAccountNumber?.toLowerCase().includes(query) ||
        acc.bankBankAccountHolder?.toLowerCase().includes(query);
    } else if (type === 'kontak') {
      return matchesCommon ||
        acc.fullName?.toLowerCase().includes(query) ||
        acc.phoneNumber?.toLowerCase().includes(query) ||
        acc.contactEmail?.toLowerCase().includes(query) ||
        acc.address?.toLowerCase().includes(query);
    }

    return matchesCommon;
  });

  return (
    <div className="relative min-h-screen bg-[#070a13] text-[#e2e8f0] overflow-hidden flex flex-col font-sans">
      {/* Background soft lighting */}
      <div className="bg-glow top-0 left-10"></div>
      <div className="bg-glow bottom-0 right-10" style={{ animationDelay: '-6s' }}></div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header bar */}
      <Header
        isLocked={isLocked}
        setIsSettingsOpen={setIsSettingsOpen}
        setSettingsTab={setSettingsTab}
        handleLock={handleLock}
      />

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
            <SecurityAudit
              accounts={accounts}
              auditStats={auditStats}
            />

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
                  Tambah Baru
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 scrollbar-thin">
              {[
                { id: 'Semua', label: 'Semua' },
                { id: 'akun', label: 'Akun' },
                { id: 'rekening', label: 'Rekening Bank' },
                { id: 'kontak', label: 'Kontak' }
              ].map(tab => {
                const count = tab.id === 'Semua'
                  ? accounts.length
                  : accounts.filter(a => (a.type || 'akun') === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                      activeCategory === tab.id
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                        : 'bg-white/5 border border-transparent text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeCategory === tab.id ? 'bg-purple-500/30 text-purple-200' : 'bg-slate-800 text-slate-400'
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
                  const type = acc.type || 'akun';
                  const gradient = getGradientStyle(type === 'kontak' ? acc.fullName : acc.title);
                  
                  // Calculate Password Age (only for 'akun')
                  const daysOld = type === 'akun' && acc.updatedAt 
                    ? Math.floor((new Date() - new Date(acc.updatedAt)) / (1000 * 60 * 60 * 24)) 
                    : 0;

                  return (
                    <div key={acc.id} className="glass-panel-light rounded-xl p-5 transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 animate-slide-in">
                      <div>
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-3.5">
                          <div className="flex items-center gap-3">
                            {type === 'kontak' ? (
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-extrabold text-base shadow-md uppercase`}>
                                {(acc.fullName || 'K').charAt(0)}
                              </div>
                            ) : type === 'rekening' ? (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                                🏦
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-extrabold text-lg shadow-md uppercase`}>
                                {(acc.title || 'A').charAt(0)}
                              </div>
                            )}
                            
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-white text-base leading-tight truncate max-w-[120px]" title={type === 'kontak' ? acc.fullName : acc.title}>
                                  <HighlightText text={type === 'kontak' ? acc.fullName : acc.title} query={searchQuery} />
                                </h3>
                                {type === 'akun' && getPasswordStrengthScore(acc.password) <= 2 && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 block shrink-0" title="Sandi Lemah! Segera ganti." />
                                )}
                              </div>
                              <span className={`text-[9px] border px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                                type === 'rekening' 
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                                  : type === 'kontak' 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                    : 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                              }`}>
                                {type === 'rekening' ? 'Rekening Bank' : type === 'kontak' ? 'Kontak' : acc.category || 'Akun'}
                              </span>
                            </div>
                          </div>

                          {/* Edit / Delete Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(acc)}
                              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-purple-400 transition cursor-pointer"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc.id)}
                              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition cursor-pointer"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Custom Tags */}
                        {acc.tags && acc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3.5">
                            {acc.tags.map((tag, idx) => (
                              <span key={idx} className="text-[9px] bg-white/5 border border-white/10 text-slate-300 px-1.5 py-0.5 rounded">
                                #<HighlightText text={tag} query={searchQuery} />
                              </span>
                            ))}
                          </div>
                        )}

                        {/* TYPE SPECIFIC RENDERING */}
                        {type === 'akun' && (
                          <AccountCard
                            acc={acc}
                            searchQuery={searchQuery}
                            showAllPasswords={showAllPasswords}
                            visiblePasswords={visiblePasswords}
                            togglePasswordVisibility={togglePasswordVisibility}
                            copyToClipboard={copyToClipboard}
                          />
                        )}

                        {type === 'rekening' && (
                          <BankCard
                            acc={acc}
                            searchQuery={searchQuery}
                            showAllPasswords={showAllPasswords}
                            visiblePasswords={visiblePasswords}
                            togglePasswordVisibility={togglePasswordVisibility}
                            copyToClipboard={copyToClipboard}
                          />
                        )}

                        {type === 'kontak' && (
                          <ContactCard
                            acc={acc}
                            searchQuery={searchQuery}
                            copyToClipboard={copyToClipboard}
                          />
                        )}
                      </div>

                      {/* Card Footer details */}
                      <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-400 flex flex-col gap-2">
                        {/* URL and notes */}
                        <div className="flex items-center justify-between">
                          {type === 'akun' && acc.url ? (
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
                            <span className="italic max-w-[150px] truncate text-slate-500 font-medium" title={acc.notes}>
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
                          {type === 'akun' && daysOld > 90 && (
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
      <AddEditModal
        isAddEditOpen={isAddEditOpen}
        closeAddEditModal={closeAddEditModal}
        editingAccount={editingAccount}
        formType={formType}
        setFormType={setFormType}
        handleSaveAccount={handleSaveAccount}
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
        formBankName={formBankName}
        setFormBankName={setFormBankName}
        formBankAccountNumber={formBankAccountNumber}
        setFormBankAccountNumber={setFormBankAccountNumber}
        formBankAccountHolder={formBankAccountHolder}
        setFormBankAccountHolder={setFormBankAccountHolder}
        formBankPin={formBankPin}
        setFormBankPin={setFormBankPin}
        formFullName={formFullName}
        setFormFullName={setFormFullName}
        formPhoneNumber={formPhoneNumber}
        setFormPhoneNumber={setFormPhoneNumber}
        formContactEmail={formContactEmail}
        setFormContactEmail={setFormContactEmail}
        formAddress={formAddress}
        setFormAddress={setFormAddress}
        formTags={formTags}
        setFormTags={setFormTags}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
      />
      <SettingsModal
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        logs={logs}
        isLocked={isLocked}
        handleExportData={handleExportData}
        handleExportCSV={handleExportCSV}
        handleImportData={handleImportData}
        handleResetDatabase={handleResetDatabase}
        handleClearLogs={handleClearLogs}
      />
    </div>
  );
}
