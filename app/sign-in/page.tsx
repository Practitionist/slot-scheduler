'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message ?? 'Sign in failed');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-sm text-center text-gray-600">
            No account?{' '}
            <Link href="/sign-up" className="text-green-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
