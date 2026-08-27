import RegisterLeaderForm from '@/components/auth/RegisterLeaderForm';
import Link from 'next/link';

export default function RegisterLeaderPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <RegisterLeaderForm />
        <p className="text-center text-gray-700 mt-4">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-bold">
            Войдите
          </Link>
        </p>
      </div>
    </div>
  );
}
