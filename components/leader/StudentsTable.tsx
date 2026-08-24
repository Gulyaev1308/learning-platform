'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';

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

interface StudentsTableProps {
  students: Student[];
  onViewAnswers: (studentId: number) => void;
}

export default function StudentsTable({ students, onViewAnswers }: StudentsTableProps) {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-900">У вас пока нет учеников</p>
      </div>
    );
  }

  return (
    <>
      {/* Мобильная версия - карточки */}
      <div className="md:hidden space-y-4">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-700">{student.email}</p>
              </div>
              <button
                onClick={() => onViewAnswers(student.id)}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                Ответы
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900">Прогресс:</span>
                  <span className="font-medium">{student.progress_percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${student.progress_percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-700 mt-1">
                  {student.completed_lessons} из {student.total_lessons} уроков
                </p>
              </div>

              <div className="text-sm">
                <span className="text-gray-900">Последний урок: </span>
                <span className="font-medium">{student.last_lesson || 'Не начал'}</span>
              </div>

              <div className="text-xs text-gray-600">
                Ученик с {formatDate(student.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Десктопная версия - таблица */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Прогресс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Последний урок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-700">
                      с {formatDate(student.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${student.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">
                        {student.progress_percent}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-700 mt-1">
                      {student.completed_lessons} из {student.total_lessons} уроков
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.last_lesson || 'Не начал'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onViewAnswers(student.id)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Ответы
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
