using BankApp.Domain.Enums;
using MediatR;

namespace BankApp.Application.Commands.Withdraw;

public record WithdrawCommand(Guid UserId, AccountType AccountType, decimal Amount, string Description) : IRequest<decimal>;