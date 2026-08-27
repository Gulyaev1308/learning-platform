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

  const cardContent = (
    <div className={`p-4 rounded-lg border-2 ${
      isLocked 
        ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
        : isCompleted
        ? 'bg-green-50 border-green-400 cursor-pointer'
        : 'bg-white border-blue-400 cursor-pointer hover:border-blue-600'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-gray-700">Урок {lesson.order_index}</span>
        <span className={`text-xs font-bold ${
          isCompleted ? 'text-green-700' : isLocked ? 'text-gray-500' : 'text-blue-700'
        }`}>
          {isCompleted ? '✓ Завершен' : isLocked ? '🔒 Заблокирован' : '▶ Доступен'}
        </span>
      </div>
      <h4 className="font-bold text-gray-900">{lesson.title}</h4>
    </div>
  );

  if (isLocked) return cardContent;
  return <Link href={`/lesson/${lesson.id}`}>{cardContent}</Link>;
}
