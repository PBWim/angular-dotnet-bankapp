import { Component } from '@angular/core';
import { BankService } from '../../services/bank.service';
import { AsyncPipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard.component',
  
  standalone: true, // This component is self-contained and can be used independently without being declared in an NgModule.

  // async pipe — automatically subscribes to balance$ in the template and unsubscribes when the component is destroyed. 
  // No manual subscribe/unsubscribe needed.

  // currency pipe — formats the number as $0.00.
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  balance$;

  constructor(private bankService: BankService) {
    this.balance$ = this.bankService.balance$;
  }
}
