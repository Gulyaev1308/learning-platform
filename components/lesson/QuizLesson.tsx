'use client';

import { useState } from 'react';

interface QuizQuestion {
  question: string;
  options: string[];
}

interface QuizLessonProps {
  content: QuizQuestion[];
  onAnswer: (answers: any[]) => void;
  isCompleted: boolean;
}

export default function QuizLesson({ content, onAnswer, isCompleted }: QuizLessonProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [freeAnswers, setFreeAnswers] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  const questions = Array.isArray(content) ? content : [];

  const handleSave = () => {
    const answers = questions.map((q, index) => ({
      question: q.question,
      selected: selectedAnswers[index] || null,
      freeAnswer: freeAnswers[index] || '',
    }));
    onAnswer(answers);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Вопрос {qIndex + 1}: {q.question}
          </h3>
          
          <div className="space-y-3">
            {q.options && q.options.map((option, oIndex) => (
              <label
                key={oIndex}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedAnswers[qIndex] === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${saved ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name={`question_${qIndex}`}
                  value={option}
                  checked={selectedAnswers[qIndex] === option}
                  onChange={() => {
                    const newAnswers = { ...selectedAnswers, [qIndex]: option };
                    setSelectedAnswers(newAnswers);
                  }}
                  disabled={saved || isCompleted}
                  className="mr-3"
                />
                <span className="text-gray-900 font-medium">{option}</span>
              </label>
            ))}
          </div>

          {/* Свободный ответ */}
          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              💭 Ваш комментарий (необязательно)
            </label>
            <textarea
              value={freeAnswers[qIndex] || ''}
              onChange={(e) => {
                const newFree = { ...freeAnswers, [qIndex]: e.target.value };
                setFreeAnswers(newFree);
              }}
              disabled={saved || isCompleted}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-medium focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Напишите, что вы чувствуете или думаете..."
            />
          </div>
        </div>
      ))}

      {!saved && !isCompleted && (
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Сохранить ответы
        </button>
      )}

      {saved && (
        <p className="text-green-700 font-bold text-center">✅ Ответы сохранены</p>
      )}
    </div>
  );
}
