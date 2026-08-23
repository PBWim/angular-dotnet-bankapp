import { Component } from '@angular/core';
import { BankService } from '../../services/bank.service';
import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss',
})
export class TransactionHistoryComponent {
  transactions$;

  constructor(private bankService: BankService) {
    this.transactions$ = this.bankService.transactions$;
  }
}
