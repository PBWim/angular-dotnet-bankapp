import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { BankService } from './bank.service';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private tokenKey = 'bankapp_token';
  private userKey = 'bankapp_user';

  // BehaviorSubject for isLoggedIn$ and currentUser$ — components subscribe to these
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  private currentUser = new BehaviorSubject<any>(this.getStoredUser());
  currentUser$ = this.currentUser.asObservable();

  constructor(private apiService: ApiService, private router: Router,
              private bankService: BankService) {}

  register(email: string, password: string, firstName: string, lastName: string): void {
    this.apiService.register(email, password, firstName, lastName).subscribe({
      next: (response) => {
        this.setSession(response);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Registration failed:', err);
      }
    });
  }

  login(email: string, password: string): void {
    this.apiService.login(email, password).subscribe({
      next: (response) => {
        this.setSession(response);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login failed:', err);
      }
    });
  }

  // clears everything and navigates to login
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.loggedIn.next(false);
    this.currentUser.next(null);
    this.bankService.clear();  // <-- Reset data
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private getStoredUser(): any {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // localStorage to persist the token and user info across page refreshes
  // stores the token and updates the BehaviorSubjects
  private setSession(response: any): void {
    // When you refresh the page or close and reopen the browser, all JavaScript variables are wiped — the app restarts from scratch. 
    // But localStorage persists across page refreshes and browser restarts. So the user stays logged in even after refreshing.
    // Without localStorage, the user would have to log in again every time they refresh the page.
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify({
      email: response.email,
      firstName: response.firstName
    }));
    this.loggedIn.next(true);
    this.currentUser.next({ email: response.email, firstName: response.firstName });
     this.bankService.refresh();  // <-- Load the new user's data
  }
}