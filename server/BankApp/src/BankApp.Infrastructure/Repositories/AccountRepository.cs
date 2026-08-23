using BankApp.Application.Interfaces;
using BankApp.Domain.Entities;
using BankApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly BankDbContext _context;

    public AccountRepository(BankDbContext context)
    {
        _context = context;
    }

    public async Task<Account?> GetByIdAsync(Guid id)
    {
        return await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<Account> GetOrCreateDefaultAsync()
    {
        var account = await _context.Accounts
            .Include(a => a.Transactions)
            .FirstAsync();

        return account;
    }

    public async Task SaveChangesAsync()
    {
        // Fix: EF Core doesn't know transactions added via backing field are NEW
        var accounts = _context.ChangeTracker.Entries<Account>()
            .Select(e => e.Entity);

        foreach (var account in accounts)
        {
            foreach (var transaction in account.Transactions)
            {
                var entry = _context.Entry(transaction);
                if (entry.State == EntityState.Modified || entry.State == EntityState.Detached)
                {
                    entry.State = EntityState.Added;
                }
            }
        }

        await _context.SaveChangesAsync();
    }
}