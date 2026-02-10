import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Task, Priority, Status } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'] as const),
  status: z.enum(['ToDo', 'InProgress', 'Review', 'Completed'] as const),
  assignedToId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSubmit: (data: TaskFormData) => Promise<void>;
  isSubmitting: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const priorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
const statuses: Status[] = ['ToDo', 'InProgress', 'Review', 'Completed'];
const statusLabels = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Review: 'Review',
  Completed: 'Completed',
};

export function TaskForm({ open, onOpenChange, task, onSubmit, isSubmitting }: TaskFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { user } = useAuthStore();

  // Check if current user is the creator or assignee
  const isCreator = task?.creatorId === user?.id;
  const isAssignee = task?.assignedToId === user?.id;
  const isTaskAssigned = task?.assignedToId !== null && task?.assignedToId !== undefined && task?.assignedToId !== '';
  const canOnlyEditStatus = task && isAssignee && !isCreator; // Assignee can only edit status

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: 'Medium',
      status: 'ToDo',
      assignedToId: '',
    },
  });

  // Fetch users when dialog opens (only if task is not assigned yet)
  useEffect(() => {
    if (open && !isTaskAssigned) {
      fetchUsers();
    }
  }, [open, isTaskAssigned]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await userApi.getAllUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate.slice(0, 16), // Format for datetime-local input
        priority: task.priority,
        status: task.status,
        assignedToId: task.assignedToId || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        status: 'ToDo',
        assignedToId: '',
      });
    }
  }, [task, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    // If user can only edit status, send only status in the update
    if (canOnlyEditStatus) {
      // Send only status field to backend
      await onSubmit({ status: data.status } as any);
    } else {
      await onSubmit(data);
    }
    reset();
  };

  const priority = watch('priority');
  const status = watch('status');
  const assignedToId = watch('assignedToId');

  // Get assigned user name for display
  const assignedUser = task?.assignedTo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-1 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {task ? (canOnlyEditStatus ? 'Update Task Status' : 'Edit Task') : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        {/* Info Alert for Assignees */}
        {canOnlyEditStatus && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-gray-800">
              As an assignee, you can only update the task status. Other fields are read-only.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title..."
              {...register('title')}
              readOnly={canOnlyEditStatus}
              className={`${errors.title ? 'border-destructive' : ''} ${canOnlyEditStatus ? 'bg-gray-200 cursor-not-allowed' : ''}`}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description..."
              rows={3}
              {...register('description')}
              readOnly={canOnlyEditStatus}
              className={canOnlyEditStatus ? 'bg-gray-200 cursor-not-allowed' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate')}
              readOnly={canOnlyEditStatus}
              className={`${errors.dueDate ? 'border-destructive' : ''} ${canOnlyEditStatus ? 'bg-gray-200 cursor-not-allowed' : ''}`}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              {canOnlyEditStatus ? (
                <Input
                  value={priority}
                  readOnly
                  className="bg-gray-200 cursor-not-allowed"
                />
              ) : (
                <Select
                  value={priority}
                  onValueChange={(value: Priority) => setValue('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={status}
                onValueChange={(value: Status) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            {isTaskAssigned ? (
              <Input
                value={assignedUser ? `${assignedUser.name} (${assignedUser.email})` : 'Assigned'}
                readOnly
                className="bg-gray-200 cursor-not-allowed"
              />
            ) : (
              <Select
                value={assignedToId || 'unassigned'}
                onValueChange={(value) => setValue('assignedToId', value === 'unassigned' ? '' : value)}
                disabled={loadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}