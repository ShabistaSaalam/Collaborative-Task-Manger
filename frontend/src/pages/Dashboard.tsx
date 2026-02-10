import { useState, useMemo, useEffect } from 'react';
import { useTasks, useFilteredTasks, useOverdueTasks } from '@/hooks/useTasks';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useMutations } from '@/hooks/useMutations';
import { initializeSocket, disconnectSocket } from '@/lib/socket';
import { Task, TabType, Priority, Status } from '@/types';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { TaskFilters } from '@/components/TaskFilters';
import { TaskListSkeleton } from '@/components/TaskSkeleton';
import { UserMenu } from '@/components/UserMenu';
import { EmptyState } from '@/components/EmptyState';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, CheckSquare, ClipboardList, User, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuthStore();
  const {
    tasks: allTasks,
    assignedTasks,
    createdTasks,
    isLoading: allLoading,
    isError: allError,
  } = useTasks();

  const { createTask, updateTask, deleteTask } = useMutations();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const overdueTasks = useOverdueTasks(allTasks);

  const currentTasks = useMemo(() => {
    switch (activeTab) {
      case 'assigned':
        return assignedTasks;
      case 'created':
        return createdTasks;
      case 'overdue':
        return overdueTasks;
      default:
        return allTasks;
    }
  }, [activeTab, allTasks, assignedTasks, createdTasks, overdueTasks]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = initializeSocket(user.id);

    // Inside socket.on('task:created')
    socket.on('task:created', (newTask: Task) => {
      // Use toString() to ensure we aren't comparing string vs objectId
      if (newTask.creatorId.toString() === user.id.toString()) return;

      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) => {
        // Check if it already exists by title/timestamp if ID is still being synced
        if (old?.some(t => t.id === newTask.id)) return old;
        return [newTask, ...(old || [])];
      });
    });

    // ✅ UPDATE: Silent swap
    socket.on('task:updated', (updatedTask: Task) => {
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
        old?.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    });

    // ✅ DELETE: DESTRESS THE OBJECT
    // Fixed: Your backend sends { taskId }, so we destructure it here
    socket.on('task:deleted', ({ taskId }: { taskId: string }) => {
      queryClient.setQueryData(['tasks'], (old: Task[] | undefined) =>
        old?.filter((task) => task.id !== taskId)
      );
    });

    // Inside your useEffect in Dashboard.tsx

    // Inside useEffect in Dashboard.tsx

    socket.on('task:assigned', (task: Task) => {
      // We no longer show a toast here. 
      // We just silently refresh the data so the UI is up to date.
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('notification', () => {
      // Refresh the bell icon / notification list
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // ✅ CLEANUP: Essential for "Real-time" stability
    return () => {
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
      socket.off('task:assigned');
      socket.off('notification');
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, queryClient]);
  const filteredTasks = useFilteredTasks(currentTasks, {
    status: statusFilter,
    priority: priorityFilter,
    sortOrder,
  });
  const handleCreateTask = (data: any) => {
    const newTask = {
      title: data.title,
      description: data.description || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      priority: data.priority,
      status: data.status,
      ...(data.assignedToId && { assignedToId: data.assignedToId }),
    };

    createTask.mutate(newTask, {
      onSuccess: () => {
        toast.success('Task created successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create task');
      },
    });

    // Close immediately - consistent with update behavior
    setIsFormOpen(false);
  };

  const handleUpdateTask = (data: any) => {
    if (!editingTask) return;

    // 1. Show immediate feedback (just like your delete task)
    toast.success('Updating task', {
      description: "Syncing with server...",
      duration: 2000,
    });

    const updates = {
      title: data.title,
      description: data.description || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      priority: data.priority,
      status: data.status,
      ...(data.assignedToId && { assignedToId: data.assignedToId }),
    };

    // 2. Trigger mutation WITHOUT 'await'
    // This relies on your useMutations hook to perform an Optimistic Update
    updateTask.mutate({ id: editingTask.id, updates }, {
      onError: (error: any) => {
        // If it fails, TanStack Query will roll back the UI automatically
        toast.error(error.response?.data?.message || 'Update failed. Reverting changes...');
      }
    });

    // 3. Close the UI immediately
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    toast.success('Task deleted', {
      description: "Syncing with server...",
      duration: 2000,
    });

    // 2. Trigger mutation WITHOUT 'await'
    // Let the Optimistic Update in useMutations handle the list removal
    deleteTask.mutate(taskId, {
      onError: (error: any) => {
        // If it fails, the task will "re-appear" via TanStack Query rollback
        // We notify the user of the reversal here
        toast.error(error.response?.data?.message || 'Delete failed. Task restored.');
      }
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };


  const isLoading = allLoading && allTasks.length === 0;
  const isSubmitting = createTask.isPending || updateTask.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 md:h-16 max-w-screen-2xl items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="h-7 w-7 md:h-8 md:w-8 rounded-lg bg-primary flex items-center justify-center xs:flex hidden">
              <CheckSquare className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            <h1 className="text-sm xs:text-base md:text-xl font-bold text-foreground">
              <span className="xs:hidden">Task Manager</span>
              <span className="hidden xs:inline">Task Manager</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <NotificationCenter />
            <Button
              size="sm"
              className="h-8 md:h-10 relative group"
              onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
              title="Create new task"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline ml-1 md:ml-2">Create</span>
              <span className="xs:hidden absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Create new task
              </span>
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-screen-2xl px-3 md:px-6 py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
          {/* Tabs + Filters */}
          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6 w-full">
            <div className="w-full overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
              <TabsList className="inline-flex h-auto p-1 bg-muted min-w-full md:min-w-0 md:w-auto">
                <TabsTrigger value="all" className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0">
                  <ClipboardList className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>All</span>
                  <span className="rounded-full bg-background px-1 md:px-1.5 py-0.5 text-[10px]">{allTasks.length}</span>
                </TabsTrigger>
                <TabsTrigger value="assigned" className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0">
                  <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>Assigned</span>
                  <span className="rounded-full bg-background px-1 md:px-1.5 py-0.5 text-[10px]">{assignedTasks.length}</span>
                </TabsTrigger>
                <TabsTrigger value="created" className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0">
                  <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>Created</span>
                  <span className="rounded-full bg-background px-1 md:px-1.5 py-0.5 text-[10px]">{createdTasks.length}</span>
                </TabsTrigger>
                <TabsTrigger value="overdue" className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0">
                  <AlertTriangle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>Overdue</span>
                  {overdueTasks.length > 0 && (
                    <span className="rounded-full bg-destructive text-destructive-foreground px-1 md:px-1.5 py-0.5 text-[10px]">
                      {overdueTasks.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Filters */}
            <TaskFilters
              status={statusFilter}
              priority={priorityFilter}
              sortOrder={sortOrder}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onSortOrderChange={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
            />
          </div>

          {/* Task Lists */}
          {(['all', 'assigned', 'created', 'overdue'] as TabType[]).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {isLoading ? (
                <TaskListSkeleton />
              ) : allError ? (
                <EmptyState
                  title="Something went wrong"
                  description="We couldn't load your tasks. Please try again."
                  isError
                  onRetry={() => window.location.reload()}
                />
              ) : filteredTasks.length === 0 ? (
                <EmptyState
                  title={
                    tab === 'overdue'
                      ? 'No overdue tasks'
                      : currentTasks.length === 0
                        ? 'No tasks yet'
                        : 'No matching tasks'
                  }
                  description={
                    tab === 'overdue'
                      ? "Great job! You don't have any overdue tasks."
                      : currentTasks.length === 0
                        ? 'Create your first task to get started.'
                        : 'Try adjusting your filters.'
                  }
                  actionLabel={
                    currentTasks.length === 0 && tab !== 'overdue' ? 'Create Task' : undefined
                  }
                  onAction={
                    currentTasks.length === 0 && tab !== 'overdue'
                      ? () => { setEditingTask(null); setIsFormOpen(true); }
                      : undefined
                  }
                />
              ) : (
                <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredTasks.map(task => (
                    <TaskCard key={task.clientId ?? task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Task Form Modal */}
      <TaskForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
