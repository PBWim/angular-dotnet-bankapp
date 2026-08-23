# BankApp — .NET Backend

A .NET 8 Web API for the BankApp project, built with **Clean Architecture**, **Domain-Driven Design (DDD)**, and **CQRS** using MediatR.

## Architecture

```
server/BankApp/src/
├── BankApp.Domain           ← Core business logic (entities, rules)
│   └── Entities/
│       ├── Account.cs       ← Rich domain entity (deposit/withdraw logic)
│       └── Transaction.cs   ← Value-like entity, created by Account
│
├── BankApp.Application      ← Use cases (commands, queries, DTOs)
│   ├── Commands/
│   │   ├── Deposit/         ← DepositCommand + Handler
│   │   └── Withdraw/        ← WithdrawCommand + Handler
│   ├── Queries/
│   │   ├── GetBalance/      ← GetBalanceQuery + Handler
│   │   └── GetTransactions/ ← GetTransactionsQuery + Handler
│   ├── DTOs/
│   │   └── TransactionDto.cs
│   └── Interfaces/
│       └── IAccountRepository.cs
│
├── BankApp.Infrastructure   ← Data access (EF Core, repositories)
│   ├── Data/
│   │   └── BankDbContext.cs
│   ├── Configurations/
│   │   ├── AccountConfiguration.cs
│   │   └── TransactionConfiguration.cs
│   └── Repositories/
│       └── AccountRepository.cs
│
└── BankApp.API              ← Entry point (controllers, DI setup)
    ├── Controllers/
    │   ├── AccountController.cs
    │   └── TransactionController.cs
    └── Program.cs
```

### Design Decisions

**Clean Architecture** — Dependencies point inward. Domain has zero dependencies. Application depends on Domain. Infrastructure implements Application interfaces. API wires everything together.

**DDD** — Business rules live in domain entities, not in services or controllers. `Account.Deposit()` and `Account.Withdraw()` enforce validation and create transactions internally. Private setters protect invariants.

**CQRS** — Commands (deposit, withdraw) are separated from queries (get balance, get transactions) using MediatR. Each has its own handler with a single responsibility.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | .NET 8 |
| ORM | Entity Framework Core 8 |
| Database | SQL Server LocalDB |
| Mediator | MediatR |
| Architecture | Clean Architecture + DDD + CQRS |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- SQL Server LocalDB (included with Visual Studio)

## Getting Started

```bash
cd server/BankApp/src/BankApp.API
dotnet run
```

The API starts at `https://localhost:7160`. The database is created and migrated automatically on startup — no manual migration needed.

## API Endpoints

### Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/account/balance` | Get current account balance |
| POST | `/api/account/deposit` | Deposit funds |
| POST | `/api/account/withdraw` | Withdraw funds |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | Get all transactions (newest first) |

### Request Examples

**Deposit**
```json
POST /api/account/deposit
{
  "amount": 100.00,
  "description": "Salary payment"
}
```

**Withdraw**
```json
POST /api/account/withdraw
{
  "amount": 50.00,
  "description": "Grocery shopping"
}
```

### Response Examples

**GET /api/account/balance**
```json
150.00
```

**GET /api/transactions**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "withdraw",
    "amount": 50.00,
    "description": "Grocery shopping",
    "balanceAfter": 150.00,
    "createdAt": "2026-08-23T10:30:00Z"
  },
  {
    "id": "1ca85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "deposit",
    "amount": 200.00,
    "description": "Salary payment",
    "balanceAfter": 200.00,
    "createdAt": "2026-08-23T10:00:00Z"
  }
]
```

## CORS

The API allows requests from `http://localhost:4200` (Angular dev server) via the configured CORS policy in `Program.cs`.
