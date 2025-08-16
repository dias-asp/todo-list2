import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { TodoService } from '../../services/todo.service';
import { TodoList } from '../../models/todo.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent implements OnInit {
  lists$: Observable<TodoList[]>;
  newListName = new FormControl('', [Validators.required]);
  isLoading = false;

  constructor(
    private todoService: TodoService,
    private snackBar: MatSnackBar
  ) {
    this.lists$ = this.todoService.lists$;
  }

  ngOnInit(): void {
    // Lists are loaded in the service constructor
  }

  addList(): void {
    if (this.newListName.invalid) {
      return;
    }

    const name = this.newListName.value?.trim();
    if (!name) {
      return;
    }

    this.isLoading = true;
    this.todoService.createList(name).subscribe({
      next: () => {
        this.newListName.reset();
        this.isLoading = false;
        this.snackBar.open('List created successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error creating list:', error);
        this.isLoading = false;
        this.snackBar.open('Error creating list', 'Close', {
          duration: 3000
        });
      }
    });
  }
}