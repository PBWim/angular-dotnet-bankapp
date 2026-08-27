using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces;

public interface IAccountRepository
{
    Task<Account?> GetByIdAsync(Guid id);
    Task<Account?> GetByUserIdAsync(Guid userId);
    Task SaveChangesAsync();
}