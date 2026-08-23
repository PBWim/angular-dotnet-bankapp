import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-deposit.component',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './deposit.component.html',
  styleUrl: './deposit.component.scss',
})
export class DepositComponent {
  depositForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private bankService: BankService,
    private router: Router
  ) {
    // Reactive forms allow you to define the structure of your form in the component class, rather than in the template. 
    // This makes it easier to manage complex forms and apply validation rules.
    // It's similar to how in .NET you'd prefer a strongly-typed ViewModel with data annotations over doing validation in the Razor view directly.
    this.depositForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]], // built-in validation rules (required, min value)
      description: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.depositForm.valid) {
      const { amount, description } = this.depositForm.value;
      this.bankService.deposit(Number(amount), description);
      this.router.navigate(['/dashboard']); // Navigate back to the dashboard after a successful deposit
    }
  }
}
