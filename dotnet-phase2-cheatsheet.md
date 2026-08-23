# .NET Phase 2 Cheat Sheet — BankApp

A quick reference for every .NET concept used in Phase 2, with examples from our project.

---

## 1. Solution Structure (Clean Architecture)

```
server/BankApp/src/
├── BankApp.Domain           ← Core business logic (zero dependencies)
│   └── Entities/
│       ├── Account.cs
│       └── Transaction.cs
│
├── BankApp.Application      ← Use cases, DTOs, interfaces
│   ├── Commands/
│   │   ├── Deposit/
│   │   └── Withdraw/
│   ├── Queries/
│   │   ├── GetBalance/
│   │   └── GetTransactions/
│   ├── DTOs/
│   └── Interfaces/
│
├── BankApp.Infrastructure   ← Data access (EF Core, repositories)
│   ├── Data/
│   ├── Configurations/
│   └── Repositories/
│
└── BankApp.API              ← Entry point (controllers, DI, CORS)
    ├── Controllers/
    └── Program.cs
```

**Rule of thumb:** Dependencies point inward. Domain knows nothing about the outside world. API references everything but contains no logic.

---

## 2. Domain-Driven Design (DDD)

Business rules live inside domain entities, not in services or controllers.

### Rich Domain Entity

```csharp
public class Account
{
    public Guid Id { get; private set; }          // Private setter = read-only from outside
    public decimal Balance { get; private set; }

    public void Deposit(decimal amount, string description)
    {
        if (amount <= 0)
            throw new ArgumentException("Deposit amount must be positive.");

        Balance += amount;   // Business logic HERE, not in a service
        _transactions.Add(new Transaction(Id, "deposit", amount, description, Balance));
    }
}
```

### Key DDD Concepts

| Concept | What it means | Our example |
|---------|--------------|-------------|
| **Rich Entity** | Entity contains business logic, not just data | `Account.Deposit()`, `Account.Withdraw()` |
| **Private Setters** | Properties can't be changed from outside | `Balance { get; private set; }` |
| **Encapsulation** | Internal state is protected | `_transactions` is private, exposed as `IReadOnlyCollection` |
| **Invariants** | Rules that must always be true | "Balance can't go negative" enforced in `Withdraw()` |

### Angular equivalent concept
```typescript
// Angular — logic in a service (anemic model)
this.balance -= amount;  // service does the math

// DDD — logic in the entity (rich model)
account.Withdraw(amount, description);  // entity does the math
```

---

## 3. Backing Field Pattern

A private list that's exposed as read-only. EF Core maps to the private field directly.

```csharp
// Private — only Account can modify
private readonly List<Transaction> _transactions = new();

// Public — outside code can read but not add/remove
public IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();
```

### EF Core Configuration for Backing Fields

```csharp
builder.HasMany(a => a.Transactions)
       .WithOne()
       .HasForeignKey(t => t.AccountId);

builder.Navigation(a => a.Transactions)
       .UsePropertyAccessMode(PropertyAccessMode.Field);  // Use _transactions directly
```

**Why?** Without `PropertyAccessMode.Field`, EF Core tries to use the public `Transactions` property (which is read-only) and fails.

---

## 4. CQRS (Command Query Responsibility Segregation)

Separate the code that **changes** data (commands) from the code that **reads** data (queries).

### Command (changes state)

```csharp
// The request
public record DepositCommand(decimal Amount, string Description) : IRequest<Unit>;

// The handler
public class DepositCommandHandler : IRequestHandler<DepositCommand, Unit>
{
    public async Task<Unit> Handle(DepositCommand request, CancellationToken cancellationToken)
    {
        var account = await _repository.GetOrCreateDefaultAsync();
        account.Deposit(request.Amount, request.Description);  // Domain logic
        await _repository.SaveChangesAsync();
        return Unit.Value;
    }
}
```

### Query (reads state)

```csharp
// The request
public record GetBalanceQuery() : IRequest<decimal>;

// The handler
public class GetBalanceQueryHandler : IRequestHandler<GetBalanceQuery, decimal>
{
    public async Task<decimal> Handle(GetBalanceQuery request, CancellationToken cancellationToken)
    {
        var account = await _repository.GetOrCreateDefaultAsync();
        return account.Balance;  // Just read, no changes
    }
}
```

### Why CQRS?
- **Single Responsibility** — Each handler does one thing
- **Scalability** — Reads and writes can be optimized independently
- **Testability** — Easy to unit test each handler in isolation

---

## 5. MediatR

A library that routes commands/queries to their handlers. Eliminates direct dependencies between controllers and business logic.

### How it flows

```
Controller → MediatR → Handler → Repository → Database
```

### Controller sends a command

```csharp
[HttpPost("deposit")]
public async Task<IActionResult> Deposit([FromBody] DepositCommand command)
{
    await _mediator.Send(command);   // MediatR finds the right handler
    return Ok();
}
```

### Registration

```csharp
// In Program.cs — registers ALL handlers in the Application assembly
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(DepositCommand).Assembly));
```

**C# equivalent concept:** Like a message bus. You send a message, and the right handler picks it up. The sender doesn't know who handles it.

---

## 6. Entity Framework Core

An ORM that maps C# classes to database tables.

### DbContext — The database session

```csharp
public class BankDbContext : DbContext
{
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Transaction> Transactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BankDbContext).Assembly);
    }
}
```

### Entity Configuration (Fluent API)

```csharp
public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Balance).HasColumnType("decimal(18,2)");
        builder.HasMany(a => a.Transactions)
               .WithOne()
               .HasForeignKey(t => t.AccountId);
    }
}
```

### Key EF Core Concepts

| Concept | What it does | Example |
|---------|-------------|---------|
| `DbSet<T>` | Represents a database table | `DbSet<Account> Accounts` |
| `DbContext` | Database session, tracks changes | `BankDbContext` |
| `HasKey()` | Sets primary key | `builder.HasKey(a => a.Id)` |
| `HasColumnType()` | Specifies SQL column type | `"decimal(18,2)"` |
| `HasMany().WithOne()` | One-to-many relationship | Account → Transactions |
| `SaveChangesAsync()` | Persists all tracked changes to DB | Generates INSERT/UPDATE SQL |
| `Include()` | Eager load related data | `.Include(a => a.Transactions)` |

---

## 7. Repository Pattern

Abstracts database access behind an interface. Domain and Application layers don't know about EF Core.

### Interface (in Application layer)

```csharp
public interface IAccountRepository
{
    Task<Account> GetOrCreateDefaultAsync();
    Task SaveChangesAsync();
}
```

### Implementation (in Infrastructure layer)

```csharp
public class AccountRepository : IAccountRepository
{
    private readonly BankDbContext _context;

    public async Task<Account> GetOrCreateDefaultAsync()
    {
        var account = await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync();

        if (account == null)
        {
            account = new Account();
            _context.Accounts.Add(account);
            await _context.SaveChangesAsync();
        }

        return account;
    }
}
```

**Why?** Swappable data access. You could replace EF Core with Dapper or a mock for testing without changing any business logic.

---

## 8. Dependency Injection

.NET's built-in DI container wires up interfaces to implementations.

```csharp
// In Program.cs
builder.Services.AddDbContext<BankDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IAccountRepository, AccountRepository>();
//               ^ lifetime    ^ interface          ^ implementation
```

### Service Lifetimes

| Lifetime | What it means | When to use |
|----------|--------------|-------------|
| `AddScoped` | One instance per HTTP request | Repositories, DbContext |
| `AddSingleton` | One instance for the entire app | Config, caches |
| `AddTransient` | New instance every time | Lightweight, stateless services |

### Constructor Injection

```csharp
public class DepositCommandHandler
{
    private readonly IAccountRepository _repository;

    public DepositCommandHandler(IAccountRepository repository)
    {
        _repository = repository;  // DI provides this automatically
    }
}
```

---

## 9. DTOs (Data Transfer Objects)

Shapes that define what the API sends back. Decouples your API response from your domain entity.

```csharp
public record TransactionDto(
    Guid Id,
    string Type,
    decimal Amount,
    string Description,
    decimal BalanceAfter,
    DateTime CreatedAt
);
```

### Why not return the entity directly?

- **Security** — Don't expose internal fields (like `AccountId`)
- **Stability** — API contract doesn't break when entity changes
- **Flexibility** — Shape data differently for different endpoints

### Mapping entity to DTO

```csharp
var dtos = account.Transactions.Select(t => new TransactionDto(
    t.Id, t.Type, t.Amount, t.Description, t.BalanceAfter, t.CreatedAt
));
```

---

## 10. CORS (Cross-Origin Resource Sharing)

Allows your Angular app (port 4200) to call your API (port 7160).

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseCors("AllowAngular");
```

**Without CORS:** The browser blocks requests from one origin to another. This policy tells the API to accept requests from Angular.

---

## 11. Auto-Migration & Seeding

Database is created and migrated automatically when the app starts.

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BankDbContext>();
    db.Database.Migrate();  // Apply any pending migrations

    // Seed a default account if none exists
    if (!db.Accounts.Any())
    {
        db.Accounts.Add(new Account());
        db.SaveChanges();
    }
}
```

**Why?** No manual `dotnet ef database update` needed. Just run the app and the database is ready.

---

## 12. Angular HttpClient Integration

How the frontend talks to the backend.

### API Service

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'https://localhost:7160/api';

  constructor(private http: HttpClient) {}

  getBalance(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/account/balance`);
  }

  deposit(amount: number, description: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/account/deposit`, { amount, description });
  }
}
```

### Registering HttpClient

```typescript
// In app.config.ts
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()   // Makes HttpClient available app-wide
  ]
};
```

### BankService calls API instead of in-memory

```typescript
private loadBalance(): void {
  this.apiService.getBalance().subscribe(response => {
    this.balance.next(response.balance);  // Update BehaviorSubject from API
  });
}

deposit(amount: number, description: string): void {
  this.apiService.deposit(amount, description).subscribe(() => {
    this.loadBalance();        // Refresh after change
    this.loadTransactions();
  });
}
```

**Key insight:** The components didn't change at all. They still subscribe to `balance$` and `transactions$`. Only the service changed — from in-memory math to API calls.

---

## Quick Reference Table

| Concept | What it does | Where we used it |
|---------|-------------|-----------------|
| Clean Architecture | 4-layer project separation | Domain → Application → Infrastructure → API |
| DDD Rich Entity | Business logic in entities | `Account.Deposit()`, `Account.Withdraw()` |
| Private Setters | Protect entity state | `Balance { get; private set; }` |
| Backing Field | Private list, public read-only | `_transactions` → `IReadOnlyCollection` |
| CQRS | Separate reads from writes | Commands vs Queries folders |
| MediatR | Routes commands to handlers | `_mediator.Send(command)` |
| `IRequest<T>` | Defines a MediatR message | `DepositCommand : IRequest<Unit>` |
| `IRequestHandler<T>` | Handles a MediatR message | `DepositCommandHandler` |
| `DbContext` | EF Core database session | `BankDbContext` |
| `DbSet<T>` | Maps to a database table | `DbSet<Account> Accounts` |
| Fluent API | Configure entity-to-table mapping | `AccountConfiguration` |
| `Include()` | Eager load related data | `.Include(a => a.Transactions)` |
| Repository Pattern | Abstract data access | `IAccountRepository` / `AccountRepository` |
| DI `AddScoped` | One instance per request | Repository, DbContext |
| Record DTO | Immutable data transfer shape | `TransactionDto` |
| CORS | Allow cross-origin requests | `AllowAngular` policy |
| Auto-Migration | DB created on startup | `db.Database.Migrate()` |
| `HttpClient` | Angular HTTP calls | `ApiService` |
| `provideHttpClient()` | Register HttpClient in Angular | `app.config.ts` |
