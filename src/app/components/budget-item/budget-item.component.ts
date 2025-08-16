import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BudgetItem } from '../../models/budget.model';

@Component({
  selector: 'app-budget-item',
  templateUrl: './budget-item.component.html',
  styleUrls: ['./budget-item.component.scss']
})
export class BudgetItemComponent {
  @Input() item!: BudgetItem;
  @Output() delete = new EventEmitter<number>();

  get isIncome(): boolean {
    return this.item && this.item.amount > 0;
  }

  onDelete(): void {
    if (this.item) {
      this.delete.emit(this.item.id);
    }
  }
}