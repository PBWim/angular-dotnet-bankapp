# Phase 3 Cheat Sheet — JWT Authentication (BankApp)

A quick reference for every concept used in Phase 3, covering both the .NET backend and Angular frontend.

---

## 1. JWT Authentication — How It Works

```
1. User sends email + password to /api/auth/login
2. Server validates credentials, generates a JWT token
3. Server returns the token to the client
4. Client stores the token in localStorage
5. Every subsequent API request includes: Authorization: Bearer <token>
6. Server validates the token on each request via [Authorize]
```

**JWT = JSON Web Token** — a signed string containing user claims (like UserId). The server never stores sessions — the token itself proves identity.

---

## 2. Backend — User Entity (DDD)

```csharp
public class User
{
    public Guid Id { get; private set; }
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private readonly List<Account> _accounts = new();
    public IReadOnlyCollection<Account> Accounts => _accounts.AsReadOnly();

    private User() { }  // EF Core constructor

    public User(string email, string password, string firstName, string lastName)
    {
        Id = Guid.NewGuid();
        Email = email.ToLower();
        PasswordHash = HashPassword(password);
        FirstName = firstName;
        LastName = lastName;
        CreatedAt = DateTime.UtcNow;
        _accounts.Add(new Account(Id));  // Default account on registration
    }

    public bool VerifyPassword(string password) => PasswordHash == HashPassword(password);

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }
}
```

**Key patterns:**
- **Private setters** — Only the entity can change its own state (DDD encapsulation)
- **Backing field `_accounts`** — External code gets `IReadOnlyCollection`, can't add/remove directly
- **Password hashing in the domain** — Business logic lives in the entity, not in a handler
- **`private User() { }`** — Required for EF Core to reconstruct entities from the database

---

## 3. Backend — Account Entity Update

```csharp
// Added to existing Account entity
public Guid UserId { get; private set; }
```

Each account now belongs to a specific user. EF Core creates the foreign key relationship automatically.

---

## 4. Backend — EF Core Configuration for User

```csharp
public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.HasMany(u => u.Accounts)
               .WithOne()
               .HasForeignKey(a => a.UserId);

        // Tell EF Core about the backing field
        builder.Navigation(u => u.Accounts)
               .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
```

**`HasIndex(u => u.Email).IsUnique()`** — Prevents duplicate email registrations at the database level.

---

## 5. Backend — JWT Token Generation

```csharp
public class JwtService : IJwtService
{
    public string GenerateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FirstName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

**Claims** are key-value pairs baked into the token. `ClaimTypes.NameIdentifier` stores the UserId — this is how the API knows *who* is making the request.

### Key JWT Concepts

| Concept | What it does | Example |
|---------|-------------|---------|
| **Claims** | Data embedded in the token | UserId, Email, FirstName |
| **SymmetricSecurityKey** | Secret key to sign/verify tokens | From `appsettings.json` |
| **SigningCredentials** | Algorithm used to sign | HMAC-SHA256 |
| **Issuer/Audience** | Who created / who should accept | `"BankApp"` |
| **Expires** | Token lifetime | 24 hours |

---

## 6. Backend — JWT Configuration in Program.cs

```csharp
// Add JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
app.UseAuthentication();   // Must come before Authorization
app.UseAuthorization();
```

**`appsettings.json`:**
```json
{
  "Jwt": {
    "Secret": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "BankApp",
    "Audience": "BankApp"
  }
}
```

---

## 7. Backend — [Authorize] and Claims Extraction

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]   // Every endpoint in this controller requires a valid JWT
public class AccountController : ControllerBase
{
    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request)
    {
        var userId = GetUserId();  // Extract from token
        var command = new DepositCommand(userId, request.Amount, request.Description);
        await _mediator.Send(command);
        return Ok();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
```

**Request vs Command pattern:**
```csharp
// What the client sends (no UserId — client can't be trusted)
public record DepositRequest(decimal Amount, string Description);

// What the handler receives (UserId from the validated token)
public record DepositCommand(Guid UserId, decimal Amount, string Description) : IRequest;
```

`User` is a built-in property on `ControllerBase` — it contains the claims from the validated JWT token. No database lookup needed.

The client never sends `UserId` — the server extracts it from the JWT token. This prevents users from accessing other users' data.

---

## 8. Backend — Auth CQRS Commands

```csharp
// Register
public record RegisterCommand(string Email, string Password, string FirstName, string LastName)
    : IRequest<AuthResponseDto>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken ct)
    {
        var existing = await _userRepository.GetByEmailAsync(request.Email);
        if (existing != null) throw new InvalidOperationException("Email already registered");

        var user = new User(request.Email, request.Password, request.FirstName, request.LastName);
        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);
        return new AuthResponseDto(token, user.Email, user.FirstName);
    }
}

// Login
public record LoginCommand(string Email, string Password) : IRequest<AuthResponseDto?>;
// Handler verifies password, returns null if invalid
```

**`AuthResponseDto`:**
```csharp
public record AuthResponseDto(string Token, string Email, string FirstName);
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
    _accounts.Add(new Account(Id));  // Default account on registration
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

Validation lives in the entity, not in the handler — this is the DDD approach. The handler just calls `new User(...)` and the entity protects its own invariants.

---

## 9. Backend — Swagger JWT Configuration

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
```

Adds the "Authorize" button in Swagger UI — paste your JWT token there to test protected endpoints.

---

## 10. Frontend — AuthService (Managing Auth State)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'bankapp_token';

  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  login(email: string, password: string): void {
    this.apiService.login(email, password).subscribe({
      next: (response) => {
        localStorage.setItem(this.tokenKey, response.token);
        this.loggedIn.next(true);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}
```

**Key concept:** `localStorage` persists across page refreshes (unlike JavaScript variables which are wiped). So the user stays logged in even after refreshing the page.

---

## 11. Frontend — HTTP Interceptor (Auto-Attach Token)

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clonedReq);
  }

  return next(req);
};
```

- **`HttpInterceptorFn`** — Angular 21 uses functional interceptors (not class-based)
- **`req.clone()`** — HTTP requests are immutable, so we create a copy with the header added
- Like middleware in .NET — every outgoing HTTP request passes through it

### Registering the Interceptor

```typescript
// app.config.ts
provideHttpClient(withInterceptors([authInterceptor]))
```

Similar to `app.UseAuthentication()` in .NET — wires the interceptor into the pipeline.

---

## 12. Frontend — Route Guard (Protect Pages)

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn$.pipe(
    take(1),
    map(isLoggedIn => {
      if (isLoggedIn) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
```

Like `[Authorize]` in .NET — blocks access if not authenticated.

### Using Guards in Routes

```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  // Protected routes get canActivate
];
```

---

## 13. Frontend — Dynamic Navbar

```html
@if (isLoggedIn$ | async) {
  <a routerLink="/dashboard">Dashboard</a>
  <span>Hi, {{ (currentUser$ | async)?.firstName }}</span>
  <a (click)="logout()">Logout</a>
}
```

Navbar only shows when logged in — `@if` checks the `isLoggedIn$` observable.

---

## 14. Frontend — SPA State Management on Login/Logout

```typescript
// Problem: Angular services are singletons — data persists across login/logout
// Solution: refresh/clear data when user changes

// In BankService
refresh(): void { this.loadBalance(); this.loadTransactions(); }
clear(): void { this.balance.next(0); this.transactions.next([]); }

// In AuthService
setSession(response) { ... this.bankService.refresh(); }
logout() { ... this.bankService.clear(); }
```

**Why?** In a SPA, the page never fully reloads. Singleton services keep the previous user's data unless you explicitly reset them.

---

## 15. Testing — Backend Auth Handlers

After adding UserId to all commands/queries, existing tests needed updates:

```csharp
public class DepositCommandHandlerTests
{
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Mock<IAccountRepository> _mockRepo;

    [Fact]
    public async Task Handle_ValidDeposit_CallsRepositoryMethods()
    {
        // Arrange
        var account = new Account(_userId);
        _mockRepo.Setup(r => r.GetByUserIdAsync(_userId))
                 .ReturnsAsync(account);

        var command = new DepositCommand(_userId, 100m, "Test deposit");

        // Act
        await _handler.Handle(command, CancellationToken.None);

        // Assert
        _mockRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
```

**Key change:** Mock setup changed from `GetOrCreateDefaultAsync()` to `GetByUserIdAsync(_userId)`, and all commands/queries now take `UserId` as the first parameter.

---

## 16. Testing — Frontend Auth Components

```typescript
describe('LoginComponent', () => {
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      isLoggedIn$: of(false),
      currentUser$: of(null)
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])  // Required for RouterLink
      ]
    });
  });

  it('should call login on valid submit', () => {
    // Arrange
    component.loginForm.setValue({ email: 'test@test.com', password: '123456' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.login).toHaveBeenCalledWith('test@test.com', '123456');
  });
});
```

**Gotchas:**
- Use `toBeFalsy()` / `toBeTruthy()` in Vitest, NOT `toBeFalse()` / `toBeTrue()` (those are Jasmine)
- Add `provideRouter([])` when testing components that use `RouterLink`

---

## Quick Reference Table

| Concept | What it does | Where we used it |
|---------|-------------|-----------------|
| **Backend** | | |
| `SHA256.HashData()` | Hash password (one-way) | User entity |
| `private User() { }` | EF Core reconstruction constructor | User entity |
| `_accounts` backing field | Encapsulated collection (DDD) | User entity |
| `IJwtService` | Token generation interface | Application layer |
| `SymmetricSecurityKey` | Key for signing JWT tokens | JwtService |
| `SecurityAlgorithms.HmacSha256` | Signing algorithm | JwtService |
| `ClaimTypes.NameIdentifier` | Stores UserId in the JWT token | JwtService + AccountController |
| `[Authorize]` | Require valid JWT on controller/action | AccountController, TransactionController |
| `User.FindFirst()` | Extract a claim from the validated token | AccountController `GetUserId()` |
| `AddAuthentication()` | Register JWT auth in DI | Program.cs |
| `UseAuthentication()` | Middleware — validate token on each request | Program.cs (before UseAuthorization) |
| `AddSecurityDefinition()` | Add JWT support to Swagger UI | Program.cs |
| `JwtSecurityToken` | Build a signed JWT token | `JwtService.GenerateToken()` |
| `AddAuthentication().AddJwtBearer()` | Configure JWT validation in DI | `Program.cs` |
| `DepositRequest` vs `DepositCommand` | Client sends Request (no UserId), server builds Command (with UserId) | AccountController |
| **Frontend** | | |
| `localStorage` | Browser storage that persists across refreshes | JWT token, user info |
| `HttpInterceptorFn` | Intercept every outgoing HTTP request | `authInterceptor` (adds Bearer token) |
| `req.clone()` | Create copy of immutable HTTP request | Add Authorization header |
| `withInterceptors()` | Register interceptors in app config | `provideHttpClient(withInterceptors([...]))` |
| `CanActivateFn` | Guard that blocks route access | `authGuard` (redirect to login) |
| `canActivate` | Route property to apply guards | `{ path: 'dashboard', canActivate: [authGuard] }` |
| `inject()` | Functional DI (no constructor needed) | Used in interceptors and guards |
| `BehaviorSubject` + `localStorage` | Auth state that survives page refresh | AuthService `isLoggedIn$` |
| `bankService.refresh()` / `clear()` | Reset singleton state on user switch | SPA state management |
| **Testing** | | |
| `provideRouter([])` | Required in tests with `RouterLink` | Login/Register component specs |
| `toBeFalsy()` / `toBeTruthy()` | Vitest boolean matchers (not `toBeFalse`) | All Vitest specs |
