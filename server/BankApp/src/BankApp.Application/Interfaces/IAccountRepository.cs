using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces;

public interface IAccountRepository
{
    Task<Account?> GetByIdAsync(Guid id);
    Task<Account> GetOrCreateDefaultAsync();
    Task SaveChangesAsync();
}