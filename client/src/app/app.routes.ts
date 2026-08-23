import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard.component/dashboard.component';
import { DepositComponent } from './components/deposit.component/deposit.component';
import { WithdrawComponent } from './components/withdraw.component/withdraw.component';
import { TransactionHistoryComponent } from './components/transaction-history.component/transaction-history.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'deposit', component: DepositComponent },
    { path: 'withdraw', component: WithdrawComponent },
    { path: 'transactions', component: TransactionHistoryComponent }
];
