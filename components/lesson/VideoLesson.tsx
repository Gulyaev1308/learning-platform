interface VideoLessonProps {
  content: string;
  title: string;
  onEnded?: () => void;
  onStart?: () => void;
}

export default function VideoLesson({ content, title, onEnded, onStart }: VideoLessonProps) {
  console.log('VideoLesson content:', content);

  // Google Drive — используем прямую ссылку для скачивания
  if (content && content.includes('drive.google.com')) {
    const match = content.match(/\/d\/([^/]+)/) || content.match(/id=([^&]+)/);
    const fileId = match ? match[1] : '';

    // Прямая ссылка на видео
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Альтернативная ссылка для просмотра
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

    return (
      <div className="space-y-4">
        {/* Пробуем HTML5 video с прямой ссылкой */}
        <div className="bg-black rounded-lg overflow-hidden aspect-video">
          <video
            controls
            className="w-full h-full"
            src={directUrl}
            onEnded={onEnded}
            onPlay={onStart}
            preload="metadata"
          >
            Ваш браузер не поддерживает видео.
          </video>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-center"
          >
            🎬 Открыть в Google Drive
          </a>
          <button
            onClick={onEnded}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
          >
            ✅ Я посмотрел видео
          </button>
        </div>
      </div>
    );
  }

  // Локальное видео
  if (content && content.startsWith('/')) {
    return (
      <div className="bg-black rounded-lg overflow-hidden aspect-video">
        <video controls className="w-full h-full" src={content} onEnded={onEnded} onPlay={onStart} />
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
      <p className="text-gray-900 font-medium">Видео не добавлено</p>
    </div>
  );
}
