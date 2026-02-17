'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Trash, Edit3, X, Check, GraduationCap } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Course = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  progress: number;
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', progress: 0 });

  async function fetchCourses(userId: string) {
    const { data } = await supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setCourses(((data ?? []) as Course[]) || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchCourses(data.user.id);
    });
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', progress: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const addCourse = async () => {
    if (!user || !form.name.trim()) return;
    await supabase.from('courses').insert({
      user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      progress: form.progress,
    });
    fetchCourses(user.id);
    resetForm();
  };

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setForm({
      name: course.name,
      description: course.description || '',
      progress: course.progress ?? 0,
    });
  };

  const saveEdit = async () => {
    if (!user || !editingId || !form.name.trim()) return;
    await supabase.from('courses').update({
      name: form.name.trim(),
      description: form.description.trim() || null,
      progress: form.progress,
    }).eq('id', editingId);
    fetchCourses(user.id);
    resetForm();
  };

  const updateProgress = async (courseId: string, newProgress: number) => {
    if (!user) return;
    await supabase.from('courses').update({ progress: newProgress }).eq('id', courseId);
    fetchCourses(user.id);
  };

  const deleteCourse = async (id: string) => {
    if (!user) return;
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses(user.id);
  };

  const completedCount = courses.filter((c) => c.progress >= 100).length;
  const avgProgress = courses.length > 0 ? Math.round(courses.reduce((s, c) => s + (c.progress ?? 0), 0) / courses.length) : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" /> Courses
          </h1>
          <p className="text-zinc-400 mt-1">Track your learning journey</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{courses.length}</p>
            <p className="text-xs text-zinc-400 mt-1">Total Courses</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{completedCount}</p>
            <p className="text-xs text-zinc-400 mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-400">{avgProgress}%</p>
            <p className="text-xs text-zinc-400 mt-1">Avg Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Form */}
      {(showForm || editingId) && (
        <Card className="mb-8 bg-zinc-900 border-zinc-800 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingId ? 'Edit Course' : 'Add New Course'}
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Course Name</Label>
              <Input
                placeholder="e.g. Machine Learning Specialization"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                placeholder="e.g. Coursera - Andrew Ng"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Progress: {form.progress}%</Label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) })}
                className="w-full mt-2 accent-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={editingId ? saveEdit : addCourse} className="gap-2">
                <Check className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Add Course'}
              </Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course List */}
      {courses.length === 0 && !showForm ? (
        <Card className="bg-zinc-900 border-zinc-800 border-dashed">
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No courses yet</p>
            <p className="text-zinc-500 text-sm mt-1">Add your first course to start tracking progress</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className={`bg-zinc-900 border-zinc-800 transition-all hover:border-zinc-700 ${course.progress >= 100 ? 'border-emerald-500/30' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{course.name}</h3>
                      {course.progress >= 100 && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Completed
                        </Badge>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-zinc-400 text-sm mt-1">{course.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(course)}>
                      <Edit3 className="w-4 h-4 text-zinc-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCourse(course.id)}>
                      <Trash className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                    </Button>
                  </div>
                </div>

                {/* Progress section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Progress</span>
                    <span className={`font-medium ${course.progress >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {course.progress ?? 0}%
                    </span>
                  </div>
                  <Progress value={course.progress ?? 0} className="h-2" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={course.progress ?? 0}
                    onChange={(e) => updateProgress(course.id, parseInt(e.target.value))}
                    className="w-full accent-blue-500 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
