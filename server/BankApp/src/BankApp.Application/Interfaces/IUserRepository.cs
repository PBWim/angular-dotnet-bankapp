using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User> AddAsync(User user);
    Task SaveChangesAsync();
}