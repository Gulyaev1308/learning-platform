'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/dashboard/ProgressBar';
import LessonsList from '@/components/dashboard/LessonsList';
import LogoutButton from '@/components/ui/LogoutButton';

interface DashboardData {
  lessons: any[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  currentLesson: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/lessons');
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      console.log('Dashboard data:', data);

      if (!response.ok) {
        setError(data.error || 'Ошибка при загрузке');
        return;
      }

      setData(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-900 font-medium">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ваш кабинет</h1>
          <LogoutButton />
        </div>

        <ProgressBar 
          progress={data.progressPercent} 
          completedLessons={data.completedLessons} 
          totalLessons={data.totalLessons} 
        />

        {data.currentLesson && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {data.completedLessons === 0 ? 'Начать обучение' : 'Продолжить обучение'}
            </h2>
            <p className="text-gray-700 mb-4">{data.currentLesson.title}</p>
            <button 
              onClick={() => router.push(`/lesson/${data.currentLesson.id}`)} 
              className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              {data.completedLessons === 0 ? 'Начать' : 'Продолжить'}
            </button>
          </div>
        )}

        <LessonsList groupedLessons={data.lessons} />
      </div>
    </div>
  );
}
