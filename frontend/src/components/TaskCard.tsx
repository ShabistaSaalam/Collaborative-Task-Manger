import { useState } from 'react';
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
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
}

/* -------------------- UI MAPPINGS -------------------- */
const priorityColors = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-primary/10 text-primary border-primary/20',
  High: 'bg-warning/10 text-warning border-warning/20',
  Urgent: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusColors = {
  ToDo: 'bg-muted text-muted-foreground',
  InProgress: 'bg-primary/10 text-primary border-primary/20',
  Review: 'bg-warning/10 text-warning border-warning/20',
  Completed: 'bg-success/10 text-success border-success/20',
};

const statusLabels = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Review: 'Review',
  Completed: 'Completed',
};

/* -------------------- COMPONENT -------------------- */
export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dueDate = new Date(task.dueDate);
  const isOverdue = isPast(dueDate) && task.status !== 'Completed';
  const isDueToday = isToday(dueDate);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error is handled by parent component
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'group transition-all duration-200 hover:shadow-medium animate-fade-in',
          isOverdue && 'border-destructive/50 bg-destructive/5'
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {task.title}
            </h3>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
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
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className={statusColors[task.status]}>
              {statusLabels[task.status]}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div
              className={cn(
                'flex items-center gap-2',
                isOverdue
                  ? 'text-destructive'
                  : isDueToday
                  ? 'text-warning'
                  : 'text-muted-foreground'
              )}
            >
              {isOverdue ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              <span>
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today: ' : ''}
                {format(dueDate, 'MMM d, yyyy h:mm a')}
              </span>
            </div>

            {task.assignedTo && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Assigned to: {task.assignedTo.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* -------------------- DELETE DIALOG -------------------- */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}