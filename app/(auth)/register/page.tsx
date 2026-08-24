import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <RegisterForm />
        <p className="text-center text-gray-600 mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-700 font-semibold">
            Войдите
          </Link>
        </p>
      </div>
    </div>
  );
}
