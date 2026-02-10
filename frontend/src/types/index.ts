export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'ToDo' | 'InProgress' | 'Review' | 'Completed';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  clientId?:string;
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  creatorId: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  creator: User;
  assignedTo?: User;
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  assignedToId?: string;
}

export type TabType = 'assigned' | 'created' | 'all' | 'overdue';
