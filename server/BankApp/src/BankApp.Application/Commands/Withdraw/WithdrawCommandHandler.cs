using BankApp.Application.Interfaces;
using MediatR;

namespace BankApp.Application.Commands.Withdraw;

public class WithdrawCommandHandler : IRequestHandler<WithdrawCommand, decimal>
{
    private readonly IAccountRepository _accountRepository;

    public WithdrawCommandHandler(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }

    public async Task<decimal> Handle(WithdrawCommand request, CancellationToken cancellationToken)
    {
        var account = await _accountRepository.GetOrCreateDefaultAsync();
        account.Withdraw(request.Amount, request.Description);
        await _accountRepository.SaveChangesAsync();
        return account.Balance;
    }
}