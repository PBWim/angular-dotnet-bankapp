import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard.component/dashboard.component';
import { DepositComponent } from './components/deposit.component/deposit.component';
import { WithdrawComponent } from './components/withdraw.component/withdraw.component';
import { TransactionHistoryComponent } from './components/transaction-history.component/transaction-history.component';
import { LoginComponent } from './components/login.component/login.component';
import { RegisterComponent } from './components/register.component/register.component';

// Think of canActivate like [Authorize] in .NET — it protects the route. 
// Without a valid token, the user gets redirected to login instead of seeing the page.
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'deposit', component: DepositComponent, canActivate: [authGuard] },
    { path: 'withdraw', component: WithdrawComponent, canActivate: [authGuard] },
    { path: 'transactions', component: TransactionHistoryComponent, canActivate: [authGuard] },
];
