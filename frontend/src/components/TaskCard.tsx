import { useState, useMemo } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Edit2, Trash2, User, Clock, Loader2 } from 'lucide-react';
import { format, isPast, isToday, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-primary/10 text-primary border-primary/20',
  High: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Urgent: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusColors: Record<string, string> = {
  ToDo: 'bg-muted text-muted-foreground',
  InProgress: 'bg-primary/10 text-primary border-primary/20',
  Review: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Completed: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const statusLabels: Record<string, string> = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Review: 'Review',
  Completed: 'Completed',
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // 🛡️ BLOCK TEMP IDs: Check if the task is still being created
  const isSyncing = task.id.toString().startsWith('temp-');

  const dateObj = useMemo(() => {
    const d = new Date(task.dueDate);
    return isValid(d) ? d : null;
  }, [task.dueDate]);

  const isOverdue = dateObj ? isPast(dateObj) && task.status !== 'Completed' : false;
  const isDueToday = dateObj ? isToday(dateObj) : false;

  const handleDeleteConfirm = () => {
    // This will now only ever fire with a real MongoDB ID
    if (!isSyncing) {
      onDelete(task.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'group relative transition-all duration-200 hover:shadow-md animate-fade-in',
          isOverdue && 'border-destructive/50 bg-destructive/5',
          isSyncing && 'opacity-70 grayscale-[0.5]' // Visual cue it's not "real" yet
        )}
      >
        {/* Loader Overlay for Optimistic Tasks */}
        {isSyncing && (
          <div className="absolute top-2 right-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {task.title}
            </h3>

            <div className={cn(
              "flex gap-1 transition-opacity",
              isSyncing ? "opacity-20 pointer-events-none" : "opacity-0 group-hover:opacity-100"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(task)}
                disabled={isSyncing}
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isSyncing}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("font-medium", priorityColors[task.priority] || 'bg-muted')}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={cn("font-medium", statusColors[task.status] || 'bg-muted')}>
              {/* Added fallback to task.status to prevent blank cards */}
              {statusLabels[task.status] || task.status}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div
              className={cn(
                'flex items-center gap-2',
                isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-orange-600' : 'text-muted-foreground'
              )}
            >
              {isOverdue ? <Clock className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
              <span>
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : ''}
                {dateObj ? format(dateObj, 'MMM d, yyyy h:mm a') : 'No date set'}
              </span>
            </div>

            {task.assignedTo && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="truncate">Assigned: {task.assignedTo.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}