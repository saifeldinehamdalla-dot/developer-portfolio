import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isHttpUrl, isSafeAssetReference, mailtoHref, safeHttpUrl } from '../../core/utils/url-validation';
import { isPortfolioBackup } from '../../core/models/portfolio-backup';
import { RelativeTimePipe } from '../../core/pipes/relative-time.pipe';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioStore } from '../../core/services/portfolio.store';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { ContactMessage } from '../../core/models/contact-message';
import { MediaAsset } from '../../core/models/media-asset';
import { PortfolioProfile } from '../../core/models/profile';
import { Project, ProjectInput } from '../../core/models/project';
import { Skill, SkillInput } from '../../core/models/skill';
import { environment } from '../../core/environments/environment';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ModalComponent } from '../../shared/modal.component';

type View = 'overview' | 'projects' | 'skills' | 'inbox' | 'media' | 'content' | 'settings';
type MessageFilter = 'all' | 'unread' | 'read';
type ProjectMode = 'cards' | 'table';

function optionalHttpUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return !value || isHttpUrl(value) ? null : { httpUrl: true };
}

function assetReference(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return !value || isSafeAssetReference(value) ? null : { assetReference: true };
}

function socialLinksText(control: AbstractControl): ValidationErrors | null {
  const lines = String(control.value ?? '').split('\n').filter((line) => line.trim());
  const valid = lines.every((line) => {
    const [label, ...urlParts] = line.split('|');
    return !!label.trim() && isHttpUrl(urlParts.join('|').trim());
  });
  return valid ? null : { socialLinks: true };
}

@Component({
  selector: 'app-cms-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, ReactiveFormsModule, RouterLink, ModalComponent, RelativeTimePipe],
  templateUrl: './cms-dashboard.component.html',
  styleUrl: './cms-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsDashboardComponent {
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly store = inject(PortfolioStore);
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly dataSource = environment.dataSource;
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly view = signal<View>('overview');
  readonly sidebarCollapsed = signal(false);
  readonly mobileNavOpen = signal(false);
  readonly projectMode = signal<ProjectMode>('cards');
  readonly projectSearch = signal('');
  readonly skillSearch = signal('');
  readonly messageSearch = signal('');
  readonly messageFilter = signal<MessageFilter>('all');
  readonly selectedMessageIds = signal<number[]>([]);
  readonly activeMessage = signal<ContactMessage | null>(null);
  readonly editingProject = signal<Project | null>(null);
  readonly editingSkill = signal<Skill | null>(null);
  readonly projectEditorOpen = signal(false);
  readonly skillEditorOpen = signal(false);
  readonly selectedMedia = signal<MediaAsset | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly accent = signal('#a39bff');
  readonly importName = signal('');

  readonly filteredProjects = computed(() => {
    const query = this.projectSearch().trim().toLowerCase();
    return this.store.projects().filter((project) =>
      !query || `${project.title} ${project.description} ${(project.tags ?? []).join(' ')}`.toLowerCase().includes(query),
    );
  });
  readonly filteredSkills = computed(() => {
    const query = this.skillSearch().trim().toLowerCase();
    return this.store.skills().filter((skill) =>
      !query || `${skill.name} ${skill.level} ${skill.category ?? ''}`.toLowerCase().includes(query),
    );
  });
  readonly filteredMessages = computed(() => {
    const query = this.messageSearch().trim().toLowerCase();
    return [...this.store.messages()]
      .filter((message) => this.messageFilter() === 'all' || (this.messageFilter() === 'unread' ? !message.isRead : message.isRead))
      .filter((message) => !query || `${message.name} ${message.email} ${message.message}`.toLowerCase().includes(query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
  readonly profileForm = this.fb.group({
    name: ['', Validators.required], initials: [''], role: [''], roles: [''], headline: [''], tagline: [''],
    bio: [''], location: [''], email: ['', [Validators.email]], yearsExperience: [''], projectsCount: [''],
    photoUrl: ['', assetReference], resumeUrl: ['', assetReference],
    github: ['', optionalHttpUrl], linkedin: ['', optionalHttpUrl],
    otherSocialLinks: ['', socialLinksText], availability: [''],
    seoTitle: [''], seoDescription: [''],
  });
  readonly projectForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.maxLength(700)]],
    gitHubUrl: ['', [Validators.required, optionalHttpUrl]],
    liveUrl: ['', optionalHttpUrl], imageUrl: ['', assetReference], tags: [''], featured: [false],
  });
  readonly skillForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]], level: ['', Validators.required],
    percentage: [75, [Validators.min(0), Validators.max(100)]],
    category: ['Other' as Skill['category']],
  });
  readonly passwordForm = this.fb.group({
    currentPassword: ['', Validators.required], newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });
  readonly settingsForm = this.fb.group({
    accentColor: ['#a39bff', [Validators.required, Validators.pattern(/^#[0-9a-f]{6}$/i)]],
    about: [true], skills: [true], projects: [true], contact: [true],
    defaultTheme: ['dark' as 'dark' | 'light'],
  });

  constructor() {
    void this.initialize();
  }

  async initialize(): Promise<void> {
    this.error.set('');
    try {
      await Promise.all([
        this.store.initialize(),
        this.auth.isAuthenticated() ? this.store.loadMessages() : Promise.resolve(),
      ]);
      const profile = this.store.profile();
      if (profile) {
        this.profileForm.patchValue(this.profileFormValue(profile));
        this.settingsForm.patchValue({
          accentColor: profile.accentColor || '#a39bff',
          about: profile.sectionVisibility.about,
          skills: profile.sectionVisibility.skills,
          projects: profile.sectionVisibility.projects,
          contact: profile.sectionVisibility.contact,
          defaultTheme: profile.defaultTheme,
        });
        this.accent.set(profile.accentColor || '#a39bff');
      }
    } catch (error) {
      this.error.set(this.message(error, 'Portfolio data could not be loaded.'));
    }
  }

  setView(view: View): void {
    this.view.set(view);
    this.mobileNavOpen.set(false);
    this.activeMessage.set(null);
    this.editingProject.set(null);
    this.editingSkill.set(null);
    this.projectEditorOpen.set(false);
    this.skillEditorOpen.set(false);
  }

  async saveProject(): Promise<void> {
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); this.toast.show('Check the project details, links, and image reference.', 'error'); return; }
    const values = this.projectForm.getRawValue();
    const existing = this.editingProject();
    const input: ProjectInput = {
      title: values.title.trim(), description: values.description.trim(), gitHubUrl: values.gitHubUrl.trim(),
      liveUrl: values.liveUrl.trim(), imageUrl: values.imageUrl.trim(),
      tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean), featured: values.featured,
      order: existing?.order ?? this.store.projects().length,
    };
    await this.run(async () => {
      if (existing) await this.store.updateProject({ ...input, id: existing.id });
      else await this.store.createProject(input);
      this.editingProject.set(null);
      this.projectEditorOpen.set(false);
      this.toast.show(existing ? 'Project updated.' : 'Project added.');
    });
  }

  openProject(project: Project | null = null): void {
    this.editingProject.set(project);
    this.projectEditorOpen.set(true);
    this.projectForm.reset(project ? {
      title: project.title, description: project.description, gitHubUrl: project.gitHubUrl,
      liveUrl: project.liveUrl ?? '', imageUrl: project.imageUrl, tags: (project.tags ?? []).join(', '),
      featured: project.featured !== false,
    } : { title: '', description: '', gitHubUrl: '', liveUrl: '', imageUrl: '', tags: '', featured: false });
  }

  closeProjectEditor(): void {
    this.editingProject.set(null);
    this.projectEditorOpen.set(false);
    this.projectForm.reset({ title: '', description: '', gitHubUrl: '', liveUrl: '', imageUrl: '', tags: '', featured: false });
  }

  async deleteProject(project: Project): Promise<void> {
    if (!await this.confirmDialog.ask({
      title: 'Remove this project?',
      message: `“${project.title}” will no longer appear on your portfolio.`,
      confirmLabel: 'Remove project',
      danger: true,
    })) return;
    await this.run(async () => { await this.store.deleteProject(project.id); this.toast.show('Project removed.'); });
  }

  async moveProject(project: Project, delta: number): Promise<void> {
    const list = [...this.store.projects()];
    const from = list.findIndex((item) => item.id === project.id);
    const to = from + delta;
    if (to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    await this.run(async () => { await this.store.reorderProjects(list); this.toast.show('Project order saved.'); });
  }

  dropProjects(event: CdkDragDrop<Project[]>): void {
    if (this.projectSearch().trim() || event.previousIndex === event.currentIndex) return;
    const items = [...this.store.projects()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    void this.run(async () => {
      await this.store.reorderProjects(items);
      this.toast.show('Project order saved.');
    });
  }

  dropSkills(event: CdkDragDrop<Skill[]>): void {
    if (this.skillSearch().trim() || event.previousIndex === event.currentIndex) return;
    const items = [...this.store.skills()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    void this.run(async () => {
      await this.store.reorderSkills(items);
      this.toast.show('Skill order saved.');
    });
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  canMoveProject(project: Project, delta: number): boolean {
    const index = this.store.projects().findIndex((item) => item.id === project.id);
    return index + delta >= 0 && index + delta < this.store.projects().length;
  }

  openSkill(skill: Skill | null = null): void {
    this.editingSkill.set(skill);
    this.skillEditorOpen.set(true);
    this.skillForm.reset(skill ? {
      name: skill.name, level: skill.level, percentage: skill.percentage ?? 75, category: skill.category ?? 'Other',
    } : { name: '', level: '', percentage: 75, category: 'Other' });
  }

  closeSkillEditor(): void {
    this.editingSkill.set(null);
    this.skillEditorOpen.set(false);
    this.skillForm.reset({ name: '', level: '', percentage: 75, category: 'Other' });
  }

  async saveSkill(): Promise<void> {
    if (this.skillForm.invalid) { this.skillForm.markAllAsTouched(); this.toast.show('Add a skill name and level before saving.', 'error'); return; }
    const form = this.skillForm.getRawValue();
    const existing = this.editingSkill();
    const input: SkillInput = {
      name: form.name.trim(), level: form.level.trim(), percentage: Number(form.percentage),
      category: form.category as Skill['category'], order: existing?.order ?? this.store.skills().length,
    };
    await this.run(async () => {
      if (existing) await this.store.updateSkill({ ...input, id: existing.id });
      else await this.store.createSkill(input);
      this.editingSkill.set(null);
      this.skillEditorOpen.set(false);
      this.toast.show(existing ? 'Skill updated.' : 'Skill added.');
    });
  }

  async deleteSkill(skill: Skill): Promise<void> {
    if (!await this.confirmDialog.ask({
      title: 'Remove this skill?',
      message: `“${skill.name}” will no longer appear on your portfolio.`,
      confirmLabel: 'Remove skill',
      danger: true,
    })) return;
    await this.run(async () => { await this.store.deleteSkill(skill.id); this.toast.show('Skill removed.'); });
  }

  async moveSkill(skill: Skill, delta: number): Promise<void> {
    const list = [...this.store.skills()];
    const from = list.findIndex((item) => item.id === skill.id);
    const to = from + delta;
    if (to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]];
    await this.run(async () => { await this.store.reorderSkills(list); this.toast.show('Skill order saved.'); });
  }

  canMoveSkill(skill: Skill, delta: number): boolean {
    const index = this.store.skills().findIndex((item) => item.id === skill.id);
    return index + delta >= 0 && index + delta < this.store.skills().length;
  }

  async openMessage(message: ContactMessage): Promise<void> {
    this.activeMessage.set(message);
    if (!message.isRead) {
      await this.run(() => this.store.setMessageRead(message.id, true));
      this.activeMessage.set(this.store.messages().find((item) => item.id === message.id) ?? message);
    }
  }

  async toggleMessageRead(message: ContactMessage): Promise<void> {
    const isRead = !this.store.messages().find((item) => item.id === message.id)?.isRead;
    await this.run(async () => {
      await this.store.setMessageRead(message.id, isRead);
      this.activeMessage.set({ ...message, isRead });
      this.toast.show(isRead ? 'Message marked read.' : 'Message marked unread.');
    });
  }

  toggleMessage(message: ContactMessage): void {
    this.selectedMessageIds.update((ids) => ids.includes(message.id) ? ids.filter((id) => id !== message.id) : [...ids, message.id]);
  }

  selectVisibleMessages(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedMessageIds.set(checked ? this.filteredMessages().map((message) => message.id) : []);
  }

  setProjectSearch(event: Event): void {
    this.projectSearch.set((event.target as HTMLInputElement).value);
  }

  setSkillSearch(event: Event): void {
    this.skillSearch.set((event.target as HTMLInputElement).value);
  }

  setMessageSearch(event: Event): void {
    this.messageSearch.set((event.target as HTMLInputElement).value);
  }

  setAccentColor(event: Event): void {
    this.accent.set((event.target as HTMLInputElement).value);
  }

  async bulkRead(read: boolean): Promise<void> {
    const ids = this.selectedMessageIds();
    if (!ids.length) return;
    await this.run(async () => {
      await this.store.bulkSetMessagesRead(ids, read);
      this.selectedMessageIds.set([]);
      const activeId = this.activeMessage()?.id;
      if (activeId !== undefined) {
        this.activeMessage.set(this.store.messages().find((message) => message.id === activeId) ?? null);
      }
      this.toast.show(read ? 'Selected messages marked read.' : 'Selected messages marked unread.');
    });
  }

  async deleteMessage(message: ContactMessage): Promise<void> {
    if (!await this.confirmDialog.ask({
      title: 'Delete this message?',
      message: `The note from ${message.name} will be permanently removed from your inbox.`,
      confirmLabel: 'Delete message',
      danger: true,
    })) return;
    await this.run(async () => {
      await this.store.deleteMessage(message.id);
      if (this.activeMessage()?.id === message.id) this.activeMessage.set(null);
      this.toast.show('Message deleted.');
    });
  }

  async bulkDeleteMessages(): Promise<void> {
    const ids = this.selectedMessageIds();
    if (!ids.length || !await this.confirmDialog.ask({
      title: `Delete ${ids.length} messages?`,
      message: 'These messages will be permanently removed from your inbox.',
      confirmLabel: 'Delete messages',
      danger: true,
    })) return;
    await this.run(async () => {
      await this.store.bulkDeleteMessages(ids);
      this.selectedMessageIds.set([]);
      this.toast.show('Selected messages deleted.');
    });
  }

  async uploadImage(event: Event, assignTo?: 'project' | 'photo' | 'resume'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    await this.uploadFile(file, assignTo);
  }

  async dropUpload(event: DragEvent, assignTo?: 'project' | 'photo' | 'resume'): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) await this.uploadFile(file, assignTo);
  }

  private async uploadFile(file: File, assignTo?: 'project' | 'photo' | 'resume'): Promise<void> {
    const isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    const isResumePdf = assignTo === 'resume' && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024;
    if ((!isImage || file.size > 2 * 1024 * 1024) && !isResumePdf) {
      this.toast.show(assignTo === 'resume'
        ? 'Choose an image up to 2 MB or a PDF up to 5 MB.'
        : 'Choose a PNG, JPG, or WebP image no larger than 2 MB.', 'error');
      return;
    }
    await this.run(async () => {
      const reference = await this.store.uploadImage(file);
      if (assignTo === 'project') this.projectForm.controls.imageUrl.setValue(reference);
      if (assignTo === 'photo') this.profileForm.controls.photoUrl.setValue(reference);
      if (assignTo === 'resume') this.profileForm.controls.resumeUrl.setValue(reference);
      this.toast.show(isResumePdf ? 'CV added to your media library.' : 'Image added to your media library.');
    });
  }

  selectMediaReference(event: Event, target: 'project' | 'photo' | 'resume'): void {
    const reference = (event.target as HTMLSelectElement).value;
    if (target === 'project') this.projectForm.controls.imageUrl.setValue(reference);
    if (target === 'photo') this.profileForm.controls.photoUrl.setValue(reference);
    if (target === 'resume') this.profileForm.controls.resumeUrl.setValue(reference);
  }

  async renameMedia(asset: MediaAsset): Promise<void> {
    const name = window.prompt('Give this image a clear name:', asset.name);
    if (name === null || !name.trim()) return;
    await this.run(async () => { await this.store.renameImage(asset.id, name.trim()); this.toast.show('Media renamed.'); });
  }

  async deleteMedia(asset: MediaAsset): Promise<void> {
    const reference = `media:${asset.id}`;
    const profile = this.store.profile();
    const usedByProject = this.store.projects().some((project) => project.imageUrl === reference);
    const usedByProfile = profile?.photoUrl === reference || profile?.resumeUrl === reference;
    const warning = usedByProject || usedByProfile
      ? ' This file is currently used by portfolio content; the repository will protect those references.'
      : '';
    if (!await this.confirmDialog.ask({
      title: 'Delete this media file?',
      message: `“${asset.name}” cannot be restored.${warning}`,
      confirmLabel: 'Delete file',
      danger: true,
    })) return;
    await this.run(async () => {
      await this.store.deleteImage(asset.id);
      this.selectedMedia.set(null);
      this.toast.show('Media deleted.');
    });
  }

  copyReference(asset: MediaAsset): void {
    void navigator.clipboard?.writeText(`media:${asset.id}`).then(
      () => this.toast.show('Media reference copied.'),
      () => this.toast.show(`Reference: media:${asset.id}`, 'info'),
    );
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); this.toast.show('Check the name, email, and link fields before saving.', 'error'); return; }
    const current = this.store.profile();
    if (!current) return;
    const values = this.profileForm.getRawValue();
    const { github, linkedin, otherSocialLinks, ...editable } = values;
    await this.run(async () => {
      await this.store.saveProfile({
        ...current, ...editable, roles: values.roles.split('\n').map((role) => role.trim()).filter(Boolean),
        socialLinks: { github, linkedin },
        otherSocialLinks: otherSocialLinks.split('\n').map((line) => {
          const [label, ...url] = line.split('|');
          return { label: label.trim(), url: url.join('|').trim() };
        }).filter((link) => link.label && link.url),
      });
      this.toast.show('Portfolio profile saved.');
    });
  }

  async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.toast.show('Choose a valid six-digit accent color.', 'error');
      return;
    }
    const current = this.store.profile();
    if (!current) return;
    const value = this.settingsForm.getRawValue();
    const updated: PortfolioProfile = {
      ...current, accentColor: value.accentColor, defaultTheme: value.defaultTheme,
      sectionVisibility: { about: value.about, skills: value.skills, projects: value.projects, contact: value.contact },
    };
    await this.run(async () => {
      await this.store.saveProfile(updated);
      this.accent.set(value.accentColor);
      document.documentElement.style.setProperty('--accent', value.accentColor);
      this.theme.setTheme(value.defaultTheme);
      this.toast.show('Display settings saved.');
    });
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.toast.show('The new passwords do not match.', 'error');
      return;
    }
    await this.run(async () => {
      await this.auth.changePassword(currentPassword, newPassword);
      this.passwordForm.reset();
      this.toast.show('Local admin password updated.');
    });
  }

  async exportBackup(): Promise<void> {
    await this.run(async () => {
      const backup = await this.store.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast.show('Backup downloaded.');
    });
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isPortfolioBackup(parsed)) throw new Error('The file is not a valid Portfolio CMS backup.');
      this.importName.set(file.name);
      if (!await this.confirmDialog.ask({
        title: 'Replace all current content?',
        message: `Restore “${file.name}” and replace the current projects, skills, messages, profile, and media. This cannot be undone.`,
        confirmLabel: 'Replace content',
        danger: true,
      })) {
        this.importName.set('');
        return;
      }
      await this.run(async () => {
        await this.store.importBackup(parsed);
        this.importName.set('');
        this.toast.show('Backup restored. All portfolio data has been replaced.');
      });
    } catch (error) {
      this.toast.show(this.message(error, 'Could not read this backup file.'), 'error');
    }
  }

  signOut(): void { this.auth.logout(true); }
  toggleTheme(): void { this.theme.toggle(); }
  imageSrc(reference: string): string { return this.store.imageSource(reference); }
  safeLink(value: string): string | null { return safeHttpUrl(value); }
  emailHref(email: string): string { return mailtoHref(email); }
  replyHref(email: string): string { return `${mailtoHref(email)}?subject=${encodeURIComponent('Re: your note')}`; }
  messageDate(value: string): string { return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  fileSize(size: number): string { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }

  private profileFormValue(profile: PortfolioProfile) {
    return {
      ...profile, roles: profile.roles.join('\n'), github: profile.socialLinks.github, linkedin: profile.socialLinks.linkedin,
      otherSocialLinks: profile.otherSocialLinks.map((link) => `${link.label} | ${link.url}`).join('\n'),
    };
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    try { await action(); }
    catch (error) { this.toast.show(this.message(error, 'That change could not be saved.'), 'error'); }
    finally { this.busy.set(false); }
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
