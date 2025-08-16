import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AirtableService } from './airtable.service';
import { BudgetItem, MonthData } from '../models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly BUDGET_TABLE = 'budget';

  private budgetItemsSubject = new BehaviorSubject<BudgetItem[]>([]);
  private balanceSubject = new BehaviorSubject<number>(0);
  private currentMonthSubject = new BehaviorSubject<MonthData>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    name: new Date().toLocaleString('ru-RU', { month: 'long' })
  });

  budgetItems$ = this.budgetItemsSubject.asObservable();
  balance$ = this.balanceSubject.asObservable();
  currentMonth$ = this.currentMonthSubject.asObservable();

  constructor(private airtableService: AirtableService) {
    this.loadBudgetItems();
  }

  // Load all budget items
  loadBudgetItems(): void {
    this.airtableService.getRecords<any>(this.BUDGET_TABLE)
      .pipe(
        map(items => items.map(item => ({
          id: item.id,
          name: item.name,
          amount: item.amount,
          date: item.date
        } as BudgetItem))),
        map(items => items.sort((a, b) => a.id - b.id)), // Sort items by ID
        tap(items => {
          this.budgetItemsSubject.next(items);
          this.calculateBalance(items);
        })
      )
      .subscribe({
        next: () => {},
        error: (error) => console.error('Error loading budget items:', error)
      });
  }

  // Calculate the total balance
  private calculateBalance(items: BudgetItem[]): void {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    this.balanceSubject.next(total);
  }

  // Get items for the current month
  getItemsForCurrentMonth(): Observable<BudgetItem[]> {
    const currentMonth = this.currentMonthSubject.value;
    return this.budgetItems$.pipe(
      map(items => items.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth.month && 
               itemDate.getFullYear() === currentMonth.year;
      })),
      map(items => items.sort((a, b) => a.id - b.id)) // Sort items by ID
    );
  }

  // Get income items (positive amounts) for the current month
  getIncomeItems(): Observable<BudgetItem[]> {
    return this.getItemsForCurrentMonth().pipe(
      map(items => items.filter(item => item.amount > 0))
    );
  }

  // Get expense items (negative amounts) for the current month
  getExpenseItems(): Observable<BudgetItem[]> {
    return this.getItemsForCurrentMonth().pipe(
      map(items => items.filter(item => item.amount < 0))
    );
  }

  // Navigate to the next month
  nextMonth(): void {
    const current = this.currentMonthSubject.value;
    let newMonth = current.month + 1;
    let newYear = current.year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    const date = new Date(newYear, newMonth);
    this.currentMonthSubject.next({
      month: newMonth,
      year: newYear,
      name: date.toLocaleString('ru-RU', { month: 'long' })
    });

    // Reload budget items to ensure we have data for the new month
    this.loadBudgetItems();
  }

  // Navigate to the previous month
  previousMonth(): void {
    const current = this.currentMonthSubject.value;
    let newMonth = current.month - 1;
    let newYear = current.year;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    const date = new Date(newYear, newMonth);
    this.currentMonthSubject.next({
      month: newMonth,
      year: newYear,
      name: date.toLocaleString('ru-RU', { month: 'long' })
    });

    // Reload budget items to ensure we have data for the previous month
    this.loadBudgetItems();
  }

  // Create a new budget item
  createBudgetItem(name: string, amount: number): Observable<BudgetItem> {
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    return this.airtableService.createRecord<any>(this.BUDGET_TABLE, { 
      name, 
      amount,
      date
    }).pipe(
      map(response => ({
        id_table: response.id_table,
        id: response.id,
        name: response.name,
        amount: response.amount,
        date: response.date
      } as BudgetItem)),
      tap(newItem => {
        const currentItems = this.budgetItemsSubject.value;
        // Add the new item and sort by ID
        const updatedItems = [...currentItems, newItem].sort((a, b) => a.id - b.id);
        this.budgetItemsSubject.next(updatedItems);
        this.calculateBalance(updatedItems);
      }),
      catchError(error => {
        console.error('Error creating budget item:', error);
        return of({} as BudgetItem);
      })
    );
  }

  // Delete a budget item
  deleteBudgetItem(itemId: string): Observable<any> {
    return this.airtableService.deleteRecord(this.BUDGET_TABLE, itemId)
      .pipe(
        tap(() => {
          const currentItems = this.budgetItemsSubject.value;
          const updatedItems = currentItems.filter(item => item.id_table !== itemId);
          this.budgetItemsSubject.next(updatedItems);
          this.calculateBalance(updatedItems);
        }),
        catchError(error => {
          console.error('Error deleting budget item:', error);
          return of(null);
        })
      );
  }
}
