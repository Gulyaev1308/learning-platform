'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LessonPage() {
  const router = useRouter();
  const { id: lessonId } = useParams();
  
  const [lesson, setLesson] = useState<any>(null);
  const [quizContent, setQuizContent] = useState<any>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<any>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        const data = await res.json();
        if (data.success && data.lesson) {
          setLesson(data.lesson);
          if (data.lesson.quiz_data) {
            setQuizContent(typeof data.lesson.quiz_data === 'string' ? JSON.parse(data.lesson.quiz_data) : data.lesson.quiz_data);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (lessonId) fetchLesson();
  }, [lessonId]);

  const handleSubmitQuiz = async () => {
    if (sending) return;
    setSending(true);
    try {
      const formattedAnswers = quizContent.questions.map((q: any, i: number) => ({
        question: q.text || q.question,
        answer: answers[i] || 'Нет ответа'
      }));

      await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });

      alert('Ответы успешно отправлены! Урок пройден.');
      router.push('/dashboard');
    } catch (err) {
      alert('Ошибка при отправке ответов');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Загрузка урока...</div>;
  if (!lesson) return <div className="min-h-screen flex items-center justify-center text-red-500">Урок не найден</div>;

  const isQuizAvailable = lesson.type !== 'video' || videoEnded;

  // ВОЗВРАЩАЕМ РАБОЧИЙ ПАРСЕР ВИДЕО (Защита от 404)
  let videoSrc = '';
  if (lesson.content) {
    if (lesson.content.startsWith('/api/videos/') || lesson.content.startsWith('http')) {
      videoSrc = lesson.content;
    } else if (lesson.content.startsWith('api/videos/')) {
      videoSrc = `/${lesson.content}`;
    } else {
      videoSrc = `/api/videos/${lesson.content}`;
    }
  }

  return (
    // ЖЕСТКИЙ СТИЛИСТИЧЕСКИЙ ФИКС: Белый фон и глубокий черный контрастный текст
    <div className="min-h-screen w-full bg-white text-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition font-medium">
            ← Назад к модулям
          </button>
        </div>
        
        {lesson.type === 'video' && videoSrc && (
          <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video max-h-[70vh] mx-auto">
            <video 
              src={videoSrc} 
              controls 
              controlsList="nodownload"
              onEnded={() => setVideoEnded(true)}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {lesson.description && (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание урока:</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
          </div>
        )}

        {quizContent && quizContent.questions && quizContent.questions.length > 0 && (
          <div className={`transition-all duration-300 ${isQuizAvailable ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                📋 Тест / Опрос к уроку: 
                {!isQuizAvailable && <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full ml-2 font-medium">Доступно после полного просмотра видео</span>}
              </h2>
              
              {isQuizAvailable && (
                <div className="space-y-4">
                  {quizContent.questions.map((q: any, i: number) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200">
                      <p className="font-semibold text-sm mb-3 text-gray-900">{i + 1}. {q.text || q.question}</p>
                      {quizContent.type === 'options' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt: string, idx: number) => (
                            <label key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer transition text-sm text-gray-800 font-medium">
                              <input 
                                type="radio" 
                                name={`q-${i}`} 
                                value={opt} 
                                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                                className="text-blue-600 h-4 w-4" 
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                      {quizContent.type === 'free_text' && (
                        <textarea 
                          rows={3} 
                          placeholder="Введите ваш развернутый ответ здесь..." 
                          onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                          className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 transition shadow-inner" 
                        />
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-2">
                    <button 
                      onClick={handleSubmitQuiz}
                      disabled={sending}
                      className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm shadow-md transition-all active:scale-98"
                    >
                      {sending ? 'Сохранение результатов...' : '🚀 Отправить ответы и завершить урок'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
