using BankApp.Application.DTOs;
using BankApp.Domain.Enums;
using MediatR;

namespace BankApp.Application.Queries.GetTransactions;

public record GetTransactionsQuery(Guid UserId, AccountType AccountType) : IRequest<List<TransactionDto>>;