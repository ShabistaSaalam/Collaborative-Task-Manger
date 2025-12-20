import { useState, useEffect, useMemo } from 'react';
import { useTasks, useAssignedTasks, useCreatedTasks, useFilteredTasks, useOverdueTasks } from '@/hooks/useTasks';
import { useAuthStore } from '@/store/authStore';
import { initializeSocket, disconnectSocket } from '@/lib/socket';
import { useMutations } from '@/hooks/useMutations';
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
  const { tasks: allTasks, isLoading: allLoading, isError: allError } = useTasks();
  const { tasks: assignedTasks, isLoading: assignedLoading } = useAssignedTasks();
  const { tasks: createdTasks, isLoading: createdLoading } = useCreatedTasks();

  // ✅ USE CENTRALIZED MUTATIONS
  const { createTask, updateTask, deleteTask } = useMutations();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered tasks based on active tab
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

  const filteredTasks = useFilteredTasks(currentTasks, {
    status: statusFilter,
    priority: priorityFilter,
    sortOrder,
  });

  // ✅ IMPROVED: Socket.io connection - No manual invalidation needed
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = initializeSocket(user.id);

    // ✅ Mutations already handle invalidation, so we just log events
    socket.on('task:created', () => {
      console.log('📝 Task created event received');
    });

    socket.on('task:updated', () => {
      console.log('✏️ Task updated event received');
    });

    socket.on('task:deleted', () => {
      console.log('🗑️ Task deleted event received');
    });

    socket.on('task:assigned', (task: Task) => {
      console.log('🔔 Task assigned event received:', task);
      toast.info(`New task assigned: ${task.title}`, {
        duration: 5000,
      });
    });

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  // ✅ SIMPLIFIED: Handle create task
  const handleCreateTask = async (data: any) => {
    try {
      const taskData = {
        title: data.title,
        description: data.description || undefined,
        dueDate: new Date(data.dueDate).toISOString(),
        priority: data.priority,
        status: data.status,
        ...(data.assignedToId && { assignedToId: data.assignedToId }),
      };

      await createTask.mutateAsync(taskData);
      toast.success('Task created successfully');
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  // ✅ SIMPLIFIED: Handle update task
  const handleUpdateTask = async (data: any) => {
    if (!editingTask) return;

    try {
      const isStatusOnly = Object.keys(data).length === 1 && 'status' in data;

      const updates = isStatusOnly
        ? { status: data.status }
        : {
            title: data.title,
            description: data.description || undefined,
            dueDate: new Date(data.dueDate).toISOString(),
            priority: data.priority,
            status: data.status,
            ...(data.assignedToId && { assignedToId: data.assignedToId }),
          };

      await updateTask.mutateAsync({ id: editingTask.id, updates });
      toast.success('Task updated successfully');
      setIsFormOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  // ✅ SIMPLIFIED: Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const isLoading = activeTab === 'all' || activeTab === 'overdue'
    ? allLoading
    : activeTab === 'assigned'
      ? assignedLoading
      : createdLoading;

  // ✅ Get loading states from mutations
  const isSubmitting = createTask.isPending || updateTask.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Responsive */}
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
              onClick={() => {
                setEditingTask(null);
                setIsFormOpen(true);
              }}
              title="Create new task"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline ml-1 md:ml-2">Create</span>

              {/* Mobile tooltip */}
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
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
        >
          {/* Tabs + Filters */}
          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6 w-full">
            {/* Tabs - Horizontal scroll on mobile */}
            <div className="w-full overflow-x-auto scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
              <TabsList className="inline-flex h-auto p-1 bg-muted min-w-full md:min-w-0 md:w-auto">
                <TabsTrigger
                  value="all"
                  className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0"
                >
                  <ClipboardList className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>All</span>
                  <span className="rounded-full bg-background px-1 md:px-1.5 py-0.5 text-[10px]">
                    {allTasks.length}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="assigned"
                  className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0"
                >
                  <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>Assigned</span>
                  <span className="rounded-full bg-background px-1 md:px-1.5 py-0.5 text-[10px]">
                    {assignedTasks.length}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="created"
                  className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0"
                >
                  <Plus className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>Created</span>
                  <span className="rounded-full bg-background px-1 md:px-1.5 py-0.5 text-[10px]">
                    {createdTasks.length}
                  </span>
                </TabsTrigger>

                <TabsTrigger
                  value="overdue"
                  className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 md:py-2 text-[11px] md:text-xs whitespace-nowrap flex-shrink-0"
                >
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
            <div className="w-full">
              <TaskFilters
                status={statusFilter}
                priority={priorityFilter}
                sortOrder={sortOrder}
                onStatusChange={setStatusFilter}
                onPriorityChange={setPriorityFilter}
                onSortOrderChange={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
              />
            </div>
          </div>

          {/* Task Lists */}
          {(["all", "assigned", "created", "overdue"] as TabType[]).map((tab) => (
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
                    tab === "overdue"
                      ? "No overdue tasks"
                      : currentTasks.length === 0
                        ? "No tasks yet"
                        : "No matching tasks"
                  }
                  description={
                    tab === "overdue"
                      ? "Great job! You don't have any overdue tasks."
                      : currentTasks.length === 0
                        ? "Create your first task to get started."
                        : "Try adjusting your filters."
                  }
                  actionLabel={
                    currentTasks.length === 0 && tab !== "overdue"
                      ? "Create Task"
                      : undefined
                  }
                  onAction={
                    currentTasks.length === 0 && tab !== "overdue"
                      ? () => {
                          setEditingTask(null);
                          setIsFormOpen(true);
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="grid gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
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