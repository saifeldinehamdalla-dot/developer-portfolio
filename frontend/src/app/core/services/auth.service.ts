import { computed, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_REPO, AuthSession } from '../repositories/repository.tokens';

export const AUTH_SESSION_KEY = 'portfolio-auth-session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authRepo = inject(AUTH_REPO);
  private readonly router = inject(Router);
  private expiryTimer?: ReturnType<typeof setTimeout>;
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly isAuthenticated = computed(() => {
    const session = this.sessionState();
    return !!session && session.expiresAt > Date.now();
  });
  readonly session = this.sessionState.asReadonly();

  constructor() {
    this.scheduleExpiry();
  }

  async login(username: string, password: string): Promise<void> {
    const session = await this.authRepo.login(username, password);
    if (!session.token.trim() || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
      throw new Error('The authentication service returned an invalid session.');
    }
    this.persist(session);
    this.sessionState.set(session);
    this.scheduleExpiry();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.authRepo.changePassword(currentPassword, newPassword);
  }

  logout(redirect = false): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.sessionState.set(null);
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // The in-memory session is still cleared.
    }
    if (redirect) void this.router.navigateByUrl('/admin/login');
  }

  private restoreSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!this.isAuthSession(parsed) || parsed.expiresAt <= Date.now()) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private persist(session: AuthSession): void {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }

  private scheduleExpiry(): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    const session = this.sessionState();
    if (!session) return;
    this.expiryTimer = setTimeout(
      () => this.logout(true),
      Math.max(0, session.expiresAt - Date.now()),
    );
  }

  private isAuthSession(value: unknown): value is AuthSession {
    return typeof value === 'object' &&
      value !== null &&
      'token' in value &&
      typeof value.token === 'string' &&
      value.token.trim().length > 0 &&
      'expiresAt' in value &&
      typeof value.expiresAt === 'number' &&
      Number.isFinite(value.expiresAt);
  }
}
