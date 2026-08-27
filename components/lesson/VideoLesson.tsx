interface VideoLessonProps {
  content: string;
  title: string;
}

export default function VideoLesson({ content, title }: VideoLessonProps) {
  console.log('Content type:', content?.substring(0, 50));

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden aspect-video">
        <video 
          controls 
          className="w-full h-full" 
          src={content}
          preload="metadata"
        >
          Ваш браузер не поддерживает видео.
        </video>
      </div>
    </div>
  );
}
