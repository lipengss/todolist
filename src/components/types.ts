export type Priority = "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  text: string;
  note?: string;
  completed: boolean;
  starred: boolean;
  priority: Priority;
  category: string;
  dueDate?: string;
  dueTime?: string;
  subtasks?: Subtask[];
  createdAt: string;
  completedAt?: string;
  deletedAt?: string;
  recurrence?: Recurrence;
}

export type FilterType = "calendar" | "today" | "planned" | "inbox" | "all" | "completed" | "trash" | "stats";

export type PriorityFilter = "all" | Priority;

export type DueFilter = "all" | "today" | "upcoming" | "none";

export interface Category {
  id: string;
  name: string;
  color: string;
  count: number;
}
