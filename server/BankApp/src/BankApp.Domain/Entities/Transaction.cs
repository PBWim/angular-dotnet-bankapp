namespace BankApp.Domain.Entities;

public class Transaction
{
    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public string Type { get; private set; }
    public decimal Amount { get; private set; }
    public string Description { get; private set; }
    public decimal BalanceAfter { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Transaction() { }  // EF Core needs this

    public Transaction(Guid accountId, string type, decimal amount, string description, decimal balanceAfter)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Type = type;
        Amount = amount;
        Description = description;
        BalanceAfter = balanceAfter;
        CreatedAt = DateTime.UtcNow;
    }
}