import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BankService } from '../../services/bank.service';

@Component({
  selector: 'app-withdraw.component',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './withdraw.component.html',
  styleUrl: './withdraw.component.scss',
})
export class WithdrawComponent {
  withdrawForm: FormGroup;
  insufficientFunds = false;

  constructor(
    private fb: FormBuilder,
    private bankService: BankService,
    private router: Router
  ) {
    this.withdrawForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]], // built-in validation rules (required, min value)
      description: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.withdrawForm.valid) {
      const { amount, description } = this.withdrawForm.value;
      const success = this.bankService.withdraw(Number(amount), description);

      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.insufficientFunds = true;
      }
    }
  }
}
