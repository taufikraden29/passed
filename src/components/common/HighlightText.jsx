import React from 'react';

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

export default HighlightText;
