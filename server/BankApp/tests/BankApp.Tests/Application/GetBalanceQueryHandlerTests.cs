using BankApp.Application.Interfaces;
using BankApp.Application.Queries.GetBalance;
using BankApp.Domain.Entities;
using Moq;

namespace BankApp.Tests.Application
{
    public class GetBalanceQueryHandlerTests
    {
        private readonly Mock<IAccountRepository> _mockRepo;
        private readonly GetBalanceQueryHandler _handler;
        private readonly Account _account;

        public GetBalanceQueryHandlerTests()
        {
            // Arrange (shared setup)
            _mockRepo = new Mock<IAccountRepository>();
            _account = new Account();

            _mockRepo.Setup(r => r.GetOrCreateDefaultAsync())
                     .ReturnsAsync(_account);

            _handler = new GetBalanceQueryHandler(_mockRepo.Object);
        }

        [Fact]
        public async Task Handle_NewAccount_ShouldReturnZero()
        {
            // Arrange
            var query = new GetBalanceQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.Equal(0, result);
        }

        [Fact]
        public async Task Handle_AfterDeposit_ShouldReturnCorrectBalance()
        {
            // Arrange
            _account.Deposit(250, "Setup");
            var query = new GetBalanceQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.Equal(250, result);
        }

        [Fact]
        public async Task Handle_AfterDepositAndWithdraw_ShouldReturnCorrectBalance()
        {
            // Arrange
            _account.Deposit(500, "Salary");
            _account.Withdraw(150, "Rent");
            var query = new GetBalanceQuery();

            // Act
            var result = await _handler.Handle(query, CancellationToken.None);

            // Assert
            Assert.Equal(350, result);
        }
    }
}
