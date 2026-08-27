using BankApp.Domain.Entities;

namespace BankApp.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}