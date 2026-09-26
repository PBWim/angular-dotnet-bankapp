import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// Breaks the circular dependency between AuthService and BankService.
// AuthService can't inject BankService directly because:
//   AuthService → BankService → ApiService → HttpClient → authInterceptor → AuthService
// Instead, AuthService emits events here, and BankService subscribes to them.
@Injectable({ providedIn: 'root' })
export class AuthEventService {
  private loginSubject = new Subject<void>();
  private logoutSubject = new Subject<void>();

  login$ = this.loginSubject.asObservable();
  logout$ = this.logoutSubject.asObservable();

  emitLogin(): void {
    this.loginSubject.next();
  }

  emitLogout(): void {
    this.logoutSubject.next();
  }
}