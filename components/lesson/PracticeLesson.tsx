interface PracticeLessonProps {
  content: string;
}

export default function PracticeLesson({ content }: PracticeLessonProps) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">📝</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Практическое задание
          </h3>
          <p className="text-gray-700 mb-4">{content}</p>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="font-semibold text-gray-800 mb-2">
              Напишите наставнику в Telegram
            </p>
            <p className="text-gray-600 text-sm">
              После выполнения задания, нажмите "Завершить" чтобы отметить урок как пройденный
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
