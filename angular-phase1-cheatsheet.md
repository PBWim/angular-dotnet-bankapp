# Angular Phase 1 Cheat Sheet — BankApp

A quick reference for every Angular concept used in Phase 1, with examples from our project.

---

## 1. Project Structure

```
client/src/app/
├── components/          ← UI components (pages)
│   ├── dashboard/
│   ├── deposit/
│   ├── withdraw/
│   └── transaction-history/
├── services/            ← Business logic & shared state
│   └── bank.service.ts
├── models/              ← TypeScript interfaces
│   └── transaction.model.ts
├── app.routes.ts        ← URL → component mapping
├── app.html             ← Root template (navbar + router-outlet)
├── app.ts               ← Root component
└── app.scss             ← Root styles
```

**Rule of thumb:** Components handle UI, services handle data and logic, models define data shapes.

---

## 2. Components

A component = a reusable UI building block with three parts: TypeScript (logic), HTML (template), SCSS (styles).

```typescript
@Component({
  selector: 'app-dashboard',        // HTML tag name: <app-dashboard>
  standalone: true,                  // Self-contained, no NgModule needed
  imports: [AsyncPipe, CurrencyPipe], // Dependencies this component uses
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // Component logic here
}
```

### Key points:
- **`selector`** — The custom HTML tag for this component
- **`standalone: true`** — Component manages its own dependencies (Angular 21 default)
- **`imports`** — Pipes, directives, and modules this component needs

---

## 3. Standalone Components

In older Angular, components belonged to an NgModule that declared shared dependencies. With standalone components, each component imports what it needs directly.

```typescript
// OLD way — shared module
@NgModule({
  declarations: [DashboardComponent, DepositComponent],
  imports: [CommonModule]
})
export class AppModule {}

// NEW way (Angular 21) — each component is self-contained
@Component({
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe]  // only what THIS component needs
})
export class DashboardComponent {}
```

**Why it's better:** Smaller bundles (tree-shaking), simpler code, no module boilerplate.

---

## 4. Models (Interfaces)

TypeScript interfaces define the shape of your data. They don't generate any JavaScript — they're purely for type safety.

```typescript
export interface Transaction {
  id: number;
  type: 'deposit' | 'withdraw';   // Union type — only these two values allowed
  amount: number;
  description: string;
  date: Date;
  balance: number;                 // Balance AFTER this transaction
}
```

**C# equivalent:** Like a record or a class with properties, but with no runtime cost.

---

## 5. Services & Dependency Injection

A service is a class that holds shared logic and state. Angular creates ONE instance (singleton) and injects it into any component that asks for it.

```typescript
@Injectable({
  providedIn: 'root'   // Single instance for the entire app
})
export class BankService {
  // Shared state and methods
}
```

Components receive the service via **constructor injection** — same concept as in .NET:

```typescript
// Angular
constructor(private bankService: BankService) {}

// C# equivalent
public DashboardController(IBankService bankService) { }
```

---

## 6. BehaviorSubject & Observables (RxJS)

### BehaviorSubject
A special variable that **notifies subscribers** when its value changes.

```typescript
private balance = new BehaviorSubject<number>(0);
//                                          ^ initial value
```

- **`.next(value)`** — Push a new value and notify all subscribers
- **`.value`** — Get the current value (synchronous)
- **`.asObservable()`** — Create a read-only version

### Why asObservable()?
Encapsulation — components can listen but can't directly modify the value.

```typescript
// Inside service — full control
private balance = new BehaviorSubject<number>(0);  // read + write
this.balance.next(500);   // ✅ allowed

// Exposed to components — read only
balance$ = this.balance.asObservable();  // read only
// Components must call deposit() or withdraw() to change the value
```

### The $ convention
A trailing `$` means "this is an Observable." It's a naming convention, not syntax.

```typescript
balance$        // Observable<number>
transactions$   // Observable<Transaction[]>
```

### C# equivalent concept
```csharp
// BehaviorSubject ≈ event + backing field
public event Action<decimal> BalanceChanged;
private decimal _balance;
public void UpdateBalance(decimal val) {
    _balance = val;
    BalanceChanged?.Invoke(val);  // like .next()
}
```

---

## 7. Reactive Forms

Form logic lives in TypeScript, not in the template. Gives you full control over validation and behavior.

### Setting up a form

```typescript
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// In component imports array:
imports: [ReactiveFormsModule]

// In constructor:
this.depositForm = this.fb.group({
  amount: ['', [Validators.required, Validators.min(0.01)]],
  //       ^          ^                    ^
  //   initial    first validator     second validator
  //    value
  description: ['', Validators.required]
});
```

### Binding to HTML

```html
<form [formGroup]="depositForm" (ngSubmit)="onSubmit()">
  <input formControlName="amount">
  <button [disabled]="depositForm.invalid">Submit</button>
</form>
```

- **`[formGroup]`** — Binds the HTML form to the TypeScript FormGroup
- **`formControlName`** — Links an input to a specific form control
- **`(ngSubmit)`** — Event fired when the form is submitted
- **`[disabled]`** — Property binding to disable button when form is invalid

### Reading form values

```typescript
const { amount, description } = this.depositForm.value;
```

### Checking validation state

```typescript
depositForm.get('amount')?.invalid   // true if validation fails
depositForm.get('amount')?.touched   // true if user has interacted with it
depositForm.valid                    // true if ALL fields are valid
depositForm.invalid                  // opposite of .valid
```

---

## 8. Routing

Maps URLs to components. Defined in `app.routes.ts`.

### Route configuration

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'deposit', component: DepositComponent },
  { path: 'withdraw', component: WithdrawComponent },
  { path: 'transactions', component: TransactionHistoryComponent }
];
```

- **`path: ''`** — The root URL (localhost:4200/)
- **`redirectTo`** — Redirect to another route
- **`pathMatch: 'full'`** — Only redirect when the ENTIRE path is empty

### Router outlet

```html
<router-outlet></router-outlet>
```

A placeholder in `app.html` where Angular renders the component matching the current URL. Like `@RenderBody()` in ASP.NET's `_Layout.cshtml`.

### Navigation links

```html
<a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
```

- **`routerLink`** — Navigate without full page reload (SPA behavior)
- **`routerLinkActive`** — Adds a CSS class when this route is active

### Programmatic navigation

```typescript
this.router.navigate(['/dashboard']);  // Navigate from TypeScript code
```

---

## 9. Pipes

Transform data in templates. Used with the `|` symbol.

### async pipe
Subscribes to an Observable and displays its current value. Auto-unsubscribes on component destroy.

```html
{{ balance$ | async }}
<!-- Subscribes to balance$, shows: 100 -->
```

### currency pipe
Formats a number as currency.

```html
{{ 100 | currency: 'USD' }}
<!-- Shows: $100.00 -->
```

### date pipe
Formats a Date object.

```html
{{ txn.date | date: 'medium' }}
<!-- Shows: Aug 23, 2026, 12:06:58 AM -->
```

### Chaining pipes
Pipes can be chained left to right:

```html
{{ balance$ | async | currency: 'USD' }}
<!--  Observable → number → formatted string -->
<!--  balance$  →  100   →  $100.00           -->
```

---

## 10. Template Syntax

### Interpolation
Display component data in HTML.

```html
{{ txn.description }}
```

### Property binding
Bind a component property to an HTML attribute.

```html
<button [disabled]="depositForm.invalid">Submit</button>
<!--     ^ one-way: component → template -->
```

### Event binding
React to user events.

```html
<form (ngSubmit)="onSubmit()">
<!--   ^ one-way: template → component -->
```

### Class binding
Conditionally add CSS classes.

```html
<div [class.deposit]="txn.type === 'deposit'"
     [class.withdraw]="txn.type === 'withdraw'">
```

---

## 11. Control Flow (Angular 21)

The modern built-in syntax — no imports needed.

### @if (replaces *ngIf)

```html
@if (insufficientFunds) {
  <div class="alert">Insufficient funds!</div>
}
```

### @for (replaces *ngFor)

```html
@for (txn of transactions$ | async; track txn.id) {
  <div class="transaction">{{ txn.description }}</div>
}
```

- **`track txn.id`** — Required. Tells Angular how to identify each item for efficient DOM updates.

---

## 12. Spread Operator

JavaScript's `...` operator unpacks an array into individual items. Used in our service to prepend new transactions.

```typescript
// Current: [txn2, txn1]
// Adding:  txn3

[transaction, ...this.transactions.value]
// Result:  [txn3, txn2, txn1]
```

**Why not push()?** — Mutating the existing array won't trigger RxJS subscribers. Creating a NEW array does.

---

## Quick Reference Table

| Concept | What it does | Where we used it |
|---------|-------------|-----------------|
| `@Component` | Defines a UI component | All components |
| `@Injectable` | Defines a service | BankService |
| `BehaviorSubject` | Observable with current value | Balance & transactions state |
| `.next()` | Push new value to subscribers | deposit() and withdraw() |
| `.asObservable()` | Read-only version of BehaviorSubject | balance$, transactions$ |
| `FormGroup` | Group of form controls | Deposit & withdraw forms |
| `Validators` | Built-in validation rules | required, min(0.01) |
| `routerLink` | SPA navigation link | Navbar |
| `routerLinkActive` | Highlight active route | Navbar |
| `router-outlet` | Render routed component here | app.html |
| `async` pipe | Subscribe to observable in template | Dashboard, transaction list |
| `currency` pipe | Format number as money | Balance, amounts |
| `date` pipe | Format date | Transaction dates |
| `@if` | Conditional rendering | Error messages, alerts |
| `@for` | Loop rendering | Transaction list |
| `standalone: true` | Self-contained component | All components |
