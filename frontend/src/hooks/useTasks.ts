import { useQuery } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { Task, Status, Priority } from '@/types';
import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
// Fetch all tasks
const fetcher = async (): Promise<Task[]> => {
  const response = await taskApi.getAll();
  return response.data.tasks;
};

// Only one query: all tasks
export function useTasks() {
  const { data, error, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetcher,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const tasks = data || [];
  const { user } = useAuthStore();
  // Derive assigned tasks 
  const assignedTasks = useMemo(
    () => tasks.filter(task => task.assignedId === user?.id),
    [tasks, user]
  );

  // Derive created tasks
  const createdTasks = useMemo(
    () => tasks.filter(task => task.creatorId === user?.id),  // ✅ Fixed
    [tasks, user?.id]  
  );

  return {
    tasks,
    assignedTasks,
    createdTasks,
    isLoading,
    isError: !!error,
  };
}

// Filters tasks (pure function)
export function useFilteredTasks(
  tasks: Task[],
  filters: {
    status?: Status | 'all';
    priority?: Priority | 'all';
    sortOrder: 'asc' | 'desc';
  }
) {
  return useMemo(() => {
    let filtered = [...tasks];

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Filter by priority
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Sort by due date
    filtered.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [tasks, filters]);
}

// Overdue tasks (pure function)
export function useOverdueTasks(tasks: Task[]) {
  const now = new Date();
  return useMemo(
    () => tasks.filter(task => new Date(task.dueDate) < now && task.status !== 'Completed'),
    [tasks]
  );
}
