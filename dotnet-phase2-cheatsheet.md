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

## 13. Unit Testing with xUnit & Moq

Test each handler in isolation by mocking the repository.

### Test Project Structure

```
server/BankApp/tests/BankApp.Tests/
└── Application/
    ├── DepositCommandHandlerTests.cs
    ├── WithdrawCommandHandlerTests.cs
    ├── GetBalanceQueryHandlerTests.cs
    └── GetTransactionsQueryHandlerTests.cs
```

### AAA Pattern (Arrange, Act, Assert)

Every test follows this structure:

```csharp
[Fact]
public async Task Handle_ValidDeposit_ShouldIncreaseBalance()
{
    // Arrange — set up test data and dependencies
    var command = new DepositCommand(100, "Salary");

    // Act — call the method being tested
    await _handler.Handle(command, CancellationToken.None);

    // Assert — verify the result
    Assert.Equal(100, _account.Balance);
}
```

### Mocking with Moq

Create a fake version of `IAccountRepository` so tests don't need a real database.

```csharp
// Create the mock
var mockRepo = new Mock<IAccountRepository>();

// Set up behavior — when GetOrCreateDefaultAsync is called, return our test account
mockRepo.Setup(r => r.GetOrCreateDefaultAsync())
        .ReturnsAsync(account);

// Pass the mock to the handler
var handler = new DepositCommandHandler(mockRepo.Object);
//                                      ^ .Object gives the fake instance
```

### Verifying Method Calls

Check that a method was (or wasn't) called:

```csharp
// Verify SaveChangesAsync was called exactly once
mockRepo.Verify(r => r.SaveChangesAsync(), Times.Once);

// Verify it was NEVER called (e.g., when validation fails)
mockRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
```

### Testing Exceptions

```csharp
[Fact]
public async Task Handle_ZeroAmount_ShouldThrowArgumentException()
{
    // Arrange
    var command = new DepositCommand(0, "Bad deposit");

    // Act & Assert — combined because the Act IS the assertion
    await Assert.ThrowsAsync<ArgumentException>(
        () => _handler.Handle(command, CancellationToken.None));
}
```

### Shared Setup with Constructor

xUnit creates a new instance for each test, so the constructor is your shared Arrange:

```csharp
public class DepositCommandHandlerTests
{
    private readonly Mock<IAccountRepository> _mockRepo;
    private readonly DepositCommandHandler _handler;
    private readonly Account _account;

    public DepositCommandHandlerTests()
    {
        // Runs before EVERY test — fresh state each time
        _mockRepo = new Mock<IAccountRepository>();
        _account = new Account();
        _mockRepo.Setup(r => r.GetOrCreateDefaultAsync()).ReturnsAsync(_account);
        _handler = new DepositCommandHandler(_mockRepo.Object);
    }
}
```

### Test Naming Convention

```
MethodName_Scenario_ExpectedResult
```

Examples:
- `Handle_ValidDeposit_ShouldIncreaseBalance`
- `Handle_ExceedsBalance_ShouldThrowInvalidOperationException`
- `Handle_ZeroAmount_ShouldNotCallSaveChanges`

### Key xUnit Attributes

| Attribute | What it does |
|-----------|-------------|
| `[Fact]` | Marks a method as a test |
| `[Theory]` | Parameterized test (runs multiple times with different data) |
| `[InlineData]` | Provides data for a `[Theory]` test |

### Key Assert Methods

| Method | What it checks |
|--------|---------------|
| `Assert.Equal(expected, actual)` | Values are equal |
| `Assert.Single(collection)` | Collection has exactly one item |
| `Assert.Empty(collection)` | Collection is empty |
| `Assert.ThrowsAsync<T>()` | Async method throws expected exception |
| `Assert.NotEqual(a, b)` | Values are not equal |
| `Assert.IsType<T>(obj)` | Object is the expected type |

---

## 14. JWT Authentication (Phase 3)

JSON Web Tokens (JWT) for stateless authentication. The server generates a signed token on login, and the client sends it with every request.

### How JWT Works

```
1. User sends email + password → POST /api/auth/login
2. Server validates credentials → generates signed JWT token
3. Server returns token to client
4. Client stores token in localStorage
5. Client sends token in Authorization header with every request
6. Server validates token and extracts user identity from claims
```

### Token Generation

```csharp
public string GenerateToken(User user)
{
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),  // Who they are
        new(ClaimTypes.Email, user.Email),
        new(ClaimTypes.GivenName, user.FirstName)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));

    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        issuer: _configuration["Jwt:Issuer"],
        audience: _configuration["Jwt:Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddHours(24),
        signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
}
```

### Key JWT Concepts

| Concept | What it does | Example |
|---------|-------------|---------|
| **Claims** | Data embedded in the token | UserId, Email, FirstName |
| **SymmetricSecurityKey** | Secret key to sign/verify tokens | From `appsettings.json` |
| **SigningCredentials** | Algorithm used to sign | HMAC-SHA256 |
| **Issuer/Audience** | Who created / who should accept | `"BankApp"` |
| **Expires** | Token lifetime | 24 hours |

### Protecting Endpoints with `[Authorize]`

```csharp
[ApiController]
[Authorize]          // All endpoints in this controller require a valid token
[Route("api/account")]
public class AccountController : ControllerBase
```

### Extracting User Identity from Token

```csharp
private Guid GetUserId() =>
    Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

// Use it in endpoints
[HttpGet("balance")]
public async Task<IActionResult> GetBalance()
{
    var balance = await _mediator.Send(new GetBalanceQuery(GetUserId()));
    return Ok(new { balance });
}
```

`User` is a built-in property on `ControllerBase` — it contains the claims from the validated JWT token. No database lookup needed.

### JWT Authentication Middleware (Program.cs)

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
    };
});

// Middleware order matters!
app.UseCors("AllowAngular");
app.UseAuthentication();   // 1. Validate the token
app.UseAuthorization();    // 2. Check [Authorize] attribute
app.MapControllers();
```

### Password Hashing in Domain Entity

```csharp
// Business logic in the entity (DDD)
public User(string email, string password, string firstName, string lastName)
{
    if (string.IsNullOrWhiteSpace(password))
        throw new ArgumentException("Password is required.");
    if (password.Length < 6)
        throw new ArgumentException("Password must be at least 6 characters.");

    PasswordHash = HashPassword(password);
    // Creates a default account for the user
    _accounts.Add(new Account());
}

public bool VerifyPassword(string password)
{
    return PasswordHash == HashPassword(password);
}

private static string HashPassword(string password)
{
    var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
    return Convert.ToBase64String(bytes);
}
```

### Auth CQRS Commands

```csharp
// Register — creates user + returns token
public record RegisterCommand(string Email, string Password,
    string FirstName, string LastName) : IRequest<AuthResponseDto>;

// Login — validates credentials + returns token
public record LoginCommand(string Email, string Password) : IRequest<AuthResponseDto>;

// Response DTO
public record AuthResponseDto(string Token, string Email, string FirstName);
```

### Request vs Command Separation

```csharp
// What the API receives (no UserId — comes from token)
public record DepositRequest(decimal Amount, string Description);

// What the handler receives (UserId added by controller)
public record DepositCommand(Guid UserId, decimal Amount, string Description) : IRequest<Unit>;

// Controller bridges them
[HttpPost("deposit")]
public async Task<IActionResult> Deposit([FromBody] DepositRequest request)
{
    await _mediator.Send(new DepositCommand(GetUserId(), request.Amount, request.Description));
    return Ok();
}
```

**Why?** The frontend never sends a UserId — it comes from the authenticated token, preventing users from impersonating each other.

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
| `[Fact]` | Marks a test method | All test classes |
| `Mock<T>` | Creates a fake dependency | `Mock<IAccountRepository>` |
| `.Setup().ReturnsAsync()` | Configure mock behavior | Repository mock setup |
| `.Verify()` | Assert a method was called | `SaveChangesAsync` verification |
| `Assert.ThrowsAsync<T>()` | Verify exception is thrown | Validation failure tests |
| AAA Pattern | Arrange, Act, Assert structure | All tests |
| `[Authorize]` | Protect endpoints — require valid JWT | AccountController, TransactionController |
| `ClaimTypes.NameIdentifier` | Extract UserId from JWT token | `GetUserId()` helper |
| `JwtSecurityToken` | Build a signed JWT token | `JwtService.GenerateToken()` |
| `SymmetricSecurityKey` | Secret key for signing tokens | From `appsettings.json` |
| `AddAuthentication().AddJwtBearer()` | Configure JWT validation | `Program.cs` |
| `UseAuthentication()` | Middleware to validate tokens | Must come before `UseAuthorization()` |
| Password Hashing | SHA256 hash in domain entity | `User.HashPassword()`, `User.VerifyPassword()` |
| Request vs Command | API shape vs handler shape | `DepositRequest` → `DepositCommand` with UserId |
