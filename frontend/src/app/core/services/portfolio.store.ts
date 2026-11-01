import { computed, Injectable, inject, signal } from '@angular/core';
import { ContactMessage, NewContactMessage } from '../models/contact-message';
import { MediaAsset } from '../models/media-asset';
import { isPortfolioBackup, PortfolioBackup } from '../models/portfolio-backup';
import { PortfolioProfile } from '../models/profile';
import { Project, ProjectInput } from '../models/project';
import { Skill, SkillInput } from '../models/skill';
import {
  MEDIA_REPO,
  MESSAGES_REPO,
  PROFILE_REPO,
  PROJECTS_REPO,
  SKILLS_REPO,
} from '../repositories/repository.tokens';
import { isSafeAssetReference } from '../utils/url-validation';

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
}

@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private readonly projectsRepo = inject(PROJECTS_REPO);
  private readonly skillsRepo = inject(SKILLS_REPO);
  private readonly messagesRepo = inject(MESSAGES_REPO);
  private readonly profileRepo = inject(PROFILE_REPO);
  private readonly mediaRepo = inject(MEDIA_REPO);

  readonly projects = signal<Project[]>([]);
  readonly skills = signal<Skill[]>([]);
  readonly messages = signal<ContactMessage[]>([]);
  readonly messagesLoading = signal(false);
  readonly messagesLoaded = signal(false);
  readonly profile = signal<PortfolioProfile | null>(null);
  readonly media = signal<MediaAsset[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly orderedProjects = computed(() => sortProjects(this.projects()));
  readonly unreadCount = computed(() => this.messages().filter((item) => !item.isRead).length);
  readonly featuredProjects = computed(() =>
    this.orderedProjects().filter((item) => item.featured !== false),
  );

  private loaded = false;
  private initializing?: Promise<void>;
  private loadingMessages?: Promise<void>;

  async initialize(force = false): Promise<void> {
    if (this.loaded && !force) return;
    if (this.initializing && !force) return this.initializing;
    this.loading.set(true);
    this.error.set('');
    this.initializing = (async () => {
      try {
        const [projects, skills, profile, media] = await Promise.all([
          this.projectsRepo.listProjects(),
          this.skillsRepo.listSkills(),
          this.profileRepo.getProfile(),
          this.mediaRepo.list(),
        ]);
        this.projects.set(sortProjects(projects));
        this.skills.set([...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        this.profile.set(profile);
        this.media.set(media);
        this.loaded = true;
      } catch (error) {
        this.error.set(this.errorMessage(error, 'Could not load portfolio content.'));
        throw error;
      } finally {
        this.loading.set(false);
        this.initializing = undefined;
      }
    })();
    return this.initializing;
  }

  async loadMessages(force = false): Promise<void> {
    if (this.messagesLoaded() && !force) return;
    if (this.loadingMessages && !force) return this.loadingMessages;

    this.messagesLoading.set(true);
    const loadingMessages = (async () => {
      try {
        const messages = await this.messagesRepo.listMessages();
        this.messages.set([...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.messagesLoaded.set(true);
      } catch (error) {
        this.error.set(this.errorMessage(error, 'Could not load messages.'));
        throw error;
      } finally {
        this.messagesLoading.set(false);
        this.loadingMessages = undefined;
      }
    })();
    this.loadingMessages = loadingMessages;
    return loadingMessages;
  }

  async createProject(input: ProjectInput): Promise<Project> {
    const project = await this.projectsRepo.createProject({ ...input, order: input.order ?? this.projects().length });
    this.projects.update((items) => sortProjects([...items, project]));
    return project;
  }

  async updateProject(project: Project): Promise<void> {
    await this.projectsRepo.updateProject(project);
    this.projects.update((items) => sortProjects(items.map((item) => item.id === project.id ? project : item)));
  }

  async deleteProject(id: number): Promise<void> {
    await this.projectsRepo.deleteProject(id);
    this.projects.update((items) => items.filter((item) => item.id !== id));
  }

  async reorderProjects(items: Project[]): Promise<void> {
    const ordered = items.map((item, order) => ({ ...item, order }));
    await this.projectsRepo.replaceProjects(ordered);
    this.projects.set(sortProjects(ordered));
  }

  async createSkill(input: SkillInput): Promise<Skill> {
    const skill = await this.skillsRepo.createSkill({ ...input, order: input.order ?? this.skills().length });
    this.skills.update((items) => [...items, skill].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return skill;
  }

  async updateSkill(skill: Skill): Promise<void> {
    await this.skillsRepo.updateSkill(skill);
    this.skills.update((items) => items.map((item) => item.id === skill.id ? skill : item));
  }

  async deleteSkill(id: number): Promise<void> {
    await this.skillsRepo.deleteSkill(id);
    this.skills.update((items) => items.filter((item) => item.id !== id));
  }

  async reorderSkills(items: Skill[]): Promise<void> {
    const ordered = items.map((item, order) => ({ ...item, order }));
    await this.skillsRepo.replaceSkills(ordered);
    this.skills.set(ordered);
  }

  async createMessage(input: NewContactMessage): Promise<ContactMessage> {
    const message = await this.messagesRepo.createMessage(input);
    if (this.messagesLoaded()) this.messages.update((items) => [message, ...items]);
    return message;
  }

  async setMessageRead(id: number, isRead: boolean): Promise<void> {
    await this.messagesRepo.setMessageRead(id, isRead);
    this.messages.update((items) => items.map((item) => item.id === id ? { ...item, isRead } : item));
  }

  async deleteMessage(id: number): Promise<void> {
    await this.messagesRepo.deleteMessage(id);
    this.messages.update((items) => items.filter((item) => item.id !== id));
  }

  async bulkSetMessagesRead(ids: number[], isRead: boolean): Promise<void> {
    await Promise.all(ids.map((id) => this.messagesRepo.setMessageRead(id, isRead)));
    const selected = new Set(ids);
    this.messages.update((items) => items.map((item) => selected.has(item.id) ? { ...item, isRead } : item));
  }

  async bulkDeleteMessages(ids: number[]): Promise<void> {
    await Promise.all(ids.map((id) => this.messagesRepo.deleteMessage(id)));
    const selected = new Set(ids);
    this.messages.update((items) => items.filter((item) => !selected.has(item.id)));
  }

  async saveProfile(profile: PortfolioProfile): Promise<void> {
    await this.profileRepo.saveProfile(profile);
    this.profile.set(profile);
  }

  async uploadImage(file: File): Promise<string> {
    const reference = await this.mediaRepo.upload(file);
    this.media.set(await this.mediaRepo.list());
    return reference;
  }

  async renameImage(id: string, name: string): Promise<void> {
    await this.mediaRepo.rename(id, name);
    this.media.set(await this.mediaRepo.list());
  }

  async deleteImage(id: string): Promise<void> {
    const reference = `media:${id}`;
    const isUsed =
      this.projects().some((item) => item.imageUrl === reference) ||
      this.profile()?.photoUrl === reference ||
      this.profile()?.resumeUrl === reference;
    if (isUsed) throw new Error('This image is currently used by the site. Choose another image first.');
    await this.mediaRepo.delete(id);
    this.media.update((items) => items.filter((item) => item.id !== id));
  }

  imageSource(reference: string): string {
    if (!isSafeAssetReference(reference)) return '';
    if (!reference.startsWith('media:')) return reference;
    const asset = this.media().find((item) => item.id === reference.slice('media:'.length));
    if (!asset) return '';
    const dataUrlPattern =
      asset.mimeType === 'image/webp'
        ? /^data:image\/webp;base64,[A-Za-z0-9+/]*={0,2}$/
        : asset.mimeType === 'application/pdf'
          ? /^data:application\/pdf;base64,[A-Za-z0-9+/]*={0,2}$/
          : null;
    return dataUrlPattern?.test(asset.dataUrl) ? asset.dataUrl : '';
  }

  async exportBackup(): Promise<PortfolioBackup> {
    await this.initialize();
    const profile = this.profile();
    if (!profile) throw new Error('Portfolio profile is not available for export.');
    return {
      format: 'portfolio-cms-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: this.projects(),
      skills: this.skills(),
      messages: this.messages(),
      profile,
      images: await this.mediaRepo.list(),
    };
  }

  async importBackup(value: unknown): Promise<void> {
    if (!isPortfolioBackup(value)) {
      throw new Error('This backup file is invalid or uses an unsupported version.');
    }
    const backup = value;
    const previous = await this.exportBackup();
    const replaceData = async (data: PortfolioBackup): Promise<void> => {
      await Promise.all([
        this.projectsRepo.replaceProjects(data.projects),
        this.skillsRepo.replaceSkills(data.skills),
        this.messagesRepo.replaceMessages(data.messages),
        this.profileRepo.saveProfile(data.profile),
        this.mediaRepo.replaceAll(data.images),
      ]);
    };
    try {
      await replaceData(backup);
      this.loaded = false;
      await this.initialize(true);
      await this.loadMessages(true);
    } catch (error) {
      this.loaded = false;
      try {
        await replaceData(previous);
        await this.initialize(true);
        await this.loadMessages(true);
      } catch (rollbackError) {
        this.loaded = false;
        throw new AggregateError(
          [error, rollbackError],
          'Backup restore failed, and the previous content could not be fully restored.',
        );
      }
      throw error;
    }
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
