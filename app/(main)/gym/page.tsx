'use client';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, differenceInCalendarDays, isAfter, startOfDay } from 'date-fns';
import {
  CalendarIcon, Plus, Trash, Dumbbell, Flame, Trophy, Star,
  Zap, Crown, ChevronDown, ChevronUp, Timer, Weight,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Workout = {
  id: string;
  user_id: string;
  date: string;
  duration: number;
  notes: string | null;
};

type WorkoutExercise = {
  id: string;
  workout_id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

type NewExercise = { name: string; sets: string; reps: string; weight: string };

const LEVELS = [
  { name: 'Beginner', icon: Star, color: 'text-zinc-400', bg: 'bg-zinc-400/10', min: 0 },
  { name: 'Rising Star', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10', min: 500 },
  { name: 'Warrior', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10', min: 1500 },
  { name: 'Champion', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10', min: 3000 },
  { name: 'Legend', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-400/10', min: 5000 },
];

const ACHIEVEMENTS = [
  { id: 'first_workout', name: 'First Step', desc: 'Complete your first workout', icon: '🏋️', check: (w: Workout[]) => w.length >= 1 },
  { id: 'five_workouts', name: 'Getting Serious', desc: 'Complete 5 workouts', icon: '💪', check: (w: Workout[]) => w.length >= 5 },
  { id: 'ten_workouts', name: 'Dedicated', desc: 'Complete 10 workouts', icon: '🔥', check: (w: Workout[]) => w.length >= 10 },
  { id: 'twenty_five', name: 'Quarter Century', desc: 'Complete 25 workouts', icon: '⭐', check: (w: Workout[]) => w.length >= 25 },
  { id: 'fifty', name: 'Half Century', desc: 'Complete 50 workouts', icon: '🏆', check: (w: Workout[]) => w.length >= 50 },
  { id: 'hour_session', name: 'Iron Hour', desc: 'Log a 60+ min workout', icon: '⏱️', check: (w: Workout[]) => w.some((x) => x.duration >= 60) },
  { id: 'streak_3', name: 'Hatrick', desc: '3-day workout streak', icon: '🎯', check: (_w: Workout[], streak: number) => streak >= 3 },
  { id: 'streak_7', name: 'Week Warrior', desc: '7-day workout streak', icon: '🗓️', check: (_w: Workout[], streak: number) => streak >= 7 },
];

function getLevel(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.min) level = l;
  }
  return level;
}

function getNextLevel(xp: number) {
  for (const l of LEVELS) {
    if (xp < l.min) return l;
  }
  return null;
}

function computeStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const dates = [...new Set(workouts.map((w) => w.date))].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = differenceInCalendarDays(parseISO(dates[i - 1]), parseISO(dates[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default function Gym() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exerciseMap, setExerciseMap] = useState<Record<string, WorkoutExercise[]>>({});
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
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
    const list = ((data ?? []) as Workout[]) || [];
    setWorkouts(list);

    if (list.length > 0) {
      const ids = list.map((w) => w.id);
      const { data: exData } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', ids);
      const map: Record<string, WorkoutExercise[]> = {};
      for (const ex of (exData ?? []) as WorkoutExercise[]) {
        if (!map[ex.workout_id]) map[ex.workout_id] = [];
        map[ex.workout_id].push(ex);
      }
      setExerciseMap(map);
    }
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
    updated[index] = { ...updated[index], [field]: value };
    setNewWorkout({ ...newWorkout, exercises: updated });
  };

  const removeExercise = (index: number) => {
    setNewWorkout({ ...newWorkout, exercises: newWorkout.exercises.filter((_, i) => i !== index) });
  };

  const saveWorkout = async () => {
    if (!user) return;
    if (!newWorkout.date || !newWorkout.duration) return alert('Date and duration required');

    const { data: workoutData, error: workoutError } = await supabase.from('workouts').insert({
      user_id: user.id,
      date: format(newWorkout.date, 'yyyy-MM-dd'),
      duration: parseInt(newWorkout.duration),
      notes: newWorkout.notes || null,
    }).select();

    if (workoutError) return alert(workoutError.message);

    const workoutId = workoutData[0].id;
    const validExercises = newWorkout.exercises.filter((ex) => ex.name.trim());
    if (validExercises.length > 0) {
      await supabase.from('workout_exercises').insert(
        validExercises.map((ex) => ({
          user_id: user.id,
          workout_id: workoutId,
          name: ex.name,
          sets: parseInt(ex.sets) || 0,
          reps: parseInt(ex.reps) || 0,
          weight: parseFloat(ex.weight) || 0,
        }))
      );
    }

    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);

    fetchWorkouts(user.id);
    setNewWorkout({ date: new Date(), duration: '', notes: '', exercises: [] });
    setShowForm(false);
  };

  const deleteWorkout = async (id: string) => {
    if (!user) return;
    await supabase.from('workout_exercises').delete().eq('workout_id', id);
    await supabase.from('workouts').delete().eq('id', id);
    fetchWorkouts(user.id);
  };

  const xp = useMemo(() => {
    let total = 0;
    for (const w of workouts) {
      total += w.duration * 2;
      total += (exerciseMap[w.id]?.length ?? 0) * 10;
    }
    return total;
  }, [workouts, exerciseMap]);

  const streak = useMemo(() => computeStreak(workouts), [workouts]);
  const level = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpToNext = nextLevel ? nextLevel.min - xp : 0;
  const xpProgress = nextLevel ? ((xp - level.min) / (nextLevel.min - level.min)) * 100 : 100;
  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.check(workouts, streak));
  const lockedAchievements = ACHIEVEMENTS.filter((a) => !a.check(workouts, streak));
  const totalMinutes = workouts.reduce((s, w) => s + w.duration, 0);
  const totalExercises = Object.values(exerciseMap).reduce((s, arr) => s + arr.length, 0);

  const LevelIcon = level.icon;

  return (
    <div className="p-8 max-w-5xl mx-auto relative">
      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">Workout Complete!</h2>
            <p className="text-emerald-400 text-lg font-medium">
              +{parseInt(newWorkout.duration || '0') * 2} XP earned!
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-orange-400 font-medium">{streak + 1} day streak</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-emerald-500" /> Gym
          </h1>
          <p className="text-zinc-400 mt-1">Track workouts and level up</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Log Workout
        </Button>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className={`bg-zinc-900 border-zinc-800 ${level.bg} border-l-2`} style={{ borderLeftColor: level.color.replace('text-', '') }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <LevelIcon className={`w-5 h-5 ${level.color}`} />
              <span className={`text-sm font-medium ${level.color}`}>{level.name}</span>
            </div>
            <p className="text-2xl font-bold">{xp} XP</p>
            {nextLevel && (
              <div className="mt-2">
                <Progress value={xpProgress} className="h-1.5" />
                <p className="text-xs text-zinc-500 mt-1">{xpToNext} XP to {nextLevel.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-zinc-400">Streak</span>
            </div>
            <p className="text-2xl font-bold">{streak} <span className="text-sm font-normal text-zinc-500">days</span></p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-zinc-400">Total Time</span>
            </div>
            <p className="text-2xl font-bold">{totalMinutes} <span className="text-sm font-normal text-zinc-500">min</span></p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-zinc-400">Workouts</span>
            </div>
            <p className="text-2xl font-bold">{workouts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="mb-8 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-5 h-5 text-yellow-400" /> Achievements
            <Badge variant="secondary" className="ml-2">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {unlockedAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-zinc-400">{a.desc}</p>
                </div>
              </div>
            ))}
            {lockedAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 opacity-40">
                <span className="text-2xl grayscale">🔒</span>
                <div>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-zinc-500">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Workout Form */}
      {showForm && (
        <Card className="mb-8 bg-zinc-900 border-zinc-800 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Log New Workout
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <Trash className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="45"
                  value={newWorkout.duration}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Push day, felt strong..."
                value={newWorkout.notes}
                onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
              />
            </div>

            {/* Exercises */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercises</Label>
                <span className="text-xs text-emerald-400">+10 XP each</span>
              </div>
              {newWorkout.exercises.map((ex, index) => (
                <div key={index} className="flex gap-2 mt-2 items-center">
                  <Input placeholder="Exercise name" value={ex.name} onChange={(e) => updateExercise(index, 'name', e.target.value)} className="flex-[2]" />
                  <Input placeholder="Sets" type="number" value={ex.sets} onChange={(e) => updateExercise(index, 'sets', e.target.value)} className="flex-1" />
                  <Input placeholder="Reps" type="number" value={ex.reps} onChange={(e) => updateExercise(index, 'reps', e.target.value)} className="flex-1" />
                  <Input placeholder="Weight" type="number" value={ex.weight} onChange={(e) => updateExercise(index, 'weight', e.target.value)} className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeExercise(index)}>
                    <Trash className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addExercise} className="mt-3 gap-2">
                <Plus className="h-4 w-4" /> Add Exercise
              </Button>
            </div>

            {/* XP Preview */}
            {newWorkout.duration && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">
                  This workout will earn you <strong>{parseInt(newWorkout.duration || '0') * 2 + newWorkout.exercises.filter((e) => e.name.trim()).length * 10} XP</strong>
                </span>
              </div>
            )}

            <Button onClick={saveWorkout} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Dumbbell className="w-4 h-4" /> Complete Workout
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Workout History */}
      <h2 className="text-xl font-semibold mb-4">Workout History</h2>
      {workouts.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 border-dashed">
          <CardContent className="p-12 text-center">
            <Dumbbell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No workouts logged yet</p>
            <p className="text-zinc-500 text-sm mt-1">Log your first workout to start earning XP!</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4" /> Log Workout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => {
            const exercises = exerciseMap[workout.id] || [];
            const workoutXP = workout.duration * 2 + exercises.length * 10;
            const isExpanded = expandedWorkout === workout.id;

            return (
              <Card key={workout.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedWorkout(isExpanded ? null : workout.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {workout.date ? format(parseISO(workout.date), 'EEEE, MMM d') : '—'}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                          <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {workout.duration} min</span>
                          {exercises.length > 0 && (
                            <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> {exercises.length} exercises</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">+{workoutXP} XP</Badge>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-800 pt-4">
                      {workout.notes && <p className="text-zinc-400 text-sm mb-3">{workout.notes}</p>}
                      {exercises.length > 0 ? (
                        <div className="rounded-xl overflow-hidden border border-zinc-800">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-zinc-800/50 text-zinc-400">
                                <th className="text-left p-2 pl-3">Exercise</th>
                                <th className="text-center p-2">Sets</th>
                                <th className="text-center p-2">Reps</th>
                                <th className="text-center p-2 pr-3">Weight</th>
                              </tr>
                            </thead>
                            <tbody>
                              {exercises.map((ex) => (
                                <tr key={ex.id} className="border-t border-zinc-800/50">
                                  <td className="p-2 pl-3 font-medium">{ex.name}</td>
                                  <td className="p-2 text-center text-zinc-400">{ex.sets}</td>
                                  <td className="p-2 text-center text-zinc-400">{ex.reps}</td>
                                  <td className="p-2 text-center text-zinc-400 pr-3">{ex.weight} lbs</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm">No exercises logged</p>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => deleteWorkout(workout.id)}>
                          <Trash className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
