import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';

@Component({
  selector: 'portfolio-confirm-dialog-host',
  standalone: true,
  template: `
    @if (dialog.current(); as current) {
      <div class="confirm-scrim" (click)="dialog.answer(false)" (keydown)="handleKeydown($event)">
        <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" (click)="$event.stopPropagation()">
          <span class="confirm-mark" aria-hidden="true">{{ current.danger ? '!' : '?' }}</span>
          <p class="confirm-eyebrow">PLEASE CONFIRM</p>
          <h2 id="confirm-title">{{ current.title }}</h2>
          <p id="confirm-message">{{ current.message }}</p>
          <div class="confirm-actions">
            <button type="button" (click)="dialog.answer(false)">{{ current.cancelLabel || 'Cancel' }}</button>
            <button #confirmButton type="button" [class.danger]="current.danger" (click)="dialog.answer(true)">{{ current.confirmLabel || 'Continue' }}</button>
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    .confirm-scrim { position: fixed; z-index: 1200; inset: 0; display: grid; place-items: center; padding: 20px; background: #05060acc; backdrop-filter: blur(6px); }
    .confirm-dialog { width: min(430px, 100%); padding: 25px; border: 1px solid var(--line-strong); border-radius: 14px; color: var(--text); background: var(--card); box-shadow: 0 28px 90px #0007; animation: confirm-in .18s ease-out; }
    .confirm-mark { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid color-mix(in srgb, var(--accent) 48%, var(--line)); border-radius: 50%; color: var(--accent); font-weight: 800; }
    .confirm-dialog:has(.danger) .confirm-mark { color: #eb838c; border-color: #eb838c66; }
    .confirm-eyebrow { margin: 19px 0 6px; color: var(--faint); font: 9px 'DM Mono', monospace; letter-spacing: .14em; }
    .confirm-dialog h2 { margin: 0 0 9px; font-size: 21px; letter-spacing: -.04em; }
    .confirm-dialog > p:last-of-type { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.7; }
    .confirm-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 25px; }
    .confirm-actions button { min-height: 38px; padding: 0 13px; border: 1px solid var(--line-strong); border-radius: 6px; color: var(--text); background: var(--surface); cursor: pointer; font: inherit; font-size: 11px; }
    .confirm-actions button:last-child { border-color: color-mix(in srgb, var(--accent) 55%, var(--cyan)); color: #111019; background: linear-gradient(110deg, var(--accent), var(--cyan)); font-weight: 700; }
    .confirm-actions button:last-child.danger { border-color: #cf5361; color: white; background: #bd4d5a; }
    @keyframes confirm-in { from { opacity: 0; transform: translateY(5px) scale(.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `],
})
export class ConfirmDialogHostComponent {
  readonly dialog = inject(ConfirmDialogService);

  @ViewChild('confirmButton')
  set confirmButton(element: ElementRef<HTMLButtonElement> | undefined) {
    if (element) queueMicrotask(() => element.nativeElement.focus());
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dialog.answer(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled])'),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && this.getDocumentActiveElement() === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && this.getDocumentActiveElement() === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  private getDocumentActiveElement(): Element | null {
    return document.activeElement;
  }
}
