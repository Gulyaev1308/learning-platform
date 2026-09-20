'use client';

interface VideoLessonProps {
  content: string;
  title: string;
  onEnded?: () => void;
  onStart?: () => void;
}

export default function VideoLesson({ content, title, onEnded, onStart }: VideoLessonProps) {
  // ДИАГНОСТИКА: Логируем то, что компонент физически получил в пропсы
  console.log(`[VIDEO_PLAYER_AUDIT] Компонент смонтирован. Title: "${title}" | Content: "${content}"`);

  // VK Video
  if (content && (content.includes('://vk.com') || content.includes('vkvideo.ru'))) {
    const match = content.match(/(-?\d+)_(\d+)/);
    const oid = match?.[1] || '';
    const videoId = match?.[2] || '';
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

  // Локальное видео и стриминг через API-прокси
  if (content && content.startsWith('/')) {
    return (
      <div className="bg-black rounded-lg overflow-hidden aspect-video shadow-lg">
        <video 
          key={content}
          controls
          playsInline
          preload="auto"
          className="w-full h-full object-contain" 
          src={content} 
          onEnded={onEnded} 
          onPlay={() => {
            console.log(`[VIDEO_PLAYER_EVENT] Воспроизведение успешно запущено для: ${content}`);
            if (onStart) onStart();
          }}
          // СКВОЗНОЙ АУДИТ ОШИБОК ПЛЕЕРА БРАУЗЕРА
          onLoadStart={() => console.log(`[VIDEO_PLAYER_EVENT] Браузер начал загрузку медиа по ссылке: ${content}`)}
          onCanPlay={() => console.log('[VIDEO_PLAYER_EVENT] Браузер загрузил достаточно байт и готов к старту')}
          onWaiting={() => console.warn('[VIDEO_PLAYER_EVENT] Плеер ушел в буферизацию (ожидание байт)')}
          onError={(e) => {
            const videoEl = e.currentTarget;
            console.error('[VIDEO_PLAYER_CRITICAL_ERROR] Сбой элемента <video>:', {
              code: videoEl.error?.code,
              message: videoEl.error?.message,
              currentSrc: videoEl.currentSrc
            });
          }}
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