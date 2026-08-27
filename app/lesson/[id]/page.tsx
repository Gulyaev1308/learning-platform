'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import VideoLesson from '@/components/lesson/VideoLesson';
import TextLesson from '@/components/lesson/TextLesson';
import QuizLesson from '@/components/lesson/QuizLesson';

interface LessonData {
  id: number;
  title: string;
  type: string;
  content: any;
  order_index: number;
  completed: boolean;
  description?: string;
  quiz_data?: string;
  homework_data?: string;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    if (lessonId) fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Ошибка'); return; }
      setLesson(data.lesson);
      if (data.lesson.type !== 'video') setVideoEnded(true);
    } catch { setError('Ошибка'); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (!videoEnded) { setError('Просмотрите видео до конца!'); return; }
    setCompleting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, { method: 'POST' });
      if (response.ok) {
        setLesson(prev => prev ? { ...prev, completed: true } : prev);
        setTimeout(() => router.push('/dashboard'), 1000);
      }
    } catch { setError('Ошибка'); } finally { setCompleting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-900">Загрузка...</p></div>;
  if (!lesson) return null;

  const quizContent = lesson.quiz_data ? JSON.parse(lesson.quiz_data) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-700 font-semibold mb-3">← Назад</button>

        {/* Название как в YouTube */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{lesson.title}</h1>

        {/* Видео */}
        {lesson.type === 'video' && (
          <VideoLesson
            content={lesson.content}
            title={lesson.title}
            onEnded={() => setVideoEnded(true)}
          />
        )}
        {lesson.type === 'text' && <TextLesson content={lesson.content} />}

        {/* Описание ПОД видео, как в YouTube */}
        {lesson.description && (
          <div className="bg-white rounded-xl p-4 mt-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">Описание</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{lesson.description}</p>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg font-medium">{error}</div>}

        {/* После просмотра видео */}
        {videoEnded && (
          <>
            {quizContent && (
              <div className="mt-4">
                <QuizLesson
                  content={quizContent}
                  onAnswer={async (answers: any[]) => {
                    await fetch(`/api/lessons/${lessonId}/quiz`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ answers }),
                    });
                  }}
                  isCompleted={lesson.completed}
                />
              </div>
            )}
            {lesson.homework_data && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mt-4">
                <h3 className="font-bold text-gray-900 mb-2">📝 Домашнее задание</h3>
                <p className="text-gray-900 whitespace-pre-wrap">{lesson.homework_data}</p>
              </div>
            )}
          </>
        )}

        {/* Кнопка завершения */}
        <div className="bg-white rounded-xl shadow p-5 mt-4">
          {lesson.completed ? (
            <p className="text-green-700 font-bold text-center text-lg">✓ Урок завершен</p>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing || !videoEnded}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!videoEnded ? '🔒 Досмотрите видео до конца' : completing ? 'Завершаем...' : '✅ Завершить урок'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
