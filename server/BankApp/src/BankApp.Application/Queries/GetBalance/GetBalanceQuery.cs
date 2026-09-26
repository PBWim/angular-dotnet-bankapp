using BankApp.Domain.Enums;
using MediatR;

namespace BankApp.Application.Queries.GetBalance;

public record GetBalanceQuery(Guid UserId, AccountType AccountType) : IRequest<decimal>;