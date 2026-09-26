import { TestBed } from '@angular/core/testing';
import { AuthEventService } from './auth-event.service';

describe('AuthEventService', () => {

  let service: AuthEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthEventService]
    });

    service = TestBed.inject(AuthEventService);
  });

  // ==================== Creation Tests ====================

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  // ==================== Login Event Tests ====================

  it('login$ should emit when emitLogin is called', () => {
    // Arrange
    let emitted = false;
    service.login$.subscribe(() => emitted = true);

    // Act
    service.emitLogin();

    // Assert
    expect(emitted).toBe(true);
  });

  // ==================== Logout Event Tests ====================

  it('logout$ should emit when emitLogout is called', () => {
    // Arrange
    let emitted = false;
    service.logout$.subscribe(() => emitted = true);

    // Act
    service.emitLogout();

    // Assert
    expect(emitted).toBe(true);
  });

  it('login$ should not emit when emitLogout is called', () => {
    // Arrange
    let loginEmitted = false;
    service.login$.subscribe(() => loginEmitted = true);

    // Act
    service.emitLogout();

    // Assert
    expect(loginEmitted).toBe(false);
  });
});