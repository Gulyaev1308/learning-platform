'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentsTable from '@/components/leader/StudentsTable';
import QuizAnswers from '@/components/leader/QuizAnswers';
import ReferralLink from '@/components/leader/ReferralLink';
import LogoutButton from '@/components/ui/LogoutButton';

interface Student {
  id: number;
  email: string;
  name: string;
  created_at: string;
  completed_lessons: number;
  total_lessons: number;
  last_lesson: string | null;
  progress_percent: number;
}

interface QuizAnswersData {
  student: {
    id: number;
    name: string;
    email: string;
  };
  stats: {
    total_quizzes: number;
    answered_quizzes: number;
    completion_percent: number;
  };
  answers: any[];
}

export default function LeaderPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [leaderId, setLeaderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizData, setQuizData] = useState<QuizAnswersData | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/leader/students');
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (response.status === 403) {
        router.push('/dashboard');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при загрузке данных');
        return;
      }

      setStudents(data.students);
      setLeaderId(data.leaderId);
    } catch (err) {
      setError('Произошла ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnswers = async (studentId: number) => {
    try {
      const response = await fetch(`/api/leader/students/${studentId}/answers`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при загрузке ответов');
        return;
      }

      setQuizData(data);
      setShowAnswers(true);
    } catch (err) {
      setError('Произошла ошибка при загрузке ответов');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Кабинет лидера
            </h1>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {leaderId && (
          <div className="mb-6">
            <ReferralLink leaderId={leaderId} />
          </div>
        )}

        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Ваши ученики
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Всего учеников: {students.length}
          </p>
        </div>

        <StudentsTable 
          students={students} 
          onViewAnswers={handleViewAnswers} 
        />
      </div>

      {showAnswers && quizData && (
        <QuizAnswers 
          student={quizData.student}
          stats={quizData.stats}
          answers={quizData.answers}
          onClose={() => setShowAnswers(false)} 
        />
      )}
    </div>
  );
}
