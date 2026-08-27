// 1. Imports — bring in testing tools and the things we're testing
import { TestBed } from '@angular/core/testing';
import { BankService } from './bank.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

// 2. describe — groups related tests (like a test class in xUnit)
// This is the equivalent of your xUnit test class: public class BankServiceTests { }
describe('BankService', () => {

    // Now let's add the setup. 
    let service: BankService;
    let mockApiService: any;

    // In xUnit you used the constructor — in Jasmine you use beforeEach:
    beforeEach(() => {
        // This is like your xUnit constructor — runs before EVERY test

        // Create a mock of ApiService (like new Mock<IAccountRepository> in C#)
        // Set default return values (like .Setup().ReturnsAsync() in Moq)
        mockApiService = {
            getBalance: vi.fn().mockReturnValue(of({ balance: 0 })), // Like .Setup(r => r.GetOrCreateDefaultAsync()).ReturnsAsync(account)
            getTransactions: vi.fn().mockReturnValue(of([])),
            deposit: vi.fn().mockReturnValue(of({})),
            withdraw: vi.fn().mockReturnValue(of({}))
        };

        // Set up DI (like builder.Services.AddScoped in Program.cs)
        // builder.Services.AddScoped<...>()
        TestBed.configureTestingModule({
            providers: [
                BankService,
                { provide: ApiService, useValue: mockApiService }
            ]
        });

        // Get the service instance (like DI resolving it)
        service = TestBed.inject(BankService); // Constructor injection
    });

    // Now let's write our first test together. Write this inside the describe block:
    // it() — defines a single test (like [Fact] in xUnit)
    // expect().toBeTruthy() — assertion (like Assert.NotNull() in xUnit)

    // ==================== Creation Tests ====================

    it('should be created', () => {
        // Assert
        expect(service).toBeTruthy();
    });

    it('should load balance on creation', () => {
        // Assert
        expect(mockApiService.getBalance).toHaveBeenCalled();
    });

    it('should load transactions on creation', () => {
        // Assert
        expect(mockApiService.getTransactions).toHaveBeenCalled();
    });

      // ==================== Balance Tests ====================

  it('should update balance$ from API response', () => {
    // Arrange
    mockApiService.getBalance.mockReturnValue(of({ balance: 500 }));

    // Act — recreate service to trigger constructor
    service = new BankService(mockApiService);

    // Assert
    let balance = 0;
    service.balance$.subscribe(b => balance = b);
    expect(balance).toBe(500);
  });

  // ==================== Deposit Tests ====================

  it('deposit should call ApiService.deposit with correct params', () => {
    // Act
    service.deposit(100, 'Test deposit');

    // Assert
    expect(mockApiService.deposit).toHaveBeenCalledWith(100, 'Test deposit');
  });

  it('deposit should reload balance after success', () => {
    // Act
    service.deposit(100, 'Test deposit');

    // Assert — called once in constructor + once after deposit
    expect(mockApiService.getBalance).toHaveBeenCalledTimes(2);
  });

  it('deposit should reload transactions after success', () => {
    // Act
    service.deposit(100, 'Test deposit');

    // Assert
    expect(mockApiService.getTransactions).toHaveBeenCalledTimes(2);
  });

  // ==================== Withdraw Tests ====================

  it('withdraw should call ApiService.withdraw with correct params', () => {
    // Act
    service.withdraw(50, 'Test withdrawal');

    // Assert
    expect(mockApiService.withdraw).toHaveBeenCalledWith(50, 'Test withdrawal');
  });

  it('withdraw should reload balance after success', () => {
    // Act
    service.withdraw(50, 'Test withdrawal');

    // Assert
    expect(mockApiService.getBalance).toHaveBeenCalledTimes(2);
  });

  it('withdraw should reload transactions after success', () => {
    // Act
    service.withdraw(50, 'Test withdrawal');

    // Assert
    expect(mockApiService.getTransactions).toHaveBeenCalledTimes(2);
  });

});