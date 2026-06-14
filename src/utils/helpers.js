export const getGradientStyle = (text = 'A') => {
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

export const getPasswordStrengthScore = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 14) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return score;
};

export const getPasswordStrengthDetails = (score) => {
  if (score === 0) {
    return { score: 0, label: 'Kosong', color: 'bg-slate-700' };
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

  return { score, label, color };
};

export const formatBankNumber = (number) => {
  if (!number) return '';
  return number.replace(/(\d{4})/g, '$1 ').trim();
};
