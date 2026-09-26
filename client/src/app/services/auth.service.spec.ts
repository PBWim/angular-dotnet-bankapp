import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { AuthEventService } from './auth-event.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {

  let service: AuthService;
  let mockApiService: any;
  let mockRouter: any;
  let mockAuthEventService: any;

  // Mock API response — same shape as your backend returns
  const mockLoginResponse = {
    token: 'fake-jwt-token',
    email: 'test@test.com',
    firstName: 'John'
  };

  beforeEach(() => {
    // Clear localStorage before each test so tests don't leak state
    localStorage.clear();

    mockApiService = {
      login: vi.fn().mockReturnValue(of(mockLoginResponse)),
      register: vi.fn().mockReturnValue(of(mockLoginResponse))
    };

    // Router mock — like Mock<IMediator> in C#, we only mock what we use
    mockRouter = {
      navigate: vi.fn()
    };

    mockAuthEventService = {
      emitLogin: vi.fn(),
      emitLogout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: mockApiService },
        { provide: Router, useValue: mockRouter },
        { provide: AuthEventService, useValue: mockAuthEventService }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  // Clean up localStorage after all tests
  afterEach(() => {
    localStorage.clear();
  });

  // ==================== Creation Tests ====================

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should start as logged out when no token exists', () => {
    // Assert
    let isLoggedIn = true;
    service.isLoggedIn$.subscribe(val => isLoggedIn = val);
    expect(isLoggedIn).toBe(false);
  });

  // ==================== Login Tests ====================

  it('login should call ApiService.login with correct params', () => {
    // Act
    service.login('test@test.com', 'password123');

    // Assert
    expect(mockApiService.login).toHaveBeenCalledWith('test@test.com', 'password123');
  });

  it('login should store token in localStorage', () => {
    // Act
    service.login('test@test.com', 'password123');

    // Assert
    expect(localStorage.getItem('bankapp_token')).toBe('fake-jwt-token');
  });

  it('login should store user info in localStorage', () => {
    // Act
    service.login('test@test.com', 'password123');

    // Assert
    const storedUser = JSON.parse(localStorage.getItem('bankapp_user')!);
    expect(storedUser.email).toBe('test@test.com');
    expect(storedUser.firstName).toBe('John');
  });

  it('login should update isLoggedIn$ to true', () => {
    // Act
    service.login('test@test.com', 'password123');

    // Assert
    let isLoggedIn = false;
    service.isLoggedIn$.subscribe(val => isLoggedIn = val);
    expect(isLoggedIn).toBe(true);
  });

  it('login should navigate to dashboard', () => {
    // Act
    service.login('test@test.com', 'password123');

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('login should emit login event via AuthEventService', () => {
    // Act
    service.login('test@test.com', 'password123');

    // Assert
    expect(mockAuthEventService.emitLogin).toHaveBeenCalled();
  });

  it('login should not navigate on API error', () => {
    // Arrange
    mockApiService.login.mockReturnValue(throwError(() => new Error('Login failed')));

    // Act
    service.login('test@test.com', 'wrong');

    // Assert
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ==================== Register Tests ====================

  it('register should call ApiService.register with correct params', () => {
    // Act
    service.register('test@test.com', 'password123', 'John', 'Doe');

    // Assert
    expect(mockApiService.register).toHaveBeenCalledWith('test@test.com', 'password123', 'John', 'Doe');
  });

  it('register should store token and navigate to dashboard', () => {
    // Act
    service.register('test@test.com', 'password123', 'John', 'Doe');

    // Assert
    expect(localStorage.getItem('bankapp_token')).toBe('fake-jwt-token');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('register should emit login event via AuthEventService', () => {
    // Act
    service.register('test@test.com', 'password123', 'John', 'Doe');

    // Assert
    expect(mockAuthEventService.emitLogin).toHaveBeenCalled();
  });

  // ==================== Logout Tests ====================

  it('logout should remove token from localStorage', () => {
    // Arrange — login first so there's something to clear
    service.login('test@test.com', 'password123');

    // Act
    service.logout();

    // Assert
    expect(localStorage.getItem('bankapp_token')).toBeNull();
  });

  it('logout should update isLoggedIn$ to false', () => {
    // Arrange
    service.login('test@test.com', 'password123');

    // Act
    service.logout();

    // Assert
    let isLoggedIn = true;
    service.isLoggedIn$.subscribe(val => isLoggedIn = val);
    expect(isLoggedIn).toBe(false);
  });

  it('logout should emit logout event via AuthEventService', () => {
    // Act
    service.logout();

    // Assert
    expect(mockAuthEventService.emitLogout).toHaveBeenCalled();
  });

  it('logout should navigate to login page', () => {
    // Act
    service.logout();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  // ==================== GetToken Tests ====================

  it('getToken should return token when it exists', () => {
    // Arrange
    service.login('test@test.com', 'password123');

    // Act & Assert
    expect(service.getToken()).toBe('fake-jwt-token');
  });

  it('getToken should return null when no token exists', () => {
    // Act & Assert
    expect(service.getToken()).toBeNull();
  });
});