import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      login: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Arrange — component created with mocked dependencies

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    // Assert
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should be invalid with invalid email', () => {
    // Arrange
    component.loginForm.controls['email'].setValue('not-an-email');
    component.loginForm.controls['password'].setValue('password123');

    // Assert
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should be valid with correct email and password', () => {
    // Arrange
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password123');

    // Assert
    expect(component.loginForm.valid).toBeTruthy();
  });

  it('should call authService.login on valid submit', () => {
    // Arrange
    component.loginForm.controls['email'].setValue('test@test.com');
    component.loginForm.controls['password'].setValue('password123');

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.login).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('should not call login on invalid submit', () => {
    // Arrange — form is empty (invalid)

    // Act
    component.onSubmit();

    // Assert
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });
});