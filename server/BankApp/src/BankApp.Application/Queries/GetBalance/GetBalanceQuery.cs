using MediatR;

namespace BankApp.Application.Queries.GetBalance;

public record GetBalanceQuery() : IRequest<decimal>;