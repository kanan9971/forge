'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, Flame } from 'lucide-react';

type Habit = {
  id: string;
  name: string;
  icon: string;
  frequency: string;
};

export default function Dashboard() {
  const stats = {
    habitStreak: 7,
    todosToday: 3,
    courseProgress: 65,
    gymSessions: 4,
  };

  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: habitsData } = await supabase.from('habits').select('*').limit(5);
      setHabits(((habitsData ?? []) as Habit[]) || []);
    };
    fetchData();
  }, []);

  const weeklyData = [
    { day: 'Mon', habits: 80, todos: 90 },
    { day: 'Tue', habits: 100, todos: 70 },
    // etc.
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold">Good evening, Kanan 👋</h1>
          <p className="text-zinc-400">February 16, 2026 • Let&apos;s keep the streak alive</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.habitStreak}</p>
                <p className="text-xs text-zinc-400">Day streak</p>
              </div>
            </CardContent>
          </Card>
          {/* More stat cards */}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Progress Overview */}
        <Card className="col-span-8 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="habits" fill="#3b82f6" />
                <Bar dataKey="todos" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Habits */}
        <Card className="col-span-4 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" /> Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habits.map((h) => (
              <div key={h.id} className="flex justify-between items-center">
                <span>{h.icon} {h.name}</span>
                <Badge variant="secondary">Tracked</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Courses & Gym & Todos similar cards with Progress bars, lists */}
      </div>

      {/* Add quick buttons at bottom */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-medium flex items-center gap-2 shadow-lg">
          + New Todo
        </button>
        <button className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-medium flex items-center gap-2 shadow-lg">
          Log Workout
        </button>
      </div>
    </div>
  );
}