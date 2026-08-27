using BankApp.Application.DTOs;
using BankApp.Application.Interfaces;
using BankApp.Application.Queries.GetTransactions;
using BankApp.Domain.Entities;
using Moq;

namespace BankApp.Tests.Application
{
    public class GetTransactionsQueryHandlerTests
    {
        private readonly Mock<IAccountRepository> _mockRepo;
        private readonly GetTransactionsQueryHandler _handler;
        private readonly Account _account;

        public GetTransactionsQueryHandlerTests()
        {
            // Arrange (shared setup)
            _mockRepo = new Mock<IAccountRepository>();
            _account = new Account();

            _mockRepo.Setup(r => r.GetOrCreateDefaultAsync())
                     .ReturnsAsync(_account);

            _handler = new GetTransactionsQueryHandler(_mockRepo.Object);
        }

        [Fact]
        public async Task Handle_NoTransactions_ShouldReturnEmptyList()
        {
            // Arrange
            var query = new GetTransactionsQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public async Task Handle_WithTransactions_ShouldReturnCorrectCount()
        {
            // Arrange
            _account.Deposit(100, "First");
            _account.Withdraw(50, "Second");
            var query = new GetTransactionsQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task Handle_ShouldReturnTransactionDtos()
        {
            // Arrange
            _account.Deposit(100, "Salary");
            var query = new GetTransactionsQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            var dto = result.First();
            Assert.IsType<TransactionDto>(dto);
            Assert.Equal("deposit", dto.Type);
            Assert.Equal(100, dto.Amount);
            Assert.Equal("Salary", dto.Description);
        }

        [Fact]
        public async Task Handle_ShouldReturnNewestFirst()
        {
            // Arrange
            _account.Deposit(100, "First");
            _account.Deposit(200, "Second");
            _account.Deposit(300, "Third");
            var query = new GetTransactionsQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            var list = result.ToList();
            Assert.Equal("Third", list[0].Description);
            Assert.Equal("Second", list[1].Description);
            Assert.Equal("First", list[2].Description);
        }
    }
}
