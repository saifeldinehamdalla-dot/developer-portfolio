import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from '@angular/core';

@Component({
  selector: 'portfolio-modal',
  standalone: true,
  template: `
    <div class="modal-scrim" (click)="close()" (keydown)="handleKeydown($event)">
      <section #frame class="modal-frame" role="dialog" aria-modal="true" [attr.aria-label]="title" tabindex="-1" (click)="$event.stopPropagation()">
        <ng-content />
      </section>
    </div>
  `,
  styles: [`
    .modal-scrim { position: fixed; z-index: 1000; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 22px; background: #05060acc; backdrop-filter: blur(7px); animation: modal-fade .16s ease-out; }
    .modal-frame { width: min(720px, 100%); max-height: min(90dvh, 900px); overflow-y: auto; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--background); box-shadow: 0 30px 100px #0007; }
    @keyframes modal-fade { from { opacity: 0; } to { opacity: 1; } }
  `],
})
export class ModalComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly returnFocus = this.document.activeElement instanceof HTMLElement
    ? this.document.activeElement
    : null;

  @Input() title = 'Dialog';
  @Output() closed = new EventEmitter<void>();

  @ViewChild('frame')
  set frame(element: ElementRef<HTMLElement> | undefined) {
    if (!element) return;
    queueMicrotask(() => {
      const first = element.nativeElement.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      (first ?? element.nativeElement).focus();
    });
  }

  close(): void {
    this.closed.emit();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  ngOnDestroy(): void {
    queueMicrotask(() => this.returnFocus?.focus());
  }
}
