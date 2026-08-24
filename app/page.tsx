import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Обучающая платформа
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Добро пожаловать на платформу обучения
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </div>
  );
}
