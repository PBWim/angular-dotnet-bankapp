import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://localhost:7160/api';

  constructor(private http: HttpClient) { }

  getBalance(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/balance`);
  }

  deposit(amount: number, description: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/account/deposit`, { amount, description });
  }

  withdraw(amount: number, description: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/account/withdraw`, { amount, description });
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/transaction`);
  }

  register(email: string, password: string, firstName: string, lastName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, { email, password, firstName, lastName });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password });
  }
}