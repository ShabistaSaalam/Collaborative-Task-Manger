import { Priority, Status } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TaskFiltersProps {
  status: Status | 'all';
  priority: Priority | 'all';
  sortOrder: 'asc' | 'desc';
  onStatusChange: (status: Status | 'all') => void;
  onPriorityChange: (priority: Priority | 'all') => void;
  onSortOrderChange: () => void;
}

const statuses: (Status | 'all')[] = ['all', 'ToDo', 'InProgress', 'Review', 'Completed'];
const priorities: (Priority | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Urgent'];

const statusLabels: Record<Status | 'all', string> = {
  all: 'All Status',
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Review: 'Review',
  Completed: 'Completed',
};

const priorityLabels: Record<Priority | 'all', string> = {
  all: 'All Priorities',
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Urgent: 'Urgent',
};

export function TaskFilters({
  status,
  priority,
  sortOrder,
  onStatusChange,
  onPriorityChange,
  onSortOrderChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 md:gap-3">
      {/* Status Filter */}
      <Select value={status} onValueChange={(value: Status | 'all') => onStatusChange(value)}>
        <SelectTrigger className="w-full xs:w-[135px] sm:w-[150px] h-9">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {statusLabels[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={priority} onValueChange={(value: Priority | 'all') => onPriorityChange(value)}>
        <SelectTrigger className="w-full xs:w-[135px] sm:w-[150px] h-9">
          <SelectValue placeholder="Filter by priority" />
        </SelectTrigger>
        <SelectContent>
          {priorities.map((p) => (
            <SelectItem key={p} value={p}>
              {priorityLabels[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSortOrderChange}
        className="flex items-center justify-center gap-1.5 h-9 w-full xs:w-auto xs:flex-1 sm:flex-initial whitespace-nowrap px-3"
      >
        {sortOrder === 'asc' ? (
          <>
            <ArrowUp className="h-4 w-4 flex-shrink-0" />
            <span>Earliest</span>
          </>
        ) : (
          <>
            <ArrowDown className="h-4 w-4 flex-shrink-0" />
            <span>Latest</span>
          </>
        )}
      </Button>
    </div>
  );
}