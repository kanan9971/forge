'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Trash } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null; // date column comes back as YYYY-MM-DD
  priority: string;
  category: string;
  completed: boolean;
};

export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    due_date: new Date(),
    priority: 'medium',
    category: 'general',
  });

  async function fetchTodos(userId: string) {
    const { data } = await supabase.from('todos').select('*').eq('user_id', userId).order('due_date');
    setTodos(((data ?? []) as Todo[]) || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchTodos(data.user.id);
    });
  }, []);

  const addTodo = async () => {
    if (!user) return;
    if (!newTodo.title) return;
    await supabase.from('todos').insert({
      ...newTodo,
      user_id: user.id,
      due_date: format(newTodo.due_date, 'yyyy-MM-dd'),
    });
    fetchTodos(user.id);
    setNewTodo({ title: '', description: '', due_date: new Date(), priority: 'medium', category: 'general' });
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    if (!user) return;
    await supabase.from('todos').update({ completed: !completed }).eq('id', id);
    fetchTodos(user.id);
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    await supabase.from('todos').delete().eq('id', id);
    fetchTodos(user.id);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Todos</h1>
      </div>

      {/* Add New Todo Form */}
      <Card className="mb-8 bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Add New Todo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={newTodo.title} onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={newTodo.description} onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })} />
          </div>
          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newTodo.due_date ? format(newTodo.due_date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newTodo.due_date}
                  onSelect={(date) => setNewTodo({ ...newTodo, due_date: date || new Date() })}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={newTodo.priority} onValueChange={(value) => setNewTodo({ ...newTodo, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={newTodo.category} onValueChange={(value) => setNewTodo({ ...newTodo, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="gym">Gym</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addTodo}>Add Todo</Button>
        </CardContent>
      </Card>

      {/* List Todos */}
      <div className="grid gap-6">
        {todos.map((todo) => (
          <Card key={todo.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Checkbox checked={todo.completed} onCheckedChange={() => toggleComplete(todo.id, todo.completed)} />
                {todo.title}
              </CardTitle>
              <Button variant="destructive" size="icon" onClick={() => deleteTodo(todo.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">{todo.description}</p>
              <p className="text-zinc-500">
                Due: {todo.due_date ? format(parseISO(todo.due_date), 'PPP') : '—'} • Priority: {todo.priority} • Category: {todo.category}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}