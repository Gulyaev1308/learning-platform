import React, { useState } from 'react';

interface QuizAnswersProps {
  student: { id: number; name: string; email: string };
  stats: any;
  answers: any[];
  onClose: () => void;
}

export default function QuizAnswers({ student, stats, answers, onClose }: QuizAnswersProps) {
  const [verifying, setVerifying] = useState(false);

  // Функция для ручного открытия платного Блока 2 лидеру
  const handleVerifyPayment = async (blockId: number, action: 'approved' | 'rejected') => {
    setVerifying(true);
    try {
      const res = await fetch('/api/leader/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, block_id: blockId, action })
      });
      if (res.ok) {
        alert(action === 'approved' ? 'Доступ к Блоку открыт!' : 'Заявка отклонена');
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

        {/* УПРАВЛЕНИЕ ДОСТУПОМ К ПЛАТНОМУ БЛОКУ 2 (ИСПРАВЛЕНО: Блок снова активен и отображается) */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">🔑 Контроль платного доступа (Блок 2)</h4>
          <p className="text-xs text-amber-700">Если новичок перевел вам оплату на карту, подтвердите его участие для открытия «лестницы» обучения:</p>
          <div className="flex gap-2">
            <button disabled={verifying} onClick={() => handleVerifyPayment(2, 'approved')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition">
              Открыть Блок 2 (Оплата получена)
            </button>
            <button disabled={verifying} onClick={() => handleVerifyPayment(2, 'rejected')} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition">
              Закрыть доступ
            </button>
          </div>
        </div>

        {/* ВЫВОД РЕЗУЛЬТАТОВ ОПРОСОВ (Распаковываем массив ответов JSONB) */}
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
