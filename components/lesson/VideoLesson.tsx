interface VideoLessonProps {
  content: string;
  title: string;
}

export default function VideoLesson({ content, title }: VideoLessonProps) {
  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden aspect-video">
        <video controls className="w-full h-full" src={content} preload="metadata">
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <p className="text-sm text-gray-700">
        Если видео не загружается,{" "}
        <a href={content} target="_blank" className="text-blue-600 underline">
          откройте в новой вкладке
        </a>
      </p>
    </div>
  );
}
