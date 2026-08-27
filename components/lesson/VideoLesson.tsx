interface VideoLessonProps {
  content: string;
  title: string;
  onEnded?: () => void;
  onStart?: () => void;
}

export default function VideoLesson({ content, title, onEnded, onStart }: VideoLessonProps) {
  console.log('VideoLesson content:', content);

  // Google Drive
  if (content && content.includes('drive.google.com')) {
    const match = content.match(/\/d\/([^/]+)/) || content.match(/id=([^&]+)/);
    const fileId = match ? match[1] : '';
    
    console.log('Drive fileId:', fileId);

    if (!fileId) {
      return <p className="text-red-600">Неверная ссылка Google Drive</p>;
    }

    return (
      <div className="space-y-4">
        <div className="bg-black rounded-lg overflow-hidden aspect-video">
          <iframe
            src={`https://drive.google.com/file/d/${fileId}/preview`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
        <button
          onClick={onEnded}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
        >
          ✅ Я посмотрел видео
        </button>
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
