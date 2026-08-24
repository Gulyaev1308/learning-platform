interface VideoLessonProps {
  content: string;
  title: string;
}

export default function VideoLesson({ content, title }: VideoLessonProps) {
  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden aspect-video">
        <video
          controls
          className="w-full h-full"
          src={content}
          title={title}
        >
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <p className="text-gray-600 text-sm">
        Просмотрите видео полностью, затем нажмите "Завершить"
      </p>
    </div>
  );
}
