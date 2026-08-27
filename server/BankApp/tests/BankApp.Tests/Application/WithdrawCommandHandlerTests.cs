using BankApp.Application.Commands.Withdraw;
using BankApp.Application.Interfaces;
using BankApp.Domain.Entities;
using Moq;

namespace BankApp.Tests.Application
{
    public class WithdrawCommandHandlerTests
    {
        private readonly Mock<IAccountRepository> _mockRepo;
        private readonly WithdrawCommandHandler _handler;
        private readonly Account _account;

        public WithdrawCommandHandlerTests()
        {
            // Arrange (shared setup)
            _mockRepo = new Mock<IAccountRepository>();
            _account = new Account();

            _mockRepo.Setup(r => r.GetOrCreateDefaultAsync())
                     .ReturnsAsync(_account);

            _handler = new WithdrawCommandHandler(_mockRepo.Object);
        }

        [Fact]
        public async Task Handle_ValidWithdraw_ShouldDecreaseBalance()
        {
            // Arrange
            _account.Deposit(200, "Setup");
            var command = new WithdrawCommand(50, "Groceries");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(150, _account.Balance);
        }

        [Fact]
        public async Task Handle_ValidWithdraw_ShouldCreateTransaction()
        {
            // Arrange
            _account.Deposit(200, "Setup");
            var command = new WithdrawCommand(50, "Groceries");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            var txn = _account.Transactions.Last();
            Assert.Equal("withdraw", txn.Type);
            Assert.Equal(50, txn.Amount);
            Assert.Equal("Groceries", txn.Description);
            Assert.Equal(150, txn.BalanceAfter);
        }

        [Fact]
        public async Task Handle_ValidWithdraw_ShouldCallSaveChanges()
        {
            // Arrange
            _account.Deposit(200, "Setup");
            var command = new WithdrawCommand(50, "Groceries");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            _mockRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_ExceedsBalance_ShouldThrowInvalidOperationException()
        {
            // Arrange
            _account.Deposit(100, "Setup");
            var command = new WithdrawCommand(150, "Too much");

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _handler.Handle(command, CancellationToken.None));
        }

        [Fact]
        public async Task Handle_ExceedsBalance_ShouldNotCallSaveChanges()
        {
            // Arrange
            _account.Deposit(100, "Setup");
            var command = new WithdrawCommand(150, "Too much");

            // Act
            try { await _handler.Handle(command, CancellationToken.None); } catch { }

            // Assert
            _mockRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        public async Task Handle_ExactBalance_ShouldResultInZero()
        {
            // Arrange
            _account.Deposit(100, "Setup");
            var command = new WithdrawCommand(100, "All of it");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(0, _account.Balance);
        }

        [Fact]
        public async Task Handle_ZeroAmount_ShouldThrowArgumentException()
        {
            // Arrange
            _account.Deposit(100, "Setup");
            var command = new WithdrawCommand(0, "Bad withdrawal");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _handler.Handle(command, CancellationToken.None));
        }

        [Fact]
        public async Task Handle_NegativeAmount_ShouldThrowArgumentException()
        {
            // Arrange
            _account.Deposit(100, "Setup");
            var command = new WithdrawCommand(-50, "Bad withdrawal");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _handler.Handle(command, CancellationToken.None));
        }

        [Fact]
        public async Task Handle_FromZeroBalance_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var command = new WithdrawCommand(50, "From empty");

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _handler.Handle(command, CancellationToken.None));
        }
    }
}
