'use client';

interface VideoLessonProps {
  content: string;
  title: string;
  onEnded?: () => void;
  onStart?: () => void;
}

export default function VideoLesson({ content, title, onEnded, onStart }: VideoLessonProps) {
  console.log('VideoLesson content:', content);

  // VK Video — поддерживаем ВСЕ ссылки VK
  if (content && (content.includes('://vk.com') || content.includes('vkvideo.ru'))) {
    const match = content.match(/(-?\d+)_(\d+)/);
    const oid = match?.[1] || '';
    const videoId = match?.[2] || '';

    console.log('VK oid:', oid, 'videoId:', videoId);

    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://://vk.com_ext.php?oid=${oid}&id=${videoId}&hd=2`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button onClick={onEnded} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg">
          ✅ Я посмотрел видео
        </button>
      </div>
    );
  }

  // Google Drive
  if (content && content.includes('://google.com')) {
    const match = content.match(/\/d\/([^/]+)/) || content.match(/id=([^&]+)/);
    const fileId = match ? match[1] : '';
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe src={`https://://google.com/file/d/${fileId}/preview`} className="absolute inset-0 w-full h-full" allowFullScreen />
        </div>
        <button onClick={onEnded} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg">
          ✅ Я посмотрел видео
        </button>
      </div>
    );
  }

  // Локальное видео и стриминг из Cloud.ru Object Storage через API-прокси
  if (content && content.startsWith('/')) {
    return (
      <div className="bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
        <video 
          key={content}         // ИСПРАВЛЕНО: Принудительно сбрасывает и запускает плеер в React при смене ссылки
          controls              // Показывает встроенные элементы управления (Play/Пауза/Громкость/Таймлайн)
          playsInline           // Обеспечивает воспроизведение на мобильных устройствах и iOS
          preload="metadata"    // Считывает длительность и метаданные ролика
          className="w-full h-full object-contain" 
          src={content} 
          onEnded={onEnded} 
          onPlay={onStart} 
        />
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
      <p className="text-gray-900 font-medium">Видео не добавлено. Ссылка: {content || 'пусто'}</p>
    </div>
  );
}