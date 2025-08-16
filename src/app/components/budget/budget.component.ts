import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { BudgetService } from '../../services/budget.service';
import { BudgetItem, MonthData } from '../../models/budget.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-budget',
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.scss']
})
export class BudgetComponent implements OnInit {
  budgetForm: FormGroup;
  balance$: Observable<number>;
  incomeItems$: Observable<BudgetItem[]>;
  expenseItems$: Observable<BudgetItem[]>;
  currentMonth$: Observable<MonthData>;
  isLoading = false;

  constructor(
    private budgetService: BudgetService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.budgetForm = this.fb.group({
      name: ['', Validators.required],
      amount: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]]
    });

    this.balance$ = this.budgetService.balance$;
    this.incomeItems$ = this.budgetService.getIncomeItems();
    this.expenseItems$ = this.budgetService.getExpenseItems();
    this.currentMonth$ = this.budgetService.currentMonth$;
  }

  ngOnInit(): void {
    if (this.balance$ == null) {
      this.budgetService.loadBudgetItems();
    }
    // Budget items are loaded in the service constructor
  }

  addBudgetItem(): void {
    if (this.budgetForm.invalid) {
      return;
    }

    const { name, amount } = this.budgetForm.value;
    const parsedAmount = parseFloat(amount);

    this.isLoading = true;
    this.budgetService.createBudgetItem(name, parsedAmount).subscribe({
      next: () => {
        this.budgetForm.reset();
        this.isLoading = false;
        this.snackBar.open('Item added successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error adding budget item:', error);
        this.isLoading = false;
        this.snackBar.open('Error adding item', 'Close', {
          duration: 3000
        });
      }
    });
  }

  deleteBudgetItem(itemId: string): void {
    // Set loading state to prevent multiple clicks
    this.isLoading = true;

    this.budgetService.deleteBudgetItem(itemId).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Item deleted successfully', 'Close', {
          duration: 3000
        });

        // Reload budget items to ensure UI is updated
        this.budgetService.loadBudgetItems();

        // Refresh the income and expense item lists
        this.incomeItems$ = this.budgetService.getIncomeItems();
        this.expenseItems$ = this.budgetService.getExpenseItems();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting budget item:', error);
        this.snackBar.open('Error deleting item', 'Close', {
          duration: 3000
        });
      }
    });
  }

  nextMonth(): void {
    this.isLoading = true;
    this.budgetService.nextMonth();

    // Refresh the income and expense item lists
    this.incomeItems$ = this.budgetService.getIncomeItems();
    this.expenseItems$ = this.budgetService.getExpenseItems();

    // Reset loading state after a short delay to allow data to load
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  previousMonth(): void {
    this.isLoading = true;
    this.budgetService.previousMonth();

    // Refresh the income and expense item lists
    this.incomeItems$ = this.budgetService.getIncomeItems();
    this.expenseItems$ = this.budgetService.getExpenseItems();

    // Reset loading state after a short delay to allow data to load
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }
}
