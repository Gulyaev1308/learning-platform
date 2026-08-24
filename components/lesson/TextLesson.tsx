interface TextLessonProps {
  content: string;
}

export default function TextLesson({ content }: TextLessonProps) {
  return (
    <div className="prose max-w-none">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
