# Angular-DotNet-BankApp

A full-stack banking application built with **Angular** and **.NET**, designed as a hands-on learning project that evolves from a simple frontend prototype into a production-grade system.

## Project Overview

This project simulates core banking operations — deposits, withdrawals, and transaction tracking — starting with a minimal frontend and progressively layering in backend services, authentication, and advanced features.

## Phase 1 — Frontend Only (Current)

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

> **Note:** Data is stored in memory only. Refreshing the page will reset all data. Persistence is introduced in Phase 2.

## Roadmap

| Phase | Scope | Key Additions |
|-------|-------|---------------|
| **Phase 1** | Frontend only | Angular fundamentals, in-memory data |
| **Phase 2** | Add .NET backend | Web API, Entity Framework, SQLite/SQL Server |
| **Phase 3** | Auth & multi-account | JWT authentication, savings/checking accounts, transfers |
| **Phase 4** | Advanced features | Spending analytics, recurring payments, multi-currency, admin panel |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular |
| Backend | .NET Web API *(Phase 2+)* |
| Database | SQLite / SQL Server *(Phase 2+)* |
| Auth | JWT *(Phase 3+)* |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Angular CLI](https://angular.dev/tools/cli)

### Run the Application

```bash
# Install dependencies
npm install

# Start the development server
ng serve
```

Navigate to `http://localhost:4200/`.

## License

This project is for educational purposes.
