import React from 'react';

interface ReferralLinkProps {
  referralUrl: string;
}

export default function ReferralLink({ referralUrl }: ReferralLinkProps) {
  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referralUrl)
        .then(() => alert('Ссылка успешно скопирована!'))
        .catch(() => fallbackCopy(referralUrl));
    } else {
      fallbackCopy(referralUrl);
    }
  };

  const fallbackCopy = (textToCopy: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // Поддержка копирования для iPhone (iOS Safari)
    textArea.setSelectionRange(0, 99999);
    
    try {
      document.execCommand('copy');
      alert('Ссылка успешно скопирована!');
    } catch (err) {
      alert('Не удалось скопировать. Пожалуйста, выделите и скопируйте ссылку вручную.');
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-1">Ваша реферальная ссылка для новичков:</h3>
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <input 
          type="text" 
          readOnly 
          value={referralUrl} 
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
        />
        <button 
          onClick={handleCopy}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition active:scale-95"
        >
          📋 Копировать
        </button>
      </div>
    </div>
  );
}
