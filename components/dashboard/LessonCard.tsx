import Link from 'next/link';

interface LessonCardProps {
  lesson: {
    id: number;
    title: string;
    type: string;
    status: string;
    order_index: number;
  };
}

export default function LessonCard({ lesson }: LessonCardProps) {
  const isLocked = lesson.status === 'locked';
  const isCompleted = lesson.status === 'completed';
  const isAvailable = lesson.status === 'available';

  const cardContent = (
    <div
      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
        isLocked
          ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
          : isCompleted
          ? 'bg-green-50 border-green-400 cursor-pointer hover:border-green-600'
          : 'bg-white border-blue-400 cursor-pointer hover:border-blue-600 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">
          Урок {lesson.order_index}
        </span>
        <span className={`text-xs font-bold ${
          isCompleted ? 'text-green-700' : isAvailable ? 'text-blue-700' : 'text-gray-500'
        }`}>
          {isCompleted ? '✓ Завершен' : isAvailable ? '▶ Доступен' : '🔒 Заблокирован'}
        </span>
      </div>
      <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">
        {lesson.title}
      </h4>
      <span className="text-xs text-gray-600">
        {lesson.type === 'video' ? '🎬 Видео' : 
         lesson.type === 'text' ? '📄 Текст' : 
         lesson.type === 'quiz' ? '📝 Опрос' : '✍️ Практика'}
      </span>
    </div>
  );

  if (isLocked) {
    return cardContent;
  }

  return (
    <Link href={`/lesson/${lesson.id}`}>
      {cardContent}
    </Link>
  );
}
