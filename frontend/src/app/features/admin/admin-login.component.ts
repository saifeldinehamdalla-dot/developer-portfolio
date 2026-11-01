import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../core/environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly environment = environment;
  readonly error = signal('');
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly form = this.fb.nonNullable.group({
    username: [environment.dataSource === 'local' ? environment.adminUsername : '', Validators.required],
    password: ['', [Validators.required, Validators.minLength(1)]],
  });

  async signIn() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const { username, password } = this.form.getRawValue();
      await this.auth.login(username, password);
      this.toast.show('Signed in successfully.');
      await this.router.navigateByUrl('/admin');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign-in failed. Try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
