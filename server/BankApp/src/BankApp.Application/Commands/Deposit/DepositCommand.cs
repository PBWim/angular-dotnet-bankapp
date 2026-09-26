using BankApp.Domain.Enums;
using MediatR;

namespace BankApp.Application.Commands.Deposit;

public record DepositCommand(Guid UserId, AccountType AccountType, decimal Amount, string Description) : IRequest<decimal>;