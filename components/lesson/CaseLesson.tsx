'use client';

import React, { useState } from 'react';

interface CaseLessonProps {
  lesson: {
    id: number;
    title: string;
    content: string; 
    case_images?: string[]; 
    case_details?: {
      products?: string[];
      duration?: string;
      resultText?: string;
    };
  };
  onComplete: () => void;
  isCompleted: boolean;
}

export function CaseLesson({ lesson, onComplete, isCompleted }: CaseLessonProps) {
  const images = lesson.case_images || [];
  const details = lesson.case_details || { products: [], duration: '', resultText: '' };
  const products = details.products || [];
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isVideo = (url: string) => /\.(mp4|webm|ogg)/i.test(url) || url.includes('video_') || url.includes('/api/videos/');

  // ИСПРАВЛЕНО СТРОГО: Берем строго первый элемент массива, чтобы получить чистое имя файла без query-параметров S3
  const getVideoSrc = (url: string) => {
    if (url.includes('/api/videos/')) return url;
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const fileNameArray = lastPart.split('?');
    return fileNameArray && fileNameArray[0] ? `/api/videos/\${fileNameArray[0]}` : url;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="mb-6">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-semibold rounded-full uppercase tracking-wider">
          🌱 Практический Кейс / Результат
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white mt-2">
          {lesson.title}
        </h1>
      </div>

      {images.length > 0 && (
        <div className="mb-8">
          <div className="relative w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-200 dark:border-slate-700">
            {isVideo(images[activeImageIndex]) ? (
              /* НАСТОЯЩИЙ ИНТЕРАКТИВНЫЙ ПЛЕЕР: Чистая прокси-ссылка. Полноценная перемотка, пауза и fullscreen */
              <video 
                key={images[activeImageIndex]}
                src={getVideoSrc(images[activeImageIndex])} 
                controls 
                preload="auto"
                playsInline
                controlsList="nodownload"
                className="w-full h-full object-contain" 
              />
            ) : (
              <img 
                src={images[activeImageIndex]} 
                alt={`Результат \${activeImageIndex + 1}`} 
                className="w-full h-full object-contain"
              />
            )}
            
            {images.length === 2 && !isVideo(images[activeImageIndex]) && (
              <span className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 text-sm font-bold rounded">
                {activeImageIndex === 0 ? 'ФОТО: ДО' : 'ФОТО: ПОСЛЕ'}
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all \${
                    idx === activeImageIndex ? 'border-emerald-500 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {isVideo(img) ? (
                    <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-white text-[10px] p-1 font-bold">
                      <span>▶ ВИДЕО</span>
                    </div>
                  ) : (
                    <img src={img} alt="Миниатюра" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1 space-y-4">
          {details.duration && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Срок применения программы БАД:</h4>
              <p className="text-base font-bold text-slate-700 dark:text-slate-200 mt-1">⏱ {details.duration}</p>
            </div>
          )}

          {products.length > 0 && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:bg-emerald-900/30">
              <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Продукты Siberian Wellness:</h4>
              <div className="flex flex-wrap gap-1.5">
                {products.map((product: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                    📦 {product}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Полная история и разбор кейса (основной текст):</h3>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
              {lesson.content}
            </p>
          </div>

          {details.resultText && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <h4 className="font-bold text-blue-900 dark:text-blue-400 text-xs uppercase tracking-wider mb-1">Итоговый вывод / Главный бизнес-инсайт:</h4>
              <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">{details.resultText}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm \--tw-shadow \${
            isCompleted
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98'
          }`}
        >
          {isCompleted ? '✓ Результат изучен' : 'Ознакомился с кейсом'}
        </button>
      </div>
    </div>
  );
}
