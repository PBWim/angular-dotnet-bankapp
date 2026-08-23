# Angular-DotNet-BankApp

A full-stack banking application built with **Angular** and **.NET**, designed as a hands-on learning project that evolves from a simple frontend prototype into a production-grade system.

## Project Overview

This project simulates core banking operations — deposits, withdrawals, and transaction tracking — starting with a minimal frontend and progressively layering in backend services, authentication, and advanced features.

## Phase 1 — Frontend Only (Complete)

A single-user, single-account banking interface built entirely in Angular with in-memory data.

### Features

- **Dashboard** — View current account balance at a glance
- **Deposit** — Add funds with an amount and description
- **Withdraw** — Remove funds with overdraft validation
- **Transaction History** — Chronological list of all transactions showing date, type, description, and amount

### Angular Concepts Covered

- Project structure and modules
- Components (dashboard, deposit, withdraw, transaction list)
- Reactive forms with validation
- Services for shared state management
- Routing and navigation
- Pipes for currency and date formatting
- Component communication

## Phase 2 — .NET Backend (Complete)

Full-stack integration with a .NET 8 Web API backend. Data is now persisted in SQL Server — no more in-memory state.

### Features

- **REST API** — Deposit, withdraw, get balance, and transaction history endpoints
- **Persistent Data** — All transactions and balances stored in SQL Server via Entity Framework Core
- **Clean Architecture** — Domain, Application, Infrastructure, and API layers with clear separation of concerns
- **DDD** — Rich domain entities with encapsulated business logic and private setters
- **CQRS** — Commands (deposit, withdraw) separated from queries (balance, transactions) using MediatR
- **Angular-to-API Integration** — Frontend now calls the .NET backend via HttpClient

### .NET Concepts Covered

- Clean Architecture (4-project structure)
- Domain-Driven Design (rich entities, encapsulation)
- CQRS with MediatR (commands and queries)
- Entity Framework Core 8 (code-first, configurations, backing field pattern)
- Repository pattern
- Dependency injection
- CORS configuration
- Auto-migration and database seeding

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Frontend only — Angular fundamentals, in-memory data | ✅ Complete |
| **Phase 2** | Add .NET backend — Web API, Entity Framework, SQL Server | ✅ Complete |
| **Phase 3** | Auth & multi-account — JWT authentication, savings/checking accounts, transfers | Upcoming |
| **Phase 4** | Advanced features — Spending analytics, recurring payments, multi-currency, admin panel | Upcoming |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21 |
| Backend | .NET 8 Web API |
| Database | SQL Server LocalDB |
| ORM | Entity Framework Core 8 |
| Mediator | MediatR |
| Architecture | Clean Architecture + DDD + CQRS |
| Auth | JWT *(Phase 3)* |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Angular CLI](https://angular.dev/tools/cli)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- SQL Server LocalDB (included with Visual Studio)

### Run the Backend

```bash
cd server/BankApp/src/BankApp.API
dotnet run
```

The API starts at `https://localhost:7160`. The database is created and migrated automatically on startup.

### Run the Frontend

```bash
cd client
npm install
ng serve
```

Navigate to `http://localhost:4200/`.

## License

This project is for educational purposes.
