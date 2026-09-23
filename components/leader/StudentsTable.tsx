import React, { useState } from 'react';

interface Student {
  id: number;
  email: string;
  name: string;
  created_at: string;
  completed_lessons: number;
  total_lessons: number;
  last_lesson: string | null;
  progress_percent: number;
  current_locked_block_id?: number | null;
  current_locked_block_title?: string | null;
}

interface StudentsTableProps {
  students: Student[];
  onViewAnswers: (studentId: number) => void;
}

export default function StudentsTable({ students, onViewAnswers }: StudentsTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [verifying, setVerifying] = useState(false);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500 font-medium text-sm">У вас пока нет зарегистрированных учеников.</p>
      </div>
    );
  }

  const handleVerifyPayment = async (studentId: number, blockId: number, blockTitle: string | null, action: 'approved' | 'rejected') => {
    setVerifying(true);
    try {
      const res = await fetch('/api/leader/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: Number(studentId), block_id: Number(blockId), action })
      });
      if (res.ok) {
        alert(action === 'approved' ? `Доступ к объекту "${blockTitle || ''}" открыт!` : 'Доступ ограничен');
        setSelectedStudent(null);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка изменения доступа');
      }
    } catch (err) {
      alert('Ошибка выполнения операции');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Главный экран: Сетка компактных карточек — только Имя и Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-500 transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition truncate text-base">
                {student.name}
              </h4>
              <p className="text-sm text-gray-500 truncate mt-1">{student.email}</p>
            </div>
            <div className="mt-4 pt-2 border-t border-gray-100 text-right">
              <span className="text-xs text-blue-600 font-bold group-hover:underline">
                Управлять &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Первое модальное окно управления */}
      {selectedStudent && (() => {
        const hasLock = selectedStudent.current_locked_block_id !== undefined && selectedStudent.current_locked_block_id !== null;
        const currentLockedBlockId = hasLock ? Number(selectedStudent.current_locked_block_id) : null;
        const currentLockedBlockTitle = hasLock ? (selectedStudent.current_locked_block_title ?? null) : null;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>

              <div>
                <h3 className="text-lg font-extrabold text-gray-900">{selectedStudent.name}</h3>
                <p className="text-xs text-gray-500">{selectedStudent.email}</p>
              </div>

              {/* Детальная сводка по студенту */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-2 text-gray-700">
                <p><span className="font-bold text-gray-500">Регистрация:</span> {new Date(selectedStudent.created_at).toLocaleDateString("ru-RU")}</p>
                <div>
                  <span className="font-bold text-gray-500">Прогресс обучения:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedStudent.progress_percent || 0}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-xs shrink-0 text-gray-900">{selectedStudent.progress_percent || 0}%</span>
                  </div>
                </div>
                <p><span className="font-bold text-gray-500">Уроки:</span> {selectedStudent.completed_lessons} из {selectedStudent.total_lessons}</p>
                <p className="truncate"><span className="font-bold text-gray-500">Последний шаг:</span> {selectedStudent.last_lesson || "Еще не приступал"}</p>
              </div>

              {/* ПЕРЕНЕСЕННЫЙ АВТОМАТИЧЕСКИЙ УМНЫЙ КОНТРОЛЬ ДОСТУПА */}
              {hasLock && currentLockedBlockId ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 flex flex-wrap items-center gap-1.5">
                    🔑 Контроль доступа: <span className="underline font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">{currentLockedBlockTitle}</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    Студент дошел до платного этапа обучения. Если вы получили оплату, подтвердите её для открытия контента:
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={verifying}
                      onClick={() => handleVerifyPayment(selectedStudent.id, currentLockedBlockId, currentLockedBlockTitle, 'approved')}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                    >
                      Открыть доступ
                    </button>
                    <button
                      disabled={verifying}
                      onClick={() => handleVerifyPayment(selectedStudent.id, currentLockedBlockId, currentLockedBlockTitle, 'rejected')}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition disabled:opacity-50"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-[11px] text-green-800 font-bold">
                    ✅ Все доступные блоки оплачены или пройдены. Подтверждение не требуется.
                  </p>
                </div>
              )}

              {/* Кнопка открытия результатов анкет */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    onViewAnswers(selectedStudent.id);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition text-center shadow-xs"
                >
                  📊 Посмотреть отчеты по анкетам
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
