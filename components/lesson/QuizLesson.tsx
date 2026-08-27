'use client';

import { useState } from 'react';

interface QuizLessonProps {
  content: any[];
  onAnswer: (answers: any[]) => void;
  isCompleted: boolean;
}

export default function QuizLesson({ content, onAnswer, isCompleted }: QuizLessonProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [freeText, setFreeText] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  const questions = Array.isArray(content) ? content : [];

  const handleSave = () => {
    const answers = questions.map((q, index) => ({
      question: q.question || '',
      selected: selectedAnswers[index] || null,
      freeAnswer: freeText[index] || '',
    }));
    onAnswer(answers);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {qIndex + 1}. {q.question}
          </h3>
          
          {q.options && q.options.length > 0 && (
            <div className="space-y-3 mb-4">
              {q.options.map((option: string, oIndex: number) => (
                <label
                  key={oIndex}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer ${
                    selectedAnswers[qIndex] === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${saved ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name={`question_${qIndex}`}
                    checked={selectedAnswers[qIndex] === option}
                    onChange={() => setSelectedAnswers({ ...selectedAnswers, [qIndex]: option })}
                    disabled={saved || isCompleted}
                    className="mr-3"
                  />
                  <span className="text-gray-900 font-medium">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Свободный ответ */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              💭 Ваш ответ / комментарий
            </label>
            <textarea
              value={freeText[qIndex] || ''}
              onChange={(e) => setFreeText({ ...freeText, [qIndex]: e.target.value })}
              disabled={saved || isCompleted}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:border-blue-500"
              rows={3}
              placeholder="Напишите, что вы чувствуете или думаете..."
            />
          </div>
        </div>
      ))}

      {!saved && !isCompleted && (
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
        >
          Сохранить ответы
        </button>
      )}

      {saved && <p className="text-green-700 font-bold text-center">✅ Ответы сохранены</p>}
    </div>
  );
}
