import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly document = inject(DOCUMENT);
  private resolvePending?: (confirmed: boolean) => void;
  private previousFocus?: HTMLElement;
  readonly current = signal<ConfirmDialogOptions | null>(null);

  ask(options: ConfirmDialogOptions): Promise<boolean> {
    this.resolvePending?.(false);
    this.previousFocus = this.document.activeElement instanceof HTMLElement
      ? this.document.activeElement
      : undefined;
    return new Promise((resolve) => {
      this.resolvePending = resolve;
      this.current.set(options);
    });
  }

  answer(confirmed: boolean): void {
    this.current.set(null);
    this.resolvePending?.(confirmed);
    this.resolvePending = undefined;
    queueMicrotask(() => this.previousFocus?.focus());
  }
}
