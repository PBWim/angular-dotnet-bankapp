using BankApp.Application.Commands.Deposit;
using BankApp.Application.Interfaces;
using BankApp.Domain.Entities;
using Moq;

namespace BankApp.Tests.Application
{
    public class DepositCommandHandlerTests
    {
        private readonly Mock<IAccountRepository> _mockRepo;
        private readonly DepositCommandHandler _handler;
        private readonly Account _account;

        public DepositCommandHandlerTests()
        {
            // Arrange (shared setup)
            _mockRepo = new Mock<IAccountRepository>();
            _account = new Account();

            _mockRepo.Setup(r => r.GetOrCreateDefaultAsync())
                     .ReturnsAsync(_account);

            _handler = new DepositCommandHandler(_mockRepo.Object);
        }

        [Fact]
        public async Task Handle_ValidDeposit_ShouldIncreaseBalance()
        {
            // Arrange
            var command = new DepositCommand(100, "Salary");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Equal(100, _account.Balance);
        }

        [Fact]
        public async Task Handle_ValidDeposit_ShouldCreateTransaction()
        {
            // Arrange
            var command = new DepositCommand(100, "Salary");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.Single(_account.Transactions);
            var txn = _account.Transactions.First();
            Assert.Equal("deposit", txn.Type);
            Assert.Equal(100, txn.Amount);
            Assert.Equal("Salary", txn.Description);
        }

        [Fact]
        public async Task Handle_ValidDeposit_ShouldCallSaveChanges()
        {
            // Arrange
            var command = new DepositCommand(100, "Salary");

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            _mockRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_MultipleDeposits_ShouldAccumulateBalance()
        {
            // Arrange
            var command1 = new DepositCommand(100, "First");
            var command2 = new DepositCommand(50, "Second");

            // Act
            await _handler.Handle(command1, CancellationToken.None);
            await _handler.Handle(command2, CancellationToken.None);

            // Assert
            Assert.Equal(150, _account.Balance);
        }

        [Fact]
        public async Task Handle_ZeroAmount_ShouldThrowArgumentException()
        {
            // Arrange
            var command = new DepositCommand(0, "Bad deposit");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _handler.Handle(command, CancellationToken.None));
        }

        [Fact]
        public async Task Handle_NegativeAmount_ShouldThrowArgumentException()
        {
            // Arrange
            var command = new DepositCommand(-50, "Bad deposit");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _handler.Handle(command, CancellationToken.None));
        }

        [Fact]
        public async Task Handle_ZeroAmount_ShouldNotCallSaveChanges()
        {
            // Arrange
            var command = new DepositCommand(0, "Bad deposit");

            // Act
            try { await _handler.Handle(command, CancellationToken.None); } catch { }

            // Assert
            _mockRepo.Verify(r => r.SaveChangesAsync(), Times.Never);
        }
    }
}
