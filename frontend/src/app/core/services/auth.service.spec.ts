import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_REPO, AuthRepo } from '../repositories/repository.tokens';
import { AUTH_SESSION_KEY, AuthService } from './auth.service';

describe('AuthService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    vi.useRealTimers();
  });

  it('restores a session and logs out at its expiry time', () => {
    vi.useFakeTimers();
    const expiresAt = Date.now() + 60_000;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ token: 'test-token', expiresAt }));
    const navigateByUrl = vi.fn();
    const authRepo: AuthRepo = {
      login: async () => ({ token: 'test-token', expiresAt }),
      changePassword: async () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_REPO, useValue: authRepo },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });

    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/admin/login');
  });
});
