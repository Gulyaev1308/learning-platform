import React from 'react';

interface Student {
  id: number;
  email: string;
  name: string;
  created_at: string;
  completed_lessons: number;
  total_lessons: number;
  last_lesson: string | null;
  progress_percent: number;
}

interface StudentsTableProps {
  students: Student[];
  onViewAnswers: (studentId: number) => void;
}

export default function StudentsTable({ students, onViewAnswers }: StudentsTableProps) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-900 font-medium text-sm">У вас пока нет зарегистрированных учеников.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Имя / Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Дата регистрации</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Прогресс обучения</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Текущий / Последний урок</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{student.name}</div>
                  <div className="text-xs font-medium text-gray-900/80">{student.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {new Date(student.created_at).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 min-w-[50px] text-center">
                      {student.progress_percent || 0}%
                    </span>
                    <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${student.progress_percent || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {student.completed_lessons}/{student.total_lessons}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-black text-gray-900 max-w-[200px] truncate">
                    {student.last_lesson || '👉 Еще не приступал'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* ИСПРАВЛЕНО: Изменен текст кнопки, чтобы не путать лидера, но сохранен обработчик onClick */}
                  <button 
                    onClick={() => onViewAnswers(student.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-xs"
                  >
                    📊 Посмотреть отчет
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
