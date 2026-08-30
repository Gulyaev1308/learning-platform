'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LessonPage() {
  const router = useRouter();
  const { id: lessonId } = useParams();
  
  const [lesson, setLesson] = useState<any>(null);
  const [quizContent, setQuizContent] = useState<any>(null);
  const [videoEnded, setVideoEnded] = useState(false); // Стейт лестницы внутри урока
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/lessons/${lessonId}`);
        const data = await res.json();
        if (data.success && data.lesson) {
          // ИСПРАВЛЕНО: Так как данные могут прийти как объект или массив из-за pg-rows
          const targetLesson = Array.isArray(data.lesson) ? data.lesson[0] : data.lesson;
          setLesson(targetLesson);
          
          if (targetLesson.quiz_data) {
            setQuizContent(typeof targetLesson.quiz_data === 'string' ? JSON.parse(targetLesson.quiz_data) : targetLesson.quiz_data);
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

  if (loading) return <div className="p-8 text-center text-gray-400">Загрузка урока...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-500 font-medium">Урок не найден</div>;

  // Если типа урока НЕ видео — опрос доступен сразу
  const isQuizAvailable = lesson.type !== 'video' || videoEnded;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 text-gray-200">
      <h1 className="text-2xl font-bold border-b border-gray-800 pb-3">{lesson.title}</h1>
      
      {lesson.type === 'video' && lesson.content && (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800">
          <video 
            // ИСПРАВЛЕНО: Регистр пути под [fileName]/route.ts
            src={`/api/videos/${lesson.content}`} 
            controls 
            controlsList="nodownload"
            onEnded={() => setVideoEnded(true)} // Как только досмотрел — открываем опрос!
            className="w-full h-full"
          />
        </div>
      )}

      {lesson.description && (
        <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-800 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-gray-100">Описание урока:</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap text-sm">{lesson.description}</p>
        </div>
      )}

      {/* ОПРОС: Рендерится красиво, только если видео досмотрено до конца */}
      {quizContent && quizContent.questions && quizContent.questions.length > 0 && (
        <div className={`transition-all duration-300 ${isQuizAvailable ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              📋 Тест / Опрос к уроку: {!isQuizAvailable && <span className="text-xs text-amber-500 font-normal">(Доступно после просмотра видео)</span>}
            </h2>
            
            {isQuizAvailable && (
              <>
                {quizContent.questions.map((q: any, i: number) => (
                  <div key={i} className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                    <p className="font-medium text-gray-200 mb-2">{i + 1}. {q.text || q.question}</p>
                    {quizContent.type === 'options' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, idx: number) => (
                          <label key={idx} className="flex items-center gap-2 p-2 border border-gray-800 rounded-lg hover:bg-gray-900 cursor-pointer text-sm text-gray-400">
                            <input type="radio" name={`q-${i}`} value={opt} className="text-blue-600" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {quizContent.type === 'free_text' && (
                      <textarea rows={3} placeholder="Введите ваш ответ здесь..." className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500" />
                    )}
                  </div>
                ))}
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition">
                  Отправить ответы
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
