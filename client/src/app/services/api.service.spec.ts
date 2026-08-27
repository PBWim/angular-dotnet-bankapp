import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController; // Instead of mocking HttpClient directly, Angular provides a test utility that intercepts HTTP calls. No real requests go out.
  const baseUrl = 'https://localhost:7160/api';

  beforeEach(() => {
    // Arrange (shared setup)
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()  // Intercepts real HTTP calls
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify no unexpected HTTP calls were made
    httpMock.verify();
  });

  // ==================== Creation ====================

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  // ==================== getBalance ====================

  it('getBalance should make GET request to /account/balance', () => {
    // Act
    service.getBalance().subscribe();

    // Assert
    const req = httpMock.expectOne(`${baseUrl}/account/balance`);
    expect(req.request.method).toBe('GET');
    req.flush({ balance: 100 });
  });

  it('getBalance should return balance data', () => {
    // Act & Assert
    service.getBalance().subscribe(response => {
      expect(response.balance).toBe(250);
    });

    const req = httpMock.expectOne(`${baseUrl}/account/balance`);
    req.flush({ balance: 250 });
  });

  // ==================== deposit ====================

  it('deposit should make POST request to /account/deposit', () => {
    // Act
    service.deposit(100, 'Salary').subscribe();

    // Assert
    const req = httpMock.expectOne(`${baseUrl}/account/deposit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 100, description: 'Salary' });
    req.flush({});
  });

  // ==================== withdraw ====================

  it('withdraw should make POST request to /account/withdraw', () => {
    // Act
    service.withdraw(50, 'Groceries').subscribe();

    // Assert
    const req = httpMock.expectOne(`${baseUrl}/account/withdraw`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 50, description: 'Groceries' });
    req.flush({});
  });

  // ==================== getTransactions ====================

  it('getTransactions should make GET request to /transaction', () => {
    // Act
    service.getTransactions().subscribe();

    // Assert
    const req = httpMock.expectOne(`${baseUrl}/transaction`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getTransactions should return transaction array', () => {
    // Arrange
    const mockTransactions = [
      { id: 1, type: 'deposit', amount: 100, description: 'Test', date: new Date(), balance: 100 }
    ];

    // Act & Assert
    service.getTransactions().subscribe(transactions => {
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe('deposit');
    });

    const req = httpMock.expectOne(`${baseUrl}/transaction`);
    req.flush(mockTransactions);
  });
});