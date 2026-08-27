'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterLeaderForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register-leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при регистрации');
        return;
      }

      router.push('/leader');
      router.refresh();
    } catch (err) {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl px-8 pt-6 pb-8 border border-gray-200">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">Регистрация лидера</h2>
      <p className="text-sm text-gray-700 text-center mb-6">Для наставников и руководителей</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg font-medium">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="name">
          Имя
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="shadow border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-900 font-medium focus:outline-none focus:border-blue-500"
          placeholder="Ваше имя"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="shadow border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-900 font-medium focus:outline-none focus:border-blue-500"
          placeholder="your@email.com"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-900 text-sm font-bold mb-2" htmlFor="password">
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="shadow border-2 border-gray-300 rounded-lg w-full py-2 px-3 text-gray-900 font-medium focus:outline-none focus:border-blue-500"
          placeholder="Минимум 6 символов"
          minLength={6}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
