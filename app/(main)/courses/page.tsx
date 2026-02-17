'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

type Course = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  progress: number | null;
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);

  async function fetchCourses(userId: string) {
    const { data } = await supabase.from('courses').select('*').eq('user_id', userId);
    setCourses(((data ?? []) as Course[]) || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchCourses(data.user.id);
    });
  }, []);

  const addCourse = async () => {
    if (!user) return;
    const name = prompt('Course name?');
    if (name) {
      await supabase.from('courses').insert({ user_id: user.id, name });
      fetchCourses(user.id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button onClick={addCourse}>+ Add Course</Button>
      </div>
      <div className="grid gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={course.progress ?? 0} className="w-full" />
              {course.description ? <p className="mt-2 text-zinc-400">{course.description}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}