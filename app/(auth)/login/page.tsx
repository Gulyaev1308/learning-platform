import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm />
        <p className="text-center text-gray-600 mt-4">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-blue-500 hover:text-blue-700 font-semibold">
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
    </div>
  );
}
