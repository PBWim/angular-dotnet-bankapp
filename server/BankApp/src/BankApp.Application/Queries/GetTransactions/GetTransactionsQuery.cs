using BankApp.Application.DTOs;
using MediatR;

namespace BankApp.Application.Queries.GetTransactions;

public record GetTransactionsQuery(Guid UserId) : IRequest<List<TransactionDto>>;