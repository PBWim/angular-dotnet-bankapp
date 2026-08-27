using BankApp.Application.DTOs;
using BankApp.Application.Interfaces;
using MediatR;

namespace BankApp.Application.Queries.GetTransactions;

public class GetTransactionsQueryHandler : IRequestHandler<GetTransactionsQuery, List<TransactionDto>>
{
    private readonly IAccountRepository _accountRepository;

    public GetTransactionsQueryHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }

    public async Task<List<TransactionDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var account = await _accountRepository.GetByUserIdAsync(request.UserId) ?? throw new InvalidOperationException("Account not found.");
        return account.Transactions
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto(
                t.Id,
                t.Type,
                t.Amount,
                t.Description,
                t.BalanceAfter,
                t.CreatedAt
            ))
            .ToList();
    }
}