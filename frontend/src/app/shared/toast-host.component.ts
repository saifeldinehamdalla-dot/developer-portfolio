import { Component, inject } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

@Component({
  selector: 'portfolio-toast-host',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.messages(); track toast.id) {
        <div class="toast-item" [class]="'toast-item ' + toast.kind" role="status">
          <span class="toast-mark" aria-hidden="true">{{ toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i' }}</span>
          <span>{{ toast.text }}</span>
          <button type="button" (click)="toasts.dismiss(toast.id)" [attr.aria-label]="'Dismiss notification: ' + toast.text">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack { position: fixed; z-index: 1000; inset: 18px 18px auto auto; display: grid; gap: 10px; width: min(390px, calc(100vw - 36px)); }
    .toast-item { display: flex; align-items: center; gap: 11px; padding: 13px 14px; border: 1px solid var(--line-strong); border-radius: 14px; color: var(--text); background: var(--card); box-shadow: 0 18px 50px #0003; animation: toast-in .2s ease-out; }
    .toast-mark { display: grid; place-items: center; flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%; color: #091111; background: var(--cyan); font-weight: 800; }
    .toast-item.error .toast-mark { color: white; background: #d85868; }
    .toast-item.info .toast-mark { background: var(--accent); }
    .toast-item > span:nth-child(2) { flex: 1; font-size: 13px; line-height: 1.5; }
    .toast-item button { border: 0; color: var(--muted); background: transparent; font-size: 20px; cursor: pointer; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 540px) { .toast-stack { inset: 10px 10px auto; width: auto; } }
  `],
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
