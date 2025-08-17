import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AirtableService {
  private readonly BASE_ID = 'appUfYNiRFYJShBvy';
  private readonly API_TOKEN = 'patjQIbx6o2yZrYKY.36130faa2834465fd93912bdb1df8a7d609d2769ae224fc1f5ee52ef49d7d248';
  private readonly BASE_URL = `https://api.airtable.com/v0/${this.BASE_ID}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.API_TOKEN}`,
      'Content-Type': 'application/json'
    });
  }
  private getHeadersDelete(): HttpHeaders {
      return new HttpHeaders({
      'Authorization': `Bearer ${this.API_TOKEN}`,
      })
  }

  getRecords<T>(tableName: string): Observable<T[]> {
    return this.http.get(`${this.BASE_URL}/${tableName}`, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          return response.records.map((record: any) => {
            return {
              id_table: record.id,
              ...record.fields
            } as T;
          });
        })
      );
  }

  getRecord<T>(tableName: string, recordId: number): Observable<T> {
    return this.http.get(`${this.BASE_URL}/${tableName}/${recordId}`, { headers: this.getHeaders() })
      .pipe(
        map((record: any) => {
          return {
            id: record.id,
            ...record.fields
          } as T;
        })
      );
  }

  createRecord<T>(tableName: string, fields: any): Observable<T> {
    const data = { fields };
    return this.http.post(`${this.BASE_URL}/${tableName}`, data, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          return {
            id_table: response.id,
            ...response.fields
          } as T;
        })
      );
  }

  updateRecord<T>(tableName: string, recordId: string, fields: any): Observable<T> {
    const data = { fields };
    return this.http.patch(`${this.BASE_URL}/${tableName}/${recordId}`, data, { headers: this.getHeaders() })
      .pipe(
        map((response: any) => {
          return {
            id_table: response.id,
            ...response.fields
          } as T;
        })
      );
  }

  deleteRecord(tableName: string, recordId: string): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/${tableName}/${recordId}`, { headers: this.getHeadersDelete() });
  }
}