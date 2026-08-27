'use client';

import { useState } from 'react';

interface QuizLessonProps {
  content: any;
  onAnswer: (answers: any[]) => void;
  isCompleted: boolean;
}

export default function QuizLesson({ content, onAnswer, isCompleted }: QuizLessonProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  const quizType = content?.type || 'options';
  const questions = content?.questions || [];

  const handleSave = () => {
    const answers = questions.map((q: any, index: number) => ({
      question: q.question || '',
      answer: quizType === 'free_text' ? textAnswers[index] || '' : selectedAnswers[index] || '',
    }));
    onAnswer(answers);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {questions.map((q: any, qIndex: number) => (
        <div key={qIndex} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{qIndex + 1}. {q.question}</h3>

          {quizType === 'options' && q.options && (
            <div className="space-y-3">
              {q.options.map((option: string, oIndex: number) => (
                <label key={oIndex} className={`flex items-center p-3 border-2 rounded-lg cursor-pointer ${selectedAnswers[qIndex] === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <input type="radio" name={`q_${qIndex}`} checked={selectedAnswers[qIndex] === option} onChange={() => setSelectedAnswers({ ...selectedAnswers, [qIndex]: option })} disabled={saved || isCompleted} className="mr-3" />
                  <span className="text-gray-900 font-medium">{option}</span>
                </label>
              ))}
            </div>
          )}

          {quizType === 'free_text' && (
            <textarea value={textAnswers[qIndex] || ''} onChange={(e) => setTextAnswers({ ...textAnswers, [qIndex]: e.target.value })} disabled={saved || isCompleted} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-gray-900 font-medium" rows={4} placeholder="Напишите ваш ответ..." />
          )}
        </div>
      ))}

      {!saved && !isCompleted && (
        <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">Сохранить ответы</button>
      )}

      {saved && <p className="text-green-700 font-bold text-center">✅ Ответы сохранены</p>}
    </div>
  );
}
