interface VideoLessonProps {
  content: string;
  title: string;
  onEnded?: () => void;
  onStart?: () => void;
}

export default function VideoLesson({ content, title, onEnded, onStart }: VideoLessonProps) {
  const videoUrl = content.startsWith('/videos/') 
    ? content.replace('/videos/', '/api/videos/')
    : content;

  return (
    <div className="bg-black rounded-lg overflow-hidden aspect-video">
      <video
        controls
        className="w-full h-full"
        src={videoUrl}
        preload="metadata"
        onEnded={onEnded}
        onPlay={onStart}
      >
        Ваш браузер не поддерживает видео.
      </video>
    </div>
  );
}
