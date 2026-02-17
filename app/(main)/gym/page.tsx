'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Plus, Trash } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Workout = {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  duration: number;
  notes: string | null;
};

type NewExercise = { name: string; sets: string; reps: string; weight: string };

export default function Gym() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newWorkout, setNewWorkout] = useState({
    date: new Date(),
    duration: '',
    notes: '',
    exercises: [] as NewExercise[],
  });

  async function fetchWorkouts(userId: string) {
    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    setWorkouts(((data ?? []) as Workout[]) || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchWorkouts(data.user.id);
    });
  }, []);

  const addExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [...newWorkout.exercises, { name: '', sets: '', reps: '', weight: '' }],
    });
  };

  const updateExercise = (index: number, field: string, value: string) => {
    const updated = [...newWorkout.exercises];
    updated[index][field as keyof typeof updated[0]] = value;
    setNewWorkout({ ...newWorkout, exercises: updated });
  };

  const removeExercise = (index: number) => {
    const updated = newWorkout.exercises.filter((_, i) => i !== index);
    setNewWorkout({ ...newWorkout, exercises: updated });
  };

  const saveWorkout = async () => {
    if (!user) return;
    if (!newWorkout.date || !newWorkout.duration) return alert('Date and duration required');

    const { data: workoutData, error: workoutError } = await supabase.from('workouts').insert({
      user_id: user.id,
      date: format(newWorkout.date, 'yyyy-MM-dd'),
      duration: parseInt(newWorkout.duration),
      notes: newWorkout.notes,
    }).select();

    if (workoutError) return alert(workoutError.message);

    const workoutId = workoutData[0].id;
    for (const ex of newWorkout.exercises) {
      await supabase.from('workout_exercises').insert({
        user_id: user.id,
        workout_id: workoutId,
        name: ex.name,
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        weight: parseFloat(ex.weight),
      });
    }

    fetchWorkouts(user.id);
    setNewWorkout({ date: new Date(), duration: '', notes: '', exercises: [] });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Gym Workouts</h1>
      </div>

      {/* Add New Workout Form */}
      <Card className="mb-8 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Log New Workout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newWorkout.date ? format(newWorkout.date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newWorkout.date}
                  onSelect={(date) => setNewWorkout({ ...newWorkout, date: date || new Date() })}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={newWorkout.duration}
              onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={newWorkout.notes}
              onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
            />
          </div>
          <div>
            <Label>Exercises</Label>
            {newWorkout.exercises.map((ex, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input placeholder="Name" value={ex.name} onChange={(e) => updateExercise(index, 'name', e.target.value)} />
                <Input placeholder="Sets" type="number" value={ex.sets} onChange={(e) => updateExercise(index, 'sets', e.target.value)} />
                <Input placeholder="Reps" type="number" value={ex.reps} onChange={(e) => updateExercise(index, 'reps', e.target.value)} />
                <Input placeholder="Weight" type="number" value={ex.weight} onChange={(e) => updateExercise(index, 'weight', e.target.value)} />
                <Button variant="destructive" size="icon" onClick={() => removeExercise(index)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addExercise} className="mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Exercise
            </Button>
          </div>
          <Button onClick={saveWorkout}>Save Workout</Button>
        </CardContent>
      </Card>

      {/* List Past Workouts */}
      <div className="grid gap-6">
        {workouts.map((workout) => (
          <Card key={workout.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>
                {workout.date ? format(parseISO(workout.date), 'PPP') : '—'} - {workout.duration} min
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">{workout.notes}</p>
              {/* Fetch and display exercises if needed */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}