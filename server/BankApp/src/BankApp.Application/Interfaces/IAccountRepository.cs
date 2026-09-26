using BankApp.Domain.Entities;
using BankApp.Domain.Enums;

namespace BankApp.Application.Interfaces;

public interface IAccountRepository
{
    Task<Account?> GetByIdAsync(Guid id);
    Task<Account?> GetByUserIdAsync(Guid userId);
    Task<Account?> GetByUserIdAndTypeAsync(Guid userId, AccountType type);
    Task SaveChangesAsync();
}