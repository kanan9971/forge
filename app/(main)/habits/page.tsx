'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Habit = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  frequency: string;
};

type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
};

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '✅', frequency: 'daily' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);

  async function fetchHabits(userId: string) {
    const { data } = await supabase.from('habits').select('*').eq('user_id', userId);
    setHabits(((data ?? []) as Habit[]) || []);
  }

  async function fetchLogs(userId: string) {
    // last 30 days
    const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', since);
    setHabitLogs(((data ?? []) as HabitLog[]) || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchHabits(data.user.id);
        fetchLogs(data.user.id);
      }
    });
  }, []);

  const addHabit = async () => {
    if (!user) return;
    if (!newHabit.name) return;
    await supabase.from('habits').insert({ ...newHabit, user_id: user.id });
    fetchHabits(user.id);
    setNewHabit({ name: '', icon: '✅', frequency: 'daily' });
  };

  const toggleLog = async (habitId: string, date: Date) => {
    if (!user) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data: existing } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .eq('date', dateStr)
      .limit(1);

    if (existing?.length) {
      await supabase.from('habit_logs').delete().eq('id', existing[0].id);
    } else {
      await supabase.from('habit_logs').insert({
        user_id: user.id,
        habit_id: habitId,
        date: dateStr,
        completed: true,
      });
    }

    fetchLogs(user.id);
  };

  const logsOnDate = (date: Date) =>
    habitLogs.filter((log) => isSameDay(parseISO(log.date), date));

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Habits</h1>
      </div>

      <Card className="mb-8 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Add New Habit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={newHabit.name} onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })} />
          </div>
          <div>
            <Label>Icon (Emoji)</Label>
            <Input value={newHabit.icon} onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })} />
          </div>
          <div>
            <Label>Frequency</Label>
            <select
              className="mt-2 h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-white"
              value={newHabit.frequency}
              onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <Button onClick={addHabit}>Add Habit</Button>
        </CardContent>
      </Card>

      <Card className="mb-8 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Habit Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && setSelectedDate(d)}
            modifiers={{
              completed: (date) => logsOnDate(date).length > 0,
            }}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {habits.map((habit) => {
          const log = habitLogs.find(
            (l) => l.habit_id === habit.id && isSameDay(parseISO(l.date), selectedDate)
          );
          return (
            <Card key={habit.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {habit.icon} {habit.name} <Badge variant="secondary">{habit.frequency}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => toggleLog(habit.id, selectedDate)}>
                  {log ? <CheckCircle2 className="mr-2" /> : <XCircle className="mr-2" />}
                  {log ? 'Completed' : 'Mark Complete'} for {format(selectedDate, 'PPP')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

