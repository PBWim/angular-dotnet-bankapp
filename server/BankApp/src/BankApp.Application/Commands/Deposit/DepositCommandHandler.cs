using BankApp.Application.Interfaces;
using MediatR;

namespace BankApp.Application.Commands.Deposit;

public class DepositCommandHandler : IRequestHandler<DepositCommand, decimal>
{
    private readonly IAccountRepository _accountRepository;

    public DepositCommandHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }

    public async Task<decimal> Handle(DepositCommand request, CancellationToken cancellationToken)
    {
        var account = await _accountRepository.GetOrCreateDefaultAsync();
        account.Deposit(request.Amount, request.Description);
        await _accountRepository.SaveChangesAsync();
        return account.Balance;
    }
}