import React from 'react';

export function renderWithMentions(text, onAuthorClick) {
  if (!text) return null;
  
  // Split by @username, capturing the @username
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      const handle = part.substring(1);
      return (
        <span
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            if (onAuthorClick) {
              // Note: the component using this must provide an onAuthorClick that accepts a creator object
              onAuthorClick({ handle });
            }
          }}
          className="text-[#E60023] font-semibold cursor-pointer hover:underline"
          title={`Ver perfil de ${part}`}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
