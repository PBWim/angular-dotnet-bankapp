namespace BankApp.Application.DTOs;

public record TransactionDto(
    Guid Id,
    string Type,
    decimal Amount,
    string Description,
    decimal BalanceAfter,
    DateTime CreatedAt
);