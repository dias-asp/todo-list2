import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { AirtableService } from './airtable.service';
import { TodoList, Task } from '../models/todo.model';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly LISTS_TABLE = 'lists';
  private readonly TASKS_TABLE = 'tasks';

  private listsSubject = new BehaviorSubject<TodoList[]>([]);
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  lists$ = this.listsSubject.asObservable();
  tasks$ = this.tasksSubject.asObservable();

  constructor(private airtableService: AirtableService) {
    this.loadLists();
  }

  // Load all lists and their tasks
  loadLists(): void {
    this.airtableService.getRecords<TodoList>(this.LISTS_TABLE)
      .pipe(
        map(lists => lists.sort((a, b) => a.id - b.id)), // Sort lists by ID
        tap(lists => this.listsSubject.next(lists)),
        switchMap(() => this.airtableService.getRecords<any>(this.TASKS_TABLE)),
        map(tasks => tasks.map(task => ({
            id_table: task.id_table,
          id: task.id,
          text: task.text,
          listId: task.list_id,
          completed: task.Status || false
        } as Task))),
        map(tasks => tasks.sort((a, b) => a.id -b.id)) // Sort tasks by ID
      )
      .subscribe({
        next: (tasks) => this.tasksSubject.next(tasks),
        error: (error) => console.error('Error loading lists and tasks:', error)
      });
  }

  // Get tasks for a specific list
  getTasksForList(listId: number): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.listId === listId)),
      map(tasks => tasks.sort((a, b) => a.id -b.id)) // Sort tasks by ID
    );
  }

  // Create a new list
  createList(name: string): Observable<TodoList> {
    return this.airtableService.createRecord<TodoList>(this.LISTS_TABLE, { name })
      .pipe(
        tap(newList => {
          const currentLists = this.listsSubject.value;
          // Add the new list and sort by ID
          const updatedLists = [...currentLists, newList].sort((a, b) => a.id - b.id);
          this.listsSubject.next(updatedLists);
        })
      );
  }

  // Delete a list and all its tasks
  deleteList(list: TodoList): Observable<any> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.listId === list.id)),
      switchMap(tasksToDelete => {
        if (tasksToDelete.length === 0) {
          // If there are no tasks to delete, proceed directly to deleting the list
          return this.airtableService.deleteRecord(this.LISTS_TABLE, list.id_table);
        }

        // Delete all tasks first
        const deleteRequests = tasksToDelete.map(task => 
          this.airtableService.deleteRecord(this.TASKS_TABLE, task.id_table)
        );

        return forkJoin(deleteRequests).pipe(
          // Then delete the list
          switchMap(() => this.airtableService.deleteRecord(this.LISTS_TABLE, list.id_table)),
          catchError(error => {
            console.error('Error deleting tasks:', error);
            // Even if task deletion fails, try to delete the list
            return this.airtableService.deleteRecord(this.LISTS_TABLE, list.id_table);
          })
        );
      }),
      tap(() => {
        // Update lists
        const currentLists = this.listsSubject.value;
        this.listsSubject.next(currentLists.filter(curList => curList.id !== list.id));

        // Update tasks
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next(currentTasks.filter(task => task.listId !== list.id));
      }),
      catchError(error => {
        console.error('Error deleting list:', error);
        return of(null);
      })
    );
  }

  // Create a new task
  createTask(text: string, listId: number): Observable<Task> {
    return this.airtableService.createRecord<any>(this.TASKS_TABLE, { 
      text, 
      list_id: listId,
      Status: false 
    }).pipe(
      map(response => ({
          id_table: response.id_table,
        id: response.id,
        text: response.text,
        listId: response.list_id,
        completed: response.Status || false
      } as Task)),
      tap(newTask => {
        const currentTasks = this.tasksSubject.value;
        // Add the new task and sort by ID
        const updatedTasks = [...currentTasks, newTask].sort((a, b) => a.id - b.id);
        this.tasksSubject.next(updatedTasks);
      })
    );
  }

  // Toggle task completion status
  toggleTaskCompletion(taskId: number): Observable<Task> {
    const task = this.tasksSubject.value.find(t => t.id === taskId);

    if (!task) {
      return of() as Observable<Task>;
    }

    const updatedStatus = !task.completed;

    return this.airtableService.updateRecord<any>(this.TASKS_TABLE, taskId, { 
      Status: updatedStatus 
    }).pipe(
      map(response => ({
          id_table: response.id_table,
        id: response.id,
        text: response.text,
        listId: response.list_id,
        completed: response.Status
      } as Task)),
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const updatedTasks = currentTasks.map(t => 
          t.id === taskId ? { ...t, completed: updatedStatus } : t
        );
        this.tasksSubject.next(updatedTasks);
      })
    );
  }

  // Delete a task
  deleteTask(taskId: string): Observable<any> {
    return this.airtableService.deleteRecord(this.TASKS_TABLE, taskId)
      .pipe(
        tap(() => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next(currentTasks.filter(task => task.id_table !== taskId));
        })
      );
  }
}
