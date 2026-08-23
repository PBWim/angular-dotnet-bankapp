namespace BankApp.Domain.Entities;

public class Account
{
    public Guid Id { get; private set; }
    public decimal Balance { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private readonly List<Transaction> _transactions = new();
    public IReadOnlyCollection<Transaction> Transactions => _transactions.AsReadOnly();

    public Account()
    {
        Id = Guid.NewGuid();
        Balance = 0;
        CreatedAt = DateTime.UtcNow;
    }

    public void Deposit(decimal amount, string description)
    {
        if (amount <= 0)
            throw new ArgumentException("Deposit amount must be positive.");

        Balance += amount;
        _transactions.Add(new Transaction(Id, "deposit", amount, description, Balance));
    }

    public void Withdraw(decimal amount, string description)
    {
        if (amount <= 0)
            throw new ArgumentException("Withdrawal amount must be positive.");

        if (amount > Balance)
            throw new InvalidOperationException("Insufficient funds.");

        Balance -= amount;
        _transactions.Add(new Transaction(Id, "withdraw", amount, description, Balance));
    }
}