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
      } finaly {
        setLoading(false);
      }
    }
    if (lessonId) fetchLesson();
  }, [lessonId]);

  if (loading) return <div className="p-8 text-center text-gray-600 font-medium">Загрузка урока...</div>;
  if (!lesson) return <div className="p-8 text-center text-red-500 font-medium">Урок не найден</div>;

  const isQuizAvailable = lesson.type !== 'video' || videoEnded;

  // ИСПРАВЛЕННЫЙ ХАК ДЛЯ ПУТИ ВИДЕО: проверяем, зашит ли уже префикс в базе данных
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 bg-white text-gray-900 rounded-xl shadow-xs border border-gray-100 mt-4">
      <h1 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">{lesson.title}</h1>
      
      {lesson.type === 'video' && videoSrc && (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-md">
          <video 
            src={videoSrc} 
            controls 
            controlsList="nodownload"
            onEnded={() => setVideoEnded(true)}
            className="w-full h-full"
          />
        </div>
      )}

      {lesson.description && (
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-2">Описание урока:</h2>
          <p className="text-gray-600 leading-relaxed性能 whitespace-pre-wrap text-sm">{lesson.description}</p>
        </div>
      )}

      {quizContent && quizContent.questions && quizContent.questions.length > 0 && (
        <div className={`transition-all duration-300 ${isQuizAvailable ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-100 space-y-4">
            <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
              📋 Тест / Опрос к уроку: 
              {!isQuizAvailable && <span className="text-xs text-amber-600 font-normal bg-amber-100 px-2 py-0.5 rounded-full ml-2">Доступно после полного просмотра видео</span>}
            </h2>
            
            {isQuizAvailable && (
              <>
                {quizContent.questions.map((q: any, i: number) => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-blue-50 shadow-2xs">
                    <p className="font-medium text-gray-800 text-sm mb-2">{i + 1}. {q.text || q.question}</p>
                    {quizContent.type === 'options' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, idx: number) => (
                          <label key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-600">
                            <input type="radio" name={`q-${i}`} value={opt} className="text-blue-600" />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}
                    {quizContent.type === 'free_text' && (
                      <textarea rows={3} placeholder="Введите ваш answer здесь..." className="w-full p-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-400" />
                    )}
                  </div>
                ))}
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-xs transition">
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
