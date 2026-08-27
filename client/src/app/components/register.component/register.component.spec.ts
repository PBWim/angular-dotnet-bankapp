import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      register: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should be invalid when password is too short', () => {
    // Arrange
    component.registerForm.controls['firstName'].setValue('Paa');
    component.registerForm.controls['lastName'].setValue('W');
    component.registerForm.controls['email'].setValue('test@test.com');
    component.registerForm.controls['password'].setValue('123');

    // Assert
    expect(component.registerForm.valid).toBeFalsy();
  });

  it('should be valid with all fields filled correctly', () => {
    // Arrange
    component.registerForm.controls['firstName'].setValue('Paa');
    component.registerForm.controls['lastName'].setValue('W');
    component.registerForm.controls['email'].setValue('test@test.com');
    component.registerForm.controls['password'].setValue('password123');

    // Assert
    expect(component.registerForm.valid).toBeTruthy();
  });

  it('should call authService.register on valid submit', () => {
    // Arrange
    component.registerForm.controls['firstName'].setValue('Paa');
    component.registerForm.controls['lastName'].setValue('W');
    component.registerForm.controls['email'].setValue('test@test.com');
    component.registerForm.controls['password'].setValue('password123');

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.register).toHaveBeenCalledWith('test@test.com', 'password123', 'Paa', 'W');
  });

  it('should not call register on invalid submit', () => {
    // Arrange — form is empty (invalid)

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });
});