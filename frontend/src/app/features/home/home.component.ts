import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataModeService } from '../../core/services/data-mode.service';
import { PortfolioStore } from '../../core/services/portfolio.store';
import { ThemeService } from '../../core/services/theme.service';
import { Project } from '../../core/models/project';
import { Skill } from '../../core/models/skill';
import { portfolioConfig } from '../../core/portfolio.config';
import { NewContactMessage } from '../../core/models/contact-message';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../core/environments/environment';
import { mailtoHref, safeHttpUrl } from '../../core/utils/url-validation';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'portfolio-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  readonly store = inject(PortfolioStore);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  readonly themeService = inject(ThemeService);
  readonly dataMode = inject(DataModeService);
  readonly title = inject(Title);
  readonly meta = inject(Meta);
  get config() {
    return this.store.profile() ?? portfolioConfig;
  }
  readonly visibleSections = computed(() => {
    const visibility = this.store.profile()?.sectionVisibility;
    return ['home', ...(visibility?.about === false ? [] : ['about']), ...(visibility?.skills === false ? [] : ['skills']),
      ...(visibility?.projects === false ? [] : ['projects']), ...(visibility?.contact === false ? [] : ['contact'])];
  });
  readonly projects = computed(() => this.store.orderedProjects());
  readonly skills = signal<Skill[]>([]);
  readonly projectsLoading = signal(true);
  readonly skillsLoading = signal(true);
  readonly activeSection = signal('home');
  readonly menuOpen = signal(false);
  readonly roleText = signal('');
  readonly roleCursor = signal(true);
  readonly contactToast = signal('');
  readonly contactSubmitting = signal(false);
  readonly contactForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(12)]],
    website: [''],
  });
  readonly currentYear = new Date().getFullYear();
  private roleTimer?: ReturnType<typeof setTimeout>;
  private roleIndex = 0;
  private typingForward = true;
  private observer?: IntersectionObserver;

  ngOnInit() {
    void this.loadContent();
    this.typeRole();
  }

  ngAfterViewInit() {
    if (typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) this.activeSection.set(entry.target.id);
        });
      },
      { threshold: 0.16, rootMargin: '-10% 0px -18% 0px' },
    );
    this.observeSections();
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      if (this.roleTimer) clearTimeout(this.roleTimer);
    });
  }

  async loadContent(force = false) {
    this.projectsLoading.set(true);
    this.skillsLoading.set(true);
    try {
      await this.store.initialize(force);
      this.skills.set(this.store.skills());
      if (environment.dataSource === 'local') {
        this.dataMode.useDemo('Local mode — changes are saved in this browser.');
      } else {
        this.dataMode.useApi();
      }
      const profile = this.store.profile();
      if (profile) {
        this.title.setTitle(profile.seoTitle || `${profile.name} — ${profile.role}`);
        this.meta.updateTag({ name: 'description', content: profile.seoDescription || profile.tagline });
        this.meta.updateTag({ property: 'og:title', content: profile.seoTitle || profile.name });
        this.meta.updateTag({ property: 'og:description', content: profile.seoDescription || profile.tagline });
        document.documentElement.style.setProperty('--accent', profile.accentColor);
        try {
          if (!localStorage.getItem('portfolio-theme')) this.themeService.setTheme(profile.defaultTheme);
        } catch {
          this.themeService.setTheme(profile.defaultTheme);
        }
      }
    } catch {
      this.dataMode.fail(this.store.error() || 'Portfolio content could not be loaded.');
      this.contactToast.set(this.store.error() || 'Portfolio content could not be loaded.');
    } finally {
      this.projectsLoading.set(false);
      this.skillsLoading.set(false);
      this.observeSections();
    }
  }

  skillPercent(level: string): number {
    const value = level.trim().toLowerCase();
    if (value.includes('expert') || value.includes('master')) return 96;
    if (value.includes('advanced') || value.includes('senior')) return 82;
    if (value.includes('intermediate') || value.includes('mid')) return 65;
    if (value.includes('beginner') || value.includes('junior')) return 38;
    return 58;
  }

  skillTone(level: string): string {
    const value = level.trim().toLowerCase();
    if (value.includes('expert') || value.includes('master')) return 'expert';
    if (value.includes('advanced') || value.includes('senior')) return 'advanced';
    if (value.includes('beginner') || value.includes('junior')) return 'beginner';
    return 'intermediate';
  }

  retryProjects() {
    void this.loadContent(true);
  }

  retrySkills() {
    void this.loadContent(true);
  }

  retryApi() {
    void this.loadContent(true);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  safeLink(value: string): string | null {
    return safeHttpUrl(value);
  }

  emailHref(value: string): string {
    return mailtoHref(value);
  }

  async submitContact() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    const { name, email, message, website } = this.contactForm.getRawValue();
    if (website.trim()) {
      this.contactForm.reset();
      this.contactToast.set('Thanks — your message has been received.');
      return;
    }
    const input: NewContactMessage = { name, email, message };
    this.contactSubmitting.set(true);
    try {
      await this.store.createMessage(input);
      this.contactForm.reset();
      this.contactToast.set('Thanks — your message has been sent.');
    } catch (error) {
      this.contactToast.set(error instanceof Error ? error.message : 'Could not send your message. Please try again.');
    } finally {
      this.contactSubmitting.set(false);
      setTimeout(() => this.contactToast.set(''), 4800);
    }
  }

  private typeRole() {
    const roles = this.config.roles.length ? this.config.roles : [this.config.role];
    if (this.roleIndex >= roles.length) this.roleIndex = 0;
    const currentRole = roles[this.roleIndex] ?? this.config.role;
    const text = this.roleText();
    if (this.typingForward) {
      this.roleText.set(currentRole.slice(0, text.length + 1));
      if (text.length + 1 >= currentRole.length) {
        this.typingForward = false;
        this.roleTimer = setTimeout(() => this.typeRole(), 1550);
        return;
      }
    } else {
      this.roleText.set(currentRole.slice(0, Math.max(0, text.length - 1)));
      if (text.length <= 1) {
        this.typingForward = true;
        this.roleIndex = (this.roleIndex + 1) % roles.length;
      }
    }
    this.roleTimer = setTimeout(() => this.typeRole(), this.typingForward ? 72 : 36);
  }

  private observeSections() {
    if (!this.observer) return;
    (this.host.nativeElement as HTMLElement)
      .querySelectorAll<HTMLElement>('section[id]')
      .forEach((element) => this.observer?.observe(element));
  }
}
