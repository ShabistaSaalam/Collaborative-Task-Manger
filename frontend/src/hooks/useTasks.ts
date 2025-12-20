import useSWR from 'swr';
import { taskApi } from '@/lib/api';
import { Task, Status, Priority } from '@/types';

const fetcher = async (url: string) => {
  const response = await taskApi.getAll();
  return response.data.tasks;
};

const fetchAssigned = async () => {
  const response = await taskApi.getAssigned();
  return response.data.tasks;
};

const fetchCreated = async () => {
  const response = await taskApi.getCreated();
  return response.data.tasks;
};

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>('/tasks', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    tasks: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAssignedTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    '/tasks/assigned',
    fetchAssigned,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    tasks: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCreatedTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    '/tasks/created',
    fetchCreated,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    tasks: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useFilteredTasks(
  tasks: Task[],
  filters: {
    status?: Status | 'all';
    priority?: Priority | 'all';
    sortOrder: 'asc' | 'desc';
  }
) {
  let filtered = [...tasks];

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((task) => task.status === filters.status);
  }

  // Filter by priority
  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter((task) => task.priority === filters.priority);
  }

  // Sort by due date
  filtered.sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return filtered;
}

export function useOverdueTasks(tasks: Task[]) {
  const now = new Date();
  return tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return dueDate < now && task.status !== 'Completed';
  });
}
