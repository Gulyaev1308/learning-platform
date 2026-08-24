'use client';

import { useState } from 'react';

interface QuizLessonProps {
  content: {
    question: string;
    options: string[];
    correctAnswer?: number;
  };
  onAnswer: (answer: string) => void;
  isCompleted: boolean;
}

export default function QuizLesson({ content, onAnswer, isCompleted }: QuizLessonProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSave = () => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer);
      setSaved(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {content.question}
        </h3>
        
        <div className="space-y-3">
          {content.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedAnswer === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${saved ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="radio"
                name="quiz"
                value={option}
                checked={selectedAnswer === option}
                onChange={() => handleAnswerSelect(option)}
                disabled={saved || isCompleted}
                className="mr-3"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>

        {!saved && !isCompleted && (
          <button
            onClick={handleSave}
            disabled={!selectedAnswer}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить ответ
          </button>
        )}

        {saved && (
          <p className="mt-4 text-green-600 font-semibold">
            ✓ Ответ сохранен
          </p>
        )}
      </div>
    </div>
  );
}
