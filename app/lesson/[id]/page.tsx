'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import VideoLesson from '@/components/lesson/VideoLesson';
import TextLesson from '@/components/lesson/TextLesson';
import QuizLesson from '@/components/lesson/QuizLesson';
import PracticeLesson from '@/components/lesson/PracticeLesson';

interface LessonData {
  id: number;
  title: string;
  type: string;
  content: any;
  block: number;
  module: number | null;
  order_index: number;
  completed: boolean;
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (data.locked) {
          setError('Этот урок заблокирован. Завершите предыдущий урок.');
        } else {
          setError(data.error || 'Ошибка при загрузке урока');
        }
        return;
      }

      setLesson(data.lesson);
    } catch (err) {
      setError('Произошла ошибка при загрузке урока');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError('');

    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при завершении урока');
        return;
      }

      // Обновляем состояние урока
      setLesson(prev => prev ? { ...prev, completed: true } : prev);

      // Показываем сообщение об успехе
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError('Произошла ошибка при завершении урока');
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizAnswer = async (answer: string) => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при сохранении ответа');
      }
    } catch (err) {
      setError('Произошла ошибка при сохранении ответа');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка урока...</p>
        </div>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← Назад к урокам
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {lesson.title}
            </h1>
            <span className="text-sm text-gray-500">
              Урок {lesson.order_index}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          {lesson.type === 'video' && (
            <VideoLesson content={lesson.content} title={lesson.title} />
          )}
          {lesson.type === 'text' && (
            <TextLesson content={lesson.content} />
          )}
          {lesson.type === 'quiz' && (
            <QuizLesson
              content={lesson.content}
              onAnswer={handleQuizAnswer}
              isCompleted={lesson.completed}
            />
          )}
          {lesson.type === 'practice' && (
            <PracticeLesson content={lesson.content} />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {lesson.completed ? (
            <div className="text-center">
              <p className="text-green-600 font-semibold text-lg mb-2">
                ✓ Урок завершен
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Вернуться к урокам
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleComplete}
                disabled={completing}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {completing ? 'Завершаем...' : 'Завершить урок'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
