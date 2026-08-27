using MediatR;

namespace BankApp.Application.Commands.Withdraw;

public record WithdrawCommand(Guid UserId, decimal Amount, string Description) : IRequest<decimal>;