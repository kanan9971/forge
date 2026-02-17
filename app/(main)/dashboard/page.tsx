'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Target, Flame, BookOpen, Dumbbell, CheckSquare, Plus, X,
  Trophy, Zap, Star, Crown, TrendingUp, Calendar as CalendarIcon,
} from 'lucide-react';
import { format, subDays, parseISO, isSameDay, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns';
import type { User } from '@supabase/supabase-js';

type Habit = { id: string; name: string; icon: string; frequency: string };
type HabitLog = { id: string; habit_id: string; date: string; completed: boolean };
type Todo = { id: string; title: string; completed: boolean; priority: string; category: string; due_date: string | null };
type Course = { id: string; name: string; progress: number; description: string | null };
type Workout = { id: string; date: string; duration: number; notes: string | null };

const LEVELS = [
  { name: 'Beginner', icon: Star, color: 'text-zinc-400', min: 0 },
  { name: 'Rising Star', icon: Zap, color: 'text-blue-400', min: 500 },
  { name: 'Warrior', icon: Flame, color: 'text-orange-400', min: 1500 },
  { name: 'Champion', icon: Trophy, color: 'text-yellow-400', min: 3000 },
  { name: 'Legend', icon: Crown, color: 'text-purple-400', min: 5000 },
];

function getLevel(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.min) level = l;
  }
  return level;
}

function computeHabitStreak(logs: HabitLog[]): number {
  if (logs.length === 0) return 0;
  const dates = [...new Set(logs.filter((l) => l.completed).map((l) => l.date))].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i - 1]), parseISO(dates[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showQuickTodo, setShowQuickTodo] = useState(false);
  const [quickTodo, setQuickTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchAllData(data.user.id);
    });
  }, []);

  async function fetchAllData(userId: string) {
    setLoading(true);
    const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const [habitsRes, logsRes, todosRes, coursesRes, workoutsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('habit_logs').select('*').eq('user_id', userId).gte('date', since),
      supabase.from('todos').select('*').eq('user_id', userId).order('due_date'),
      supabase.from('courses').select('*').eq('user_id', userId),
      supabase.from('workouts').select('*').eq('user_id', userId).order('date', { ascending: false }),
    ]);

    setHabits((habitsRes.data ?? []) as Habit[]);
    setHabitLogs((logsRes.data ?? []) as HabitLog[]);
    setTodos((todosRes.data ?? []) as Todo[]);
    setCourses((coursesRes.data ?? []) as Course[]);
    setWorkouts((workoutsRes.data ?? []) as Workout[]);
    setLoading(false);
  }

  const addQuickTodo = async () => {
    if (!user || !quickTodo.trim()) return;
    await supabase.from('todos').insert({
      user_id: user.id,
      title: quickTodo.trim(),
      priority: 'medium',
      category: 'general',
    });
    setQuickTodo('');
    setShowQuickTodo(false);
    fetchAllData(user.id);
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    if (!user) return;
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    fetchAllData(user.id);
  };

  const toggleHabitToday = async (habitId: string) => {
    if (!user) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const existing = habitLogs.find(
      (l) => l.habit_id === habitId && l.date === today
    );
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id);
    } else {
      await supabase.from('habit_logs').insert({
        user_id: user.id,
        habit_id: habitId,
        date: today,
        completed: true,
      });
    }
    fetchAllData(user.id);
  };

  // Computed stats
  const habitStreak = useMemo(() => computeHabitStreak(habitLogs), [habitLogs]);
  const todosToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return todos.filter((t) => !t.completed && t.due_date === today).length;
  }, [todos]);
  const pendingTodos = todos.filter((t) => !t.completed).slice(0, 5);
  const avgCourseProgress = useMemo(() => {
    if (courses.length === 0) return 0;
    return Math.round(courses.reduce((s, c) => s + (c.progress ?? 0), 0) / courses.length);
  }, [courses]);
  const gymSessions = workouts.length;

  // XP calculation
  const totalXP = useMemo(() => {
    let xp = 0;
    xp += workouts.reduce((s, w) => s + w.duration * 2, 0);
    xp += habitLogs.filter((l) => l.completed).length * 10;
    xp += todos.filter((t) => t.completed).length * 15;
    xp += courses.filter((c) => c.progress >= 100).length * 100;
    return xp;
  }, [workouts, habitLogs, todos, courses]);
  const level = getLevel(totalXP);
  const LevelIcon = level.icon;

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const habitCount = habitLogs.filter((l) => l.date === dateStr && l.completed).length;
      const todoCount = todos.filter((t) => t.completed && t.due_date === dateStr).length;
      const workoutCount = workouts.filter((w) => w.date === dateStr).length;
      days.push({
        day: format(date, 'EEE'),
        habits: habitCount,
        todos: todoCount,
        workouts: workoutCount,
      });
    }
    return days;
  }, [habitLogs, todos, workouts]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const habitsCompletedToday = habitLogs.filter((l) => l.date === todayStr && l.completed).length;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-zinc-400">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold">{greeting}, {firstName} 👋</h1>
          <p className="text-zinc-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 flex items-center gap-2">
              <LevelIcon className={`w-5 h-5 ${level.color}`} />
              <div>
                <p className="text-lg font-bold">{totalXP}</p>
                <p className="text-xs text-zinc-400">{level.name}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{habitStreak}</p>
                <p className="text-xs text-zinc-400">Day streak</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-zinc-400">Habits Today</span>
            </div>
            <p className="text-2xl font-bold">{habitsCompletedToday}/{habits.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-zinc-400">Todos Due</span>
            </div>
            <p className="text-2xl font-bold">{todosToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-zinc-400">Course Progress</span>
            </div>
            <p className="text-2xl font-bold">{avgCourseProgress}%</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-zinc-400">Gym Sessions</span>
            </div>
            <p className="text-2xl font-bold">{gymSessions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Weekly Progress Chart */}
        <Card className="col-span-8 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="habits" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Habits" />
                <Bar dataKey="todos" fill="#10b981" radius={[4, 4, 0, 0]} name="Todos" />
                <Bar dataKey="workouts" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Workouts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Habits */}
        <Card className="col-span-4 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-blue-400" /> Today&apos;s Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.length === 0 ? (
              <p className="text-zinc-500 text-sm">No habits yet. <a href="/habits" className="text-blue-400 hover:underline">Add one</a></p>
            ) : (
              habits.map((h) => {
                const isCompleted = habitLogs.some(
                  (l) => l.habit_id === h.id && l.date === todayStr && l.completed
                );
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHabitToday(h.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {h.icon} {h.name}
                    </span>
                    {isCompleted && <span className="text-emerald-400 text-lg">✓</span>}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Pending Todos */}
        <Card className="col-span-6 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" /> Upcoming Todos
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowQuickTodo(!showQuickTodo)}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {showQuickTodo && (
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Quick add a todo..."
                  value={quickTodo}
                  onChange={(e) => setQuickTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQuickTodo()}
                  autoFocus
                />
                <Button onClick={addQuickTodo} size="icon"><Plus className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setShowQuickTodo(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {pendingTodos.length === 0 ? (
              <p className="text-zinc-500 text-sm py-2">All caught up! No pending todos.</p>
            ) : (
              pendingTodos.map((todo) => (
                <button
                  key={todo.id}
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md border border-zinc-600" />
                    <span className="text-sm">{todo.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-xs ${
                      todo.priority === 'high' ? 'text-red-400 border-red-500/30' :
                      todo.priority === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                      'text-zinc-400'
                    }`}>
                      {todo.priority}
                    </Badge>
                  </div>
                </button>
              ))
            )}
            {todos.filter((t) => !t.completed).length > 5 && (
              <a href="/todos" className="text-blue-400 text-sm hover:underline block text-center mt-2">
                View all {todos.filter((t) => !t.completed).length} todos →
              </a>
            )}
          </CardContent>
        </Card>

        {/* Courses Overview */}
        <Card className="col-span-6 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" /> Courses
              </span>
              <a href="/courses">
                <Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button>
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.length === 0 ? (
              <p className="text-zinc-500 text-sm py-2">No courses yet. <a href="/courses" className="text-blue-400 hover:underline">Add one</a></p>
            ) : (
              courses.slice(0, 4).map((course) => (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{course.name}</span>
                    <span className={`text-xs font-medium ${course.progress >= 100 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {course.progress}%
                    </span>
                  </div>
                  <Progress value={course.progress ?? 0} className="h-1.5" />
                </div>
              ))
            )}
            {courses.length > 4 && (
              <a href="/courses" className="text-blue-400 text-sm hover:underline block text-center mt-2">
                View all {courses.length} courses →
              </a>
            )}
          </CardContent>
        </Card>

        {/* Recent Workouts */}
        <Card className="col-span-12 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-400" /> Recent Workouts
              </span>
              <a href="/gym">
                <Button variant="outline" className="gap-2 text-sm h-8">
                  <Plus className="w-3 h-3" /> Log Workout
                </Button>
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <p className="text-zinc-500 text-sm py-2">No workouts logged yet. <a href="/gym" className="text-blue-400 hover:underline">Log one</a></p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {workouts.slice(0, 3).map((w) => (
                  <div key={w.id} className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="w-3 h-3 text-zinc-500" />
                      <span className="text-sm font-medium">
                        {w.date ? format(parseISO(w.date), 'EEE, MMM d') : '—'}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm">{w.duration} min</p>
                    {w.notes && <p className="text-zinc-500 text-xs mt-1 truncate">{w.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div className="fixed bottom-6 right-6 flex gap-3">
        <button
          onClick={() => setShowQuickTodo(true)}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-medium flex items-center gap-2 shadow-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Todo
        </button>
        <a href="/gym">
          <button className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-medium flex items-center gap-2 shadow-lg transition-colors">
            <Dumbbell className="w-4 h-4" /> Log Workout
          </button>
        </a>
      </div>
    </div>
  );
}
