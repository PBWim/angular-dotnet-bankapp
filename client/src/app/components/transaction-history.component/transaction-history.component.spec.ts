import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TransactionHistoryComponent } from './transaction-history.component';
import { BankService } from '../../services/bank.service';
import { BehaviorSubject } from 'rxjs';
import { Transaction } from '../../models/transaction.model';

describe('TransactionHistoryComponent', () => {
  let component: TransactionHistoryComponent;
  let fixture: ComponentFixture<TransactionHistoryComponent>;
  let mockBankService: any;
  let transactionsSubject: BehaviorSubject<Transaction[]>;

  beforeEach(async () => {
    // Arrange (shared setup)
    transactionsSubject = new BehaviorSubject<Transaction[]>([]);

    mockBankService = {
      transactions$: transactionsSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [TransactionHistoryComponent],
      providers: [
        { provide: BankService, useValue: mockBankService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ==================== Creation ====================

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  // ==================== Empty State ====================

  it('should show no transactions initially', () => {
    // Arrange
    const compiled = fixture.nativeElement as HTMLElement;

    // Assert — no transaction rows rendered
    expect(compiled.querySelectorAll('.transaction').length).toBe(0);
  });

  // ==================== Display Tests ====================

  it('should display transactions when data is available', () => {
    // Arrange
    const mockTransactions: Transaction[] = [
      { id: 1, type: 'deposit', amount: 100, description: 'Salary', date: new Date(), balance: 100 },
      { id: 2, type: 'withdraw', amount: 50, description: 'Groceries', date: new Date(), balance: 50 }
    ];

    // Act
    transactionsSubject.next(mockTransactions);
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Salary');
    expect(compiled.textContent).toContain('Groceries');
  });

  it('should display transaction amounts', () => {
    // Arrange
    const mockTransactions: Transaction[] = [
      { id: 1, type: 'deposit', amount: 250, description: 'Bonus', date: new Date(), balance: 250 }
    ];

    // Act
    transactionsSubject.next(mockTransactions);
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('$250.00');
  });

  it('should display deposit type', () => {
    // Arrange
    const mockTransactions: Transaction[] = [
      { id: 1, type: 'deposit', amount: 100, description: 'Test', date: new Date(), balance: 100 }
    ];

    // Act
    transactionsSubject.next(mockTransactions);
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Deposit');
  });

  it('should display withdraw type', () => {
    // Arrange
    const mockTransactions: Transaction[] = [
      { id: 1, type: 'withdraw', amount: 50, description: 'Test', date: new Date(), balance: 50 }
    ];

    // Act
    transactionsSubject.next(mockTransactions);
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Withdrawal');
  });
  
  it('should update when new transactions are pushed', () => {
    // Arrange — start with one
    transactionsSubject.next([
      { id: 1, type: 'deposit', amount: 100, description: 'First', date: new Date(), balance: 100 }
    ]);
    fixture.detectChanges();

    // Act — push two
    transactionsSubject.next([
      { id: 2, type: 'withdraw', amount: 50, description: 'Second', date: new Date(), balance: 50 },
      { id: 1, type: 'deposit', amount: 100, description: 'First', date: new Date(), balance: 100 }
    ]);
    fixture.detectChanges();

    // Assert
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('First');
    expect(compiled.textContent).toContain('Second');
  });
});