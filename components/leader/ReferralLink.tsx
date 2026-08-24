'use client';

import { useState } from 'react';

interface ReferralLinkProps {
  leaderId: number;
}

export default function ReferralLink({ leaderId }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}/ref/${leaderId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            🔗 Ваша реферальная ссылка
          </p>
          <p className="text-xs text-gray-900 mb-2">
            Отправьте эту ссылку ученику для регистрации
          </p>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 overflow-x-auto">
            <code className="text-xs sm:text-sm text-blue-600 whitespace-nowrap">
              {referralUrl}
            </code>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {copied ? '✓ Скопировано!' : 'Копировать'}
        </button>
      </div>
    </div>
  );
}
