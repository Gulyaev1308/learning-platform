interface VideoLessonProps {
  content: string;
  title: string;
  onEnded?: () => void;
  onStart?: () => void;
}

export default function VideoLesson({ content, title, onEnded, onStart }: VideoLessonProps) {
  console.log('VideoLesson content:', content);

  // Google Drive — iframe с правильными параметрами
  if (content && content.includes('drive.google.com')) {
    const match = content.match(/\/d\/([^/]+)/) || content.match(/id=([^&]+)/);
    const fileId = match ? match[1] : '';

    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://drive.google.com/file/d/${fileId}/preview`}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
            loading="lazy"
          />
        </div>
        <button
          onClick={onEnded}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
        >
          ✅ Я посмотрел видео
        </button>
      </div>
    );
  }

  // VK Video
  if (content && content.includes('vk.com/video')) {
    const match = content.match(/video(-?\d+)_(\d+)/);
    const oid = match?.[1] || '';
    const videoId = match?.[2] || '';
    return (
      <div className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://vk.com/video_ext.php?oid=${oid}&id=${videoId}&hd=2`}
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
