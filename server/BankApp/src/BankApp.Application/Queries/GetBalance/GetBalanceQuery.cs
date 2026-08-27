using MediatR;

namespace BankApp.Application.Queries.GetBalance;

public record GetBalanceQuery(Guid UserId) : IRequest<decimal>;