interface VideoLessonProps {
  content: string;
  title: string;
}

export default function VideoLesson({ content, title }: VideoLessonProps) {
  const videoUrl = content.startsWith('/videos/') 
    ? content.replace('/videos/', '/api/videos/')
    : content;

  console.log('Playing video:', videoUrl);

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden aspect-video">
        <video 
          controls 
          className="w-full h-full" 
          src={videoUrl}
          preload="metadata"
          key={videoUrl}
        >
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <p className="text-sm text-gray-700">
        <a href={videoUrl} target="_blank" className="text-blue-600 underline">
          Открыть видео в новой вкладке
        </a>
      </p>
    </div>
  );
}
