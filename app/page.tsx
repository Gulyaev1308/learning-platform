import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
        Обучающая платформа
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center">
        Выберите способ входа
      </p>
      
      <div className="space-y-4 w-full max-w-sm">
        <Link
          href="/login"
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
        >
          Войти
        </Link>
        
        <Link
          href="/register-leader"
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
        >
          Регистрация лидера
        </Link>
        
        <p className="text-center text-gray-700 text-sm py-2">
          Вы ученик? Войдите по ссылке от вашего наставника
        </p>
      </div>
    </div>
  );
}
