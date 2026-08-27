interface VideoLessonProps {
  content: string;
  title: string;
}

export default function VideoLesson({ content, title }: VideoLessonProps) {
  console.log('Video URL:', content);
  
  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          controls
          className="w-full aspect-video"
          src={content}
          preload="metadata"
        >
          <source src={content} />
          Ваш браузер не поддерживает видео.
        </video>
      </div>
      <p className="text-sm text-gray-700">
        Если видео не загружается, нажмите{" "}
        <a href={content} target="_blank" className="text-blue-600 underline">
          сюда
        </a>{" "}
        чтобы открыть в новой вкладке
      </p>
    </div>
  );
}
