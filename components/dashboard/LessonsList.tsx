import LessonCard from './LessonCard';

interface LessonsListProps {
  groupedLessons: any[];
}

export default function LessonsList({ groupedLessons }: LessonsListProps) {
  if (!Array.isArray(groupedLessons) || groupedLessons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-700">Нет доступных уроков</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedLessons.map((block: any) => (
        <div key={block.id}>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {block.title}
          </h2>
          
          {block.modules && block.modules.map((mod: any) => (
            <div key={mod.id} className="mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
                {mod.title}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {mod.lessons && mod.lessons.map((lesson: any) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
