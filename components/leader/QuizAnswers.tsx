import React from 'react';

interface QuizAnswersProps {
  student: { 
    id: number; 
    name: string; 
    email: string;
  };
  stats: any;
  answers: any[];
  onClose: () => void;
}

export default function QuizAnswers({ student, stats, answers, onClose }: QuizAnswersProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white text-gray-900 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[85vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-xl font-bold">{student.name}</h3>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {/* ВЫВОД РЕЗУЛЬТАТОВ ОПРОСОВ И АНКЕТ */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            📊 Результаты заполненных анкет:
          </h4>
          
          {answers.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Студент еще не отправлял ответы на тесты.</p>
          ) : (
            <div className="space-y-4 divide-y divide-gray-100">
              {answers.map((ans: any, idx: number) => (
                <div key={ans.id || idx} className="pt-4 first:pt-0 space-y-1">
                  <p className="text-xs font-bold text-blue-600">Урок: {ans.lesson_title || `ID ${ans.lesson_id}`}</p>
                  <p className="text-sm font-semibold text-gray-800">Вопрос: {ans.question_text}</p>
                  <p className="text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-gray-700 mt-1">
                    <span className="font-bold text-xs text-gray-400 block mb-0.5">Ответ партнера:</span>
                    {ans.answer_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
