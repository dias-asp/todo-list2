import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { map, expand, reduce } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AirtableService {
  private readonly BASE_ID = environment.airtable.baseId;
  private readonly API_TOKEN = environment.airtable.apiToken;
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
    // Airtable returns at most 100 records per request and provides an `offset`
    // token to fetch the next page. Keep paging until there is no more offset so
    // that all records (e.g. more than 100) are returned.
    return this.fetchPage(tableName).pipe(
      expand((response: any) =>
        response.offset ? this.fetchPage(tableName, response.offset) : EMPTY
      ),
      reduce((acc: T[], response: any) => {
        const mapped = response.records.map((record: any) => ({
          id_table: record.id,
          ...record.fields
        } as T));
        return acc.concat(mapped);
      }, [] as T[])
    );
  }

  private fetchPage(tableName: string, offset?: string): Observable<any> {
    let params = new HttpParams().set('pageSize', '100');
    if (offset) {
      params = params.set('offset', offset);
    }
    return this.http.get(`${this.BASE_URL}/${tableName}`, {
      headers: this.getHeaders(),
      params
    });
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