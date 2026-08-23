using BankApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BankApp.Infrastructure.Data;

public class BankDbContext : DbContext
{
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Transaction> Transactions => Set<Transaction>();

    public BankDbContext(DbContextOptions<BankDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BankDbContext).Assembly);
    }
}