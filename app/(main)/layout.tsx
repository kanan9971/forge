'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, BookOpen, Dumbbell, Target, CheckSquare, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@supabase/supabase-js';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Courses', href: '/courses' },
  { icon: Dumbbell, label: 'Gym', href: '/gym' },
  { icon: Target, label: 'Habits', href: '/habits' },
  { icon: CheckSquare, label: 'Todos', href: '/todos' },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            ⚡
          </div>
          <h1 className="text-2xl font-bold">Forge</h1>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="border-t border-zinc-800 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-4 py-2">
            <Avatar>
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user?.email}</p>
              <p className="text-xs text-zinc-500">Pro User</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}