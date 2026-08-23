using MediatR;

namespace BankApp.Application.Commands.Withdraw;

public record WithdrawCommand(decimal Amount, string Description) : IRequest<decimal>;