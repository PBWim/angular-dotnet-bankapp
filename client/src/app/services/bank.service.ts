import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Transaction } from '../models/transaction.model';

@Injectable({
  // The providedIn: 'root' option makes this service a singleton and available throughout the 
  // application without needing to add it to the providers array of any module.

  // Angular creates one single instance of it for the entire app. Every component that injects it gets 
  // the same instance — so they all read and write to the same balance and transactions.
  providedIn: 'root',
})
export class BankService {
  // This wraps the value 0 in a container that components can subscribe to. 
  // When you update it with this.balance.next(500), 
  // every component subscribed to it instantly gets the new value 500 — no manual refreshing needed.

  // So when the dashboard is showing the balance and the user makes a deposit on another page, 
  // the dashboard updates automatically because it's subscribed to the same BehaviorSubject.
  private balance = new BehaviorSubject<number>(0);
  private transactions = new BehaviorSubject<Transaction[]>([]);

  // It's basically encapsulation — the same principle as making a field private and exposing it through methods in C#.\
  // If a component wants to change the balance, it has to call deposit() or withdraw() — which contain the business logic and validation.
  // This prevents any component from doing something like bankService.balance.next(999999) and bypassing the rules.
  balance$ = this.balance.asObservable();
  transactions$ = this.transactions.asObservable();

  deposit(amount: number, description: string): void {
    const newBalance = this.balance.value + amount;

    // This updates the balance value and notifies all subscribers.
    // Think of next() as "push a new value into the BehaviorSubject."
    // Whatever component is listening to balance$ will immediately receive newBalance.
    this.balance.next(newBalance);

    const transaction: Transaction = {
      id: Date.now(),
      type: 'deposit',
      amount,
      description,
      date: new Date(),
      balance: newBalance
    };

    // This pushes a new transaction list to all subscribers, with the newest transaction first.
    // Current transactions: [txn2, txn1]
    // New transaction: txn3
    // becomes: [txn3, txn2, txn1]
    this.transactions.next([transaction, ...this.transactions.value]);

    console.log('Balance after deposit:', this.balance.value); // .value gives you the balance right now
  }

  withdraw(amount: number, description: string): boolean {
    if (amount > this.balance.value) {
      return false;
    }

    const newBalance = this.balance.value - amount;
    this.balance.next(newBalance);

    const transaction: Transaction = {
      id: Date.now(),
      type: 'withdraw',
      amount,
      description,
      date: new Date(),
      balance: newBalance
    };

    this.transactions.next([transaction, ...this.transactions.value]);

    console.log('Balance after withdrawal:', this.balance.value);

    return true;
  }
}