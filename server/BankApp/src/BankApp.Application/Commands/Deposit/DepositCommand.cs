using MediatR;

namespace BankApp.Application.Commands.Deposit;

public record DepositCommand(decimal Amount, string Description) : IRequest<decimal>;