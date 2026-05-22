export type Priority = "low" | "medium" | "high";

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
  subtasks?: { total: number; completed: number };
  createdAt: string;
  deletedAt?: string;
}

export type FilterType = "today" | "planned" | "inbox" | "all" | "completed" | "trash";

export type PriorityFilter = "all" | Priority;

export type DueFilter = "all" | "today" | "upcoming" | "none";

export interface Category {
  id: string;
  name: string;
  color: string;
  count: number;
}
