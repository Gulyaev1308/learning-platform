import React, { useState } from "react";

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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <p className="text-gray-500 font-medium text-sm">У вас пока нет зарегистрированных учеников.</p>
      </div>
    );
  }

  const handleToggleAccess = async (studentId: number, blockId: number, action: string) => {
    try {
      setLoadingAction(`${studentId}-${blockId}`);
      const res = await fetch("/api/leader/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, block_id: blockId, action }),
      });
      if (res.ok) {
        alert("Статус оплаты успешно изменен");
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка изменения доступа");
      }
    } catch (err) {
      alert("Ошибка сети");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Главный экран: Сетка карточек — видно только Имя и Email */}
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
                Открыть управление &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно управления учеником */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              &times;
            </button>

            {/* Заголовок модалки */}
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">{selectedStudent.name}</h3>
              <p className="text-xs text-gray-500">{selectedStudent.email}</p>
            </div>

            {/* Вся детальная информация */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm space-y-2 text-gray-700">
              <p><span className="font-bold text-gray-500">Дата регистрации:</span> {new Date(selectedStudent.created_at).toLocaleDateString("ru-RU")}</p>
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
              <p><span className="font-bold text-gray-500">Пройдено уроков:</span> {selectedStudent.completed_lessons} из {selectedStudent.total_lessons}</p>
              <p className="truncate"><span className="font-bold text-gray-500">Последний урок:</span> {selectedStudent.last_lesson || "Еще не приступал"}</p>
            </div>

            {/* Управление оплатой для новичка */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Управление оплатой блока</h5>
              <div className="flex gap-2">
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleToggleAccess(selectedStudent.id, 1, "approved")}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-xs font-bold rounded-lg transition"
                >
                  {loadingAction === `${selectedStudent.id}-1` ? "Секунду..." : "🟢 Активировать доступ"}
                </button>
                <button
                  disabled={loadingAction !== null}
                  onClick={() => handleToggleAccess(selectedStudent.id, 1, "rejected")}
                  className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-gray-50 text-xs font-bold rounded-lg transition border border-red-200"
                >
                  Закрыть
                </button>
              </div>
            </div>

            {/* Переход к отчетам */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  onViewAnswers(selectedStudent.id);
                  setSelectedStudent(null);
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition text-center"
              >
                📊 Посмотреть ответы по отчетам
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
