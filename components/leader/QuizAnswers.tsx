interface QuizAnswer {
  lesson_id: number;
  lesson_title: string;
  question: string;
  options: string[];
  student_answer: string | null;
  answered: boolean;
  answered_at: string | null;
}

interface QuizAnswersProps {
  student: {
    id: number;
    name: string;
    email: string;
  };
  stats: {
    total_quizzes: number;
    answered_quizzes: number;
    completion_percent: number;
  };
  answers: QuizAnswer[];
  onClose: () => void;
}

export default function QuizAnswers({ student, stats, answers, onClose }: QuizAnswersProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Ответы на опросы
              </h3>
              <p className="text-sm text-gray-900 mt-1">
                {student.name} • {student.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-700 hover:text-gray-700 text-xl flex-shrink-0 ml-4"
            >
              ✕
            </button>
          </div>

          {/* Статистика */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Прогресс по опросам
                </p>
                <p className="text-xs text-gray-900 mt-1">
                  Отвечено: {stats.answered_quizzes} из {stats.total_quizzes}
                </p>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.completion_percent}%
              </div>
            </div>
            <div className="w-full bg-white rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.completion_percent}%` }}
              />
            </div>
          </div>

          {answers.length === 0 ? (
            <p className="text-gray-900 text-center py-8">Нет опросов</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {answers.map((answer, index) => (
                <div
                  key={answer.lesson_id}
                  className={`border rounded-lg p-3 sm:p-4 ${
                    answer.answered
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      Опрос {index + 1} • {answer.lesson_title}
                    </span>
                    {answer.answered ? (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Отвечен
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">
                        Не отвечен
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                    {answer.question}
                  </div>

                  {answer.answered ? (
                    <div className="text-sm sm:text-base">
                      <span className="font-medium text-gray-700">Ответ ученика: </span>
                      <span className="text-blue-600 font-semibold">
                        {answer.student_answer}
                      </span>
                      {answer.answered_at && (
                        <div className="text-xs text-gray-700 mt-1">
                          {new Date(answer.answered_at).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Ученик ещё не ответил на этот опрос
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
