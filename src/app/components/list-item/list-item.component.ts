import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TodoService } from '../../services/todo.service';
import { TodoList, Task } from '../../models/todo.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent implements OnInit {
  @Input() list!: TodoList;

  tasks$!: Observable<Task[]>;
  newTaskText = new FormControl('', [Validators.required]);
  isLoading = false;

  constructor(
    private todoService: TodoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.list) {
      this.tasks$ = this.todoService.getTasksForList(this.list.id);
    }
  }

  addTask(): void {
    if (this.newTaskText.invalid) {
      return;
    }

    const text = this.newTaskText.value?.trim();
    if (!text) {
      return;
    }

    this.isLoading = true;
    this.todoService.createTask(text, this.list.id).subscribe({
      next: () => {
        this.newTaskText.reset();
        this.isLoading = false;
        this.snackBar.open('Task added successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error adding task:', error);
        this.isLoading = false;
        this.snackBar.open('Error adding task', 'Close', {
          duration: 3000
        });
      }
    });
  }

  deleteList(): void {
     // Set loading state to prevent multiple clicks
    this.isLoading = true;
    this.todoService.deleteList(this.list).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('List deleted successfully', 'Close', {
          duration: 3000
        });

        // Force reload of lists to ensure UI is updated
        this.todoService.loadLists();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting list:', error);
        this.snackBar.open('Error deleting list', 'Close', {
          duration: 3000
        });
      }
    });
  }

  toggleTaskCompletion(taskId: number): void {
    this.todoService.toggleTaskCompletion(taskId).subscribe({
      error: (error) => {
        console.error('Error toggling task completion:', error);
        this.snackBar.open('Error updating task', 'Close', {
          duration: 3000
        });
      }
    });
  }

  deleteTask(taskId: string): void {
    // Set loading state to prevent multiple clicks
    this.isLoading = true;

    this.todoService.deleteTask(taskId).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Task deleted successfully', 'Close', {
          duration: 3000
        });

        // Refresh tasks list to ensure UI is updated
        this.tasks$ = this.todoService.getTasksForList(this.list.id);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting task:', error);
        this.snackBar.open('Error deleting task', 'Close', {
          duration: 3000
        });
      }
    });
  }
}
