import React, { useState } from 'react';

interface QuizAnswersProps {
  student: { id: number; name: string; email: string };
  stats: any;
  answers: any[];
  onClose: () => void;
}

export default function QuizAnswers({ student, stats, answers, onClose }: QuizAnswersProps) {
  const [verifying, setVerifying] = useState(false);

  // 1. Исключаем из анализа все уроки, которые студент УЖЕ успешно прошел
  const uncompletedLessons = answers.filter(row => {
    return row.status !== 'completed';
  });

  // 2. Среди оставшихся (невыполненных) уроков ищем самый первый платный блок
  const currentLockedBlock = uncompletedLessons.find(row => {
    const isPremium = 
      row.block_is_premium === true || 
      row.block_is_premium === 'true' || 
      row.block_is_premium === 1 ||
      String(row.block_title).toLowerCase().includes('платный');
      
    return isPremium || row.status === 'locked';
  });

  // 3. Динамически подставляем ID и Имя блока (ИСПРАВЛЕНО: Принудительный Number)
  const currentLockedBlockId = currentLockedBlock ? Number(currentLockedBlock.block_id) : 2;
  const currentLockedBlockTitle = currentLockedBlock ? currentLockedBlock.block_title : "Платный блок";

  // Функция для ручного открытия платного блока лидеру
  const handleVerifyPayment = async (blockId: number, action: 'approved' | 'rejected') => {
    setVerifying(true);
    try {
      const res = await fetch('/api/leader/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: Number(student.id), block_id: Number(blockId), action })
      });
      if (res.ok) {
        alert(action === 'approved' ? `Доступ к объекту "${currentLockedBlockTitle}" открыт!` : 'Заявка отклонена');
        onClose();
        window.location.reload();
      }
    } catch (err) {
      alert('Ошибка выполнения операции');
    } finally {
      setVerifying(false);
    }
  };

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

        {/* ДИНАМИЧЕСКИЙ КОНТРОЛЬ ДОСТУПА ПО ТЕКУЩЕМУ БЛОКУ */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            🔑 Контроль платного доступа: <span className="underline font-extrabold">{currentLockedBlockTitle}</span>
          </h4>
          <p className="text-xs text-amber-700">
            Если новичок перевел вам оплату на карту, подтвердите его участие для открытия этого этапа обучения:
          </p>
          <div className="flex gap-2">
            <button 
              disabled={verifying} 
              onClick={() => handleVerifyPayment(currentLockedBlockId, 'approved')} 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              Открыть доступ (Оплата получена)
            </button>
            <button 
              disabled={verifying} 
              onClick={() => handleVerifyPayment(currentLockedBlockId, 'rejected')} 
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              Закрыть доступ
            </button>
          </div>
        </div>

        {/* ВЫВОД РЕЗУЛЬТАТОВ ОПРОСОВ */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-gray-700 border-b border-gray-100 pb-2">📊 Результаты заполненных анкет:</h4>
          {answers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Студент еще не отправлял ответы на тесты.</p>
          ) : (
            answers.map((row: any, idx: number) => {
              const itemAnswers = typeof row.answers === 'string' ? JSON.parse(row.answers) : (row.answers?.answers || row.answers || []);
              return (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{row.lesson_title || 'Урок'}</span>
                  <div className="space-y-2 pt-1">
                    {Array.isArray(itemAnswers) ? itemAnswers.map((ans: any, i: number) => (
                      <div key={i} className="text-xs">
                        <p className="text-gray-500 font-medium">Вопрос: {ans.question}</p>
                        <p className="text-gray-900 font-bold bg-white p-2 rounded border border-gray-100 mt-0.5">Ответ: {ans.answer}</p>
                      </div>
                    )) : <p className="text-xs text-gray-800">{JSON.stringify(itemAnswers)}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
