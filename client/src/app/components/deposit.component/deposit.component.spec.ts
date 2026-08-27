import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DepositComponent } from './deposit.component';
import { BankService } from '../../services/bank.service';
import { Router } from '@angular/router';

describe('DepositComponent', () => {
  let component: DepositComponent;
  let fixture: ComponentFixture<DepositComponent>;
  let mockBankService: any;
  let mockRouter: any;

  beforeEach(async () => {
    // Arrange (shared setup)
    mockBankService = {
      deposit: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DepositComponent],
      providers: [
        { provide: BankService, useValue: mockBankService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ==================== Creation ====================

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  // ==================== Form Validation ====================

  it('form should be invalid when empty', () => {
    // Assert
    expect(component.depositForm.valid).toBeFalsy();
  });

  it('form should be invalid with only amount', () => {
    // Act
    component.depositForm.patchValue({ amount: 100 });

    // Assert
    expect(component.depositForm.valid).toBeFalsy();
  });

  it('form should be invalid with only description', () => {
    // Act
    component.depositForm.patchValue({ description: 'Test' });

    // Assert
    expect(component.depositForm.valid).toBeFalsy();
  });

  it('form should be invalid with zero amount', () => {
    // Act
    component.depositForm.patchValue({ amount: 0, description: 'Test' });

    // Assert
    expect(component.depositForm.valid).toBeFalsy();
  });

  it('form should be invalid with negative amount', () => {
    // Act
    component.depositForm.patchValue({ amount: -50, description: 'Test' });

    // Assert
    expect(component.depositForm.valid).toBeFalsy();
  });

  it('form should be valid with amount and description', () => {
    // Act
    component.depositForm.patchValue({ amount: 100, description: 'Salary' });

    // Assert
    expect(component.depositForm.valid).toBeTruthy();
  });

  // ==================== Submit Tests ====================

  it('onSubmit should call bankService.deposit with correct params', () => {
    // Arrange
    component.depositForm.patchValue({ amount: 100, description: 'Salary' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockBankService.deposit).toHaveBeenCalledWith(100, 'Salary');
  });

  it('onSubmit should navigate to dashboard after deposit', () => {
    // Arrange
    component.depositForm.patchValue({ amount: 100, description: 'Salary' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('onSubmit should NOT call deposit when form is invalid', () => {
    // Act — form is empty, so invalid
    component.onSubmit();

    // Assert
    expect(mockBankService.deposit).not.toHaveBeenCalled();
  });

  it('onSubmit should NOT navigate when form is invalid', () => {
    // Act
    component.onSubmit();

    // Assert
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});