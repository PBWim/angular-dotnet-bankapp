import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WithdrawComponent } from './withdraw.component';
import { BankService } from '../../services/bank.service';
import { Router } from '@angular/router';

describe('WithdrawComponent', () => {
  let component: WithdrawComponent;
  let fixture: ComponentFixture<WithdrawComponent>;
  let mockBankService: any;
  let mockRouter: any;

  beforeEach(async () => {
    // Arrange (shared setup)
    mockBankService = {
      withdraw: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [WithdrawComponent],
      providers: [
        { provide: BankService, useValue: mockRouter },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    // Fix: provide correct mock
    TestBed.overrideProvider(BankService, { useValue: mockBankService });

    fixture = TestBed.createComponent(WithdrawComponent);
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
    expect(component.withdrawForm.valid).toBeFalsy();
  });

  it('form should be invalid with zero amount', () => {
    // Act
    component.withdrawForm.patchValue({ amount: 0, description: 'Test' });

    // Assert
    expect(component.withdrawForm.valid).toBeFalsy();
  });

  it('form should be invalid with negative amount', () => {
    // Act
    component.withdrawForm.patchValue({ amount: -50, description: 'Test' });

    // Assert
    expect(component.withdrawForm.valid).toBeFalsy();
  });

  it('form should be valid with amount and description', () => {
    // Act
    component.withdrawForm.patchValue({ amount: 50, description: 'Groceries' });

    // Assert
    expect(component.withdrawForm.valid).toBeTruthy();
  });

  // ==================== Submit Tests ====================

  it('onSubmit should call bankService.withdraw with correct params', () => {
    // Arrange
    component.withdrawForm.patchValue({ amount: 50, description: 'Groceries' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockBankService.withdraw).toHaveBeenCalledWith(50, 'Groceries');
  });

  it('onSubmit should navigate to dashboard after withdraw', () => {
    // Arrange
    component.withdrawForm.patchValue({ amount: 50, description: 'Groceries' });

    // Act
    component.onSubmit();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('onSubmit should NOT call withdraw when form is invalid', () => {
    // Act
    component.onSubmit();

    // Assert
    expect(mockBankService.withdraw).not.toHaveBeenCalled();
  });

  it('onSubmit should NOT navigate when form is invalid', () => {
    // Act
    component.onSubmit();

    // Assert
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});