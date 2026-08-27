using MediatR;

namespace BankApp.Application.Commands.Deposit;

public record DepositCommand(Guid UserId, decimal Amount, string Description) : IRequest<decimal>;