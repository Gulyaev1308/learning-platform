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

      alert('Ответы отправлены!');
      router.push('/dashboard');
    } catch (err) {
      alert('Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Загрузка...</div>;
  if (!lesson) return <div className="min-h-screen flex items-center justify-center text-red-500">Урок не найден</div>;

  const isQuizAvailable = lesson.type !== 'video' || videoEnded;

  return (
    // ИСПРАВЛЕНО: Стили полностью наследуют глобальный дизайн (bg-inherit, text-current), текст контрастный
    <div className="min-h-screen w-full bg-inherit text-current p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-500/20 pb-4">
          <h1 className="text-2xl font-bold text-current">{lesson.title}</h1>
          <button onClick={() => router.push('/dashboard')} className="text-sm bg-gray-500/10 hover:bg-gray-500/20 px-4 py-2 rounded-xl transition text-current">
            ← Назад
          </button>
        </div>
        
        {lesson.type === 'video' && lesson.content && (
          <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video max-h-[70vh] mx-auto border border-gray-500/10">
            <video src={lesson.content.startsWith('http') ? lesson.content : `/api/videos/${lesson.content}`} controls controlsList="nodownload" onEnded={() => setVideoEnded(true)} className="w-full h-full object-contain" />
          </div>
        )}

        {lesson.description && (
          <div className="bg-gray-500/5 p-6 rounded-2xl border border-gray-500/10">
            <h2 className="text-lg font-semibold mb-2 text-current">Описание:</h2>
            <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap text-current">{lesson.description}</p>
          </div>
        )}

        {quizContent && quizContent.questions && quizContent.questions.length > 0 && (
          <div className={`transition-all duration-300 ${isQuizAvailable ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/20 space-y-4">
              <h2 className="text-lg font-semibold text-blue-500 flex items-center gap-2">
                📋 Опрос: {!isQuizAvailable && <span className="text-xs text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full ml-2">Доступно после просмотра</span>}
              </h2>
              
              {isQuizAvailable && (
                <div className="space-y-4">
                  {quizContent.questions.map((q: any, i: number) => (
                    <div key={i} className="bg-gray-500/5 p-4 rounded-xl border border-gray-500/10">
                      <p className="font-medium text-sm mb-3 text-current">{i + 1}. {q.text || q.question}</p>
                      {quizContent.type === 'options' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt: string, idx: number) => (
                            <label key={idx} className="flex items-center gap-3 p-3 bg-gray-500/5 border border-gray-500/10 rounded-xl hover:bg-gray-500/10 cursor-pointer transition text-sm text-current">
                              <input type="radio" name={`q-${i}`} value={opt} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} className="text-blue-500 h-4 w-4" />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                      {quizContent.type === 'free_text' && (
                        <textarea rows={3} placeholder="Введите ваш ответ..." onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} className="w-full p-3 bg-gray-500/5 border border-gray-500/20 rounded-xl text-sm text-current focus:outline-none focus:border-blue-500 transition" />
                      )}
                    </div>
                  ))}
                  <button onClick={handleSubmitQuiz} disabled={sending} className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-lg transition-all active:scale-98">
                    {sending ? 'Сохранение...' : '🚀 Отправить ответы'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
