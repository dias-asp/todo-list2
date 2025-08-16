export interface BudgetItem {
  id_table: string;
  id: number;
  name: string;
  amount: number;
  date: string;
}

export interface MonthData {
  month: number;
  year: number;
  name: string;
}