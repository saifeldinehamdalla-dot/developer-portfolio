import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '.reveal',
  standalone: true,
})
export class RevealDirective implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (this.isInViewport() || typeof IntersectionObserver === 'undefined') {
      this.reveal();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) this.reveal();
      },
      { threshold: 0.16, rootMargin: '-10% 0px -18% 0px' },
    );
    this.observer.observe(this.element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private isInViewport(): boolean {
    const bounds = this.element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight &&
      bounds.right > 0 && bounds.left < window.innerWidth;
  }

  private reveal(): void {
    this.element.classList.add('is-visible');
    this.observer?.disconnect();
    this.observer = undefined;
  }
}
