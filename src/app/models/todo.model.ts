export interface TodoList {
  id_table: string;
  id: number;
  name: string;
}

export interface Task {
  id_table: string;
  id: number;
  text: string;
  listId: number;
  completed: boolean;
}