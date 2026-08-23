using BankApp.Application.Interfaces;
using MediatR;

namespace BankApp.Application.Queries.GetBalance;

public class GetBalanceQueryHandler : IRequestHandler<GetBalanceQuery, decimal>
{
    private readonly IAccountRepository _accountRepository;

    public GetBalanceQueryHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }

    public async Task<decimal> Handle(GetBalanceQuery request, CancellationToken cancellationToken)
    {
        var account = await _accountRepository.GetOrCreateDefaultAsync();
        return account.Balance;
    }
}