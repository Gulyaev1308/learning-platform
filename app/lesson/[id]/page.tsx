import React from 'react';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id: lessonId } = await params;

  // Тянем урок напрямую из базы
  const lessonResult = await db.query('SELECT * FROM lessons WHERE id = $1', [lessonId]);
  const lesson = lessonResult.rows[0];

  if (!lesson) {
    return <div className="p-8 text-center text-red-500 font-medium">Урок не найден</div>;
  }

  // БЕЗОПАСНЫЙ ИММУННЫЙ ПАРСЕР ОПРОСОВ (Защита от падения 500)
  let quizContent = null;
  if (lesson.quiz_data) {
    if (typeof lesson.quiz_data === 'object') {
      quizContent = lesson.quiz_data;
    } else if (typeof lesson.quiz_data === 'string' && lesson.quiz_data !== '[object Object]') {
      try {
        quizContent = JSON.parse(lesson.quiz_data);
      } catch (e) {
        console.error('Error parsing lesson quiz_data:', e);
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
      
      {lesson.type === 'video' && lesson.content && (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800">
          <video 
            src={`/api/videos/${lesson.content}`} 
            controls 
            controlsList="nodownload"
            className="w-full h-full"
          />
        </div>
      )}

      {lesson.description && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Описание урока:</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
        </div>
      )}

      {quizContent && quizContent.questions && quizContent.questions.length > 0 && (
        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📋 Тест / Опрос к уроку:</h2>
          <div className="space-y-4">
            {quizContent.questions.map((q: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-lg border border-blue-100 shadow-2xs">
                <p className="font-medium text-gray-800 mb-2">{i + 1}. {q.text || q.question}</p>
                {quizContent.type === 'options' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt: string, idx: number) => (
                      <label key={idx} className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-600">
                        <input type="radio" name={`q-${i}`} value={opt} className="text-blue-600" />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {quizContent.type === 'free_text' && (
                  <textarea rows={3} placeholder="Введите ваш ответ здесь..." className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400" />
                )}
              </div>
            ))}
            <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition">
              Отправить ответы
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
