import React from 'react';

export default function CopyButton({ text }: { text: string }) {
  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => alert('Ссылка успешно скопирована!'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
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
    
    // Мобильный хак для iOS / Safari (iPhone)
    textArea.setSelectionRange(0, 99999);
    
    try {
      document.execCommand('copy');
      alert('Ссылка успешно скопирована!');
    } catch (err) {
      alert('Не удалось скопировать ссылку автоматически. Пожалуйста, выделите и скопируйте её вручную.');
    }
    document.body.removeChild(textArea);
  };

  return (
    <button 
      onClick={handleCopy} 
      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm w-full sm:w-auto"
    >
      📋 Копировать реферальную ссылку
    </button>
  );
}
