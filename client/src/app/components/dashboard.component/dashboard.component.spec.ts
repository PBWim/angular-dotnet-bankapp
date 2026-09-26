import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { BankService } from '../../services/bank.service';
import { BehaviorSubject } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>; // Wraps the component + its template for testing
  let mockBankService: any;
  let balanceSubject: BehaviorSubject<number>; // We control when and what value balance$ emits. Instead of mocking BankService with vi.fn(), we use a real BehaviorSubject so we can push new values during the test and verify the template updates.
  let accountTypeSubject: BehaviorSubject<string>;

  beforeEach(async () => {
    // Arrange (shared setup)
    balanceSubject = new BehaviorSubject<number>(0);
    accountTypeSubject = new BehaviorSubject<string>('Checking');

    mockBankService = {
      balance$: balanceSubject.asObservable(),
      activeAccountType$: accountTypeSubject.asObservable(),
      switchAccount: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: BankService, useValue: mockBankService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();  // Triggers initial rendering
  });

  // ==================== Creation ====================

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  // ==================== Display Tests ====================

  it('should display zero balance initially', () => {
    // Arrange
    const compiled = fixture.nativeElement as HTMLElement; // 	The rendered HTML DOM element

    // Assert
    expect(compiled.textContent).toContain('$0.00');
  });

  it('should display updated balance when balance$ changes', () => {
    // Act
    balanceSubject.next(500);
    fixture.detectChanges();  // Re-render the template. Tells Angular to re-render the template

    // Assert
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('$500.00');
  });

  it('should display the dashboard title', () => {
    // Arrange
    const compiled = fixture.nativeElement as HTMLElement;

    // Assert
    expect(compiled.textContent).toContain('Account Dashboard');
  });

  // ==================== Account Switcher Tests ====================

it('should display Checking and Savings buttons', () => {
    // Arrange
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.account-switcher button');

    // Assert
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toBe('Checking');
    expect(buttons[1].textContent?.trim()).toBe('Savings');
});

it('should highlight active account type button', () => {
    // Arrange — default is Checking
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.account-switcher button');

    // Assert
    expect(buttons[0].classList.contains('active')).toBe(true);
    expect(buttons[1].classList.contains('active')).toBe(false);
});

it('should highlight Savings button when account type changes', () => {
    // Act
    accountTypeSubject.next('Savings');
    fixture.detectChanges();

    // Arrange
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.account-switcher button');

    // Assert
    expect(buttons[0].classList.contains('active')).toBe(false);
    expect(buttons[1].classList.contains('active')).toBe(true);
});

it('switchAccount should call BankService.switchAccount', () => {
    // Act
    component.switchAccount('Savings');

    // Assert
    expect(mockBankService.switchAccount).toHaveBeenCalledWith('Savings');
});

it('clicking Savings button should call switchAccount', () => {
    // Arrange
    const compiled = fixture.nativeElement as HTMLElement;
    const savingsButton = compiled.querySelectorAll('.account-switcher button')[1] as HTMLElement;

    // Act
    savingsButton.click();
    fixture.detectChanges();

    // Assert
    expect(mockBankService.switchAccount).toHaveBeenCalledWith('Savings');
});
});