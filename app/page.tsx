'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    const next =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next') || '/dashboard'
        : '/dashboard';

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return alert(error.message);
      // If email confirmation is enabled, session may be null.
      if (!data.session) return alert('Check your email to confirm your account, then log in.');
      router.push(next);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    router.push(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-96 p-8 bg-zinc-900 rounded-xl border border-zinc-800">
        <h1 className="text-2xl font-bold mb-6">Forge</h1>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6"
        />
        <Button onClick={handleAuth} className="w-full mb-4">
          {isSignup ? 'Sign Up' : 'Log In'}
        </Button>
        <p className="text-center text-zinc-400">
          {isSignup ? 'Already have an account?' : 'No account?'}{' '}
          <button onClick={() => setIsSignup(!isSignup)} className="text-blue-500">
            {isSignup ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}