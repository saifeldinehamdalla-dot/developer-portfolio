import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { ContactMessage, NewContactMessage } from '../models/contact-message';
import { PortfolioProfile } from '../models/profile';
import { Project, ProjectInput } from '../models/project';
import { Skill, SkillInput } from '../models/skill';
import { portfolioConfig } from '../portfolio.config';
import {
  AuthRepo,
  AuthSession,
  MessagesRepo,
  ProfileRepo,
  ProjectsRepo,
  SkillsRepo,
} from './repository.tokens';

const PROJECTS_KEY = 'portfolio-projects';
const SKILLS_KEY = 'portfolio-skills';
const MESSAGES_KEY = 'portfolio-messages';
const PROFILE_KEY = 'portfolio-profile';
const ADMIN_PASSWORD_KEY = 'portfolio-admin-password';

const DEMO_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Northstar Finance',
    description:
      'A calm, real-time workspace that helps independent teams understand cash flow and make confident decisions.',
    gitHubUrl: 'https://github.com/',
    imageUrl: '',
    liveUrl: '',
    tags: ['Product', 'Dashboard'],
    featured: true,
    order: 0,
  },
  {
    id: 2,
    title: 'Forma Design System',
    description:
      'A flexible component foundation that brings consistency, accessibility, and a little joy to product interfaces.',
    gitHubUrl: 'https://github.com/',
    imageUrl: '',
    liveUrl: '',
    tags: ['Design systems', 'Angular'],
    featured: true,
    order: 1,
  },
  {
    id: 3,
    title: 'Fieldnotes',
    description:
      'A lightweight field-work platform for organizing visits, capturing observations, and sharing what matters.',
    gitHubUrl: 'https://github.com/',
    imageUrl: '',
    liveUrl: '',
    tags: ['Web app', 'Operations'],
    featured: false,
    order: 2,
  },
];

const DEMO_SKILLS: Skill[] = [
  { id: 1, name: 'Angular', level: 'Expert', percentage: 96, category: 'Frontend', order: 0 },
  { id: 2, name: 'TypeScript', level: 'Expert', percentage: 96, category: 'Frontend', order: 1 },
  { id: 3, name: 'C# / .NET', level: 'Advanced', percentage: 82, category: 'Backend', order: 2 },
  { id: 4, name: 'Node.js', level: 'Advanced', percentage: 82, category: 'Backend', order: 3 },
  { id: 5, name: 'PostgreSQL', level: 'Advanced', percentage: 82, category: 'Database', order: 4 },
  { id: 6, name: 'UI Engineering', level: 'Advanced', percentage: 82, category: 'Frontend', order: 5 },
  { id: 7, name: 'Cloud & DevOps', level: 'Intermediate', percentage: 65, category: 'Tools', order: 6 },
  { id: 8, name: 'Product Design', level: 'Intermediate', percentage: 65, category: 'Other', order: 7 },
];

@Injectable({ providedIn: 'root' })
export class LocalAdapter
  implements ProjectsRepo, SkillsRepo, MessagesRepo, ProfileRepo, AuthRepo
{
  async listProjects(): Promise<Project[]> {
    return this.read<Project[]>(PROJECTS_KEY, DEMO_PROJECTS).map((item, index) => ({
      ...item,
      liveUrl: item.liveUrl ?? '',
      tags: item.tags ?? [],
      featured: item.featured ?? false,
      order: item.order ?? index,
    }));
  }

  async createProject(input: ProjectInput): Promise<Project> {
    const projects = await this.listProjects();
    const item: Project = { ...input, id: this.nextId(projects), order: input.order ?? projects.length };
    this.write(PROJECTS_KEY, [...projects, item]);
    return item;
  }

  async createSkill(input: SkillInput): Promise<Skill> {
    const skills = await this.listSkills();
    const item: Skill = { ...input, id: this.nextId(skills), order: input.order ?? skills.length };
    this.write(SKILLS_KEY, [...skills, item]);
    return item;
  }

  async createMessage(input: NewContactMessage): Promise<ContactMessage> {
    const messages = await this.listMessages();
    const item: ContactMessage = {
      ...input,
      id: this.nextId(messages),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    this.write(MESSAGES_KEY, [item, ...messages]);
    return item;
  }

  async updateProject(project: Project): Promise<void> {
    this.write(PROJECTS_KEY, (await this.listProjects()).map((entry) => entry.id === project.id ? project : entry));
  }

  async updateSkill(skill: Skill): Promise<void> {
    this.write(SKILLS_KEY, (await this.listSkills()).map((entry) => entry.id === skill.id ? skill : entry));
  }

  async replaceProjects(items: Project[]): Promise<void> {
    this.write(PROJECTS_KEY, items);
  }

  async deleteProject(id: number): Promise<void> {
    this.write(PROJECTS_KEY, (await this.listProjects()).filter((item) => item.id !== id));
  }

  async deleteSkill(id: number): Promise<void> {
    this.write(SKILLS_KEY, (await this.listSkills()).filter((item) => item.id !== id));
  }

  async replaceSkills(items: Skill[]): Promise<void> {
    this.write(SKILLS_KEY, items);
  }

  async replaceMessages(items: ContactMessage[]): Promise<void> {
    this.write(MESSAGES_KEY, items);
  }

  async listSkills(): Promise<Skill[]> {
    return this.read<Skill[]>(SKILLS_KEY, DEMO_SKILLS).map((item, index) => ({
      ...item,
      percentage: item.percentage ?? this.percentFor(item.level),
      category: item.category ?? 'Other',
      order: item.order ?? index,
    }));
  }

  async listMessages(): Promise<ContactMessage[]> {
    return this.read<ContactMessage[]>(MESSAGES_KEY, []);
  }

  async countUnreadMessages(): Promise<number> {
    return (await this.listMessages()).filter((item) => !item.isRead).length;
  }

  async setMessageRead(id: number, isRead: boolean): Promise<void> {
    this.write(MESSAGES_KEY, (await this.listMessages()).map((item) => item.id === id ? { ...item, isRead } : item));
  }

  async deleteMessage(id: number): Promise<void> {
    this.write(MESSAGES_KEY, (await this.listMessages()).filter((item) => item.id !== id));
  }

  async getProfile(): Promise<PortfolioProfile> {
    const defaults = this.defaultProfile();
    const saved = this.read<Partial<PortfolioProfile>>(PROFILE_KEY, {});
    return {
      ...defaults,
      ...saved,
      socialLinks: { ...defaults.socialLinks, ...saved.socialLinks },
      otherSocialLinks: saved.otherSocialLinks ?? defaults.otherSocialLinks,
      sectionVisibility: { ...defaults.sectionVisibility, ...saved.sectionVisibility },
    };
  }

  async saveProfile(profile: PortfolioProfile): Promise<void> {
    this.write(PROFILE_KEY, profile);
  }

  async login(username: string, password: string): Promise<AuthSession> {
    const savedPassword = this.read<string | null>(ADMIN_PASSWORD_KEY, null);
    if (username !== environment.adminUsername || password !== (savedPassword ?? environment.adminPassword)) {
      throw new Error('Incorrect username or password.');
    }
    return { token: 'local-demo-session', expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const savedPassword = this.read<string | null>(ADMIN_PASSWORD_KEY, null);
    if (currentPassword !== (savedPassword ?? environment.adminPassword)) {
      throw new Error('Current password is incorrect.');
    }
    this.write(ADMIN_PASSWORD_KEY, newPassword);
  }

  private defaultProfile(): PortfolioProfile {
    return {
      ...portfolioConfig,
      otherSocialLinks: [],
      seoTitle: `${portfolioConfig.name} — ${portfolioConfig.role}`,
      seoDescription: portfolioConfig.tagline,
      sectionVisibility: { about: true, skills: true, projects: true, contact: true },
      accentColor: '#a39bff',
      defaultTheme: 'dark',
    };
  }

  private read<T>(key: string, seed: T): T {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      this.write(key, seed);
      return seed;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw this.corruptedDataError(key);
      }
      throw error;
    }
    const matchesSeedShape = Array.isArray(seed)
      ? Array.isArray(parsed)
      : seed === null
        ? parsed === null || typeof parsed === 'string'
        : typeof seed === 'object'
          ? typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
          : typeof parsed === typeof seed;
    if (!matchesSeedShape) throw this.corruptedDataError(key);
    return parsed as T;
  }

  private corruptedDataError(key: string): Error {
    return new Error(`Saved portfolio data "${key}" is corrupted. Restore a backup or clear this browser's saved data.`);
  }

  private write(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private nextId(items: Array<{ id: number }>): number {
    return Math.max(0, ...items.map((item) => item.id)) + 1;
  }

  private percentFor(level: string): number {
    const normalized = level.toLowerCase();
    if (normalized.includes('expert')) return 96;
    if (normalized.includes('advanced')) return 82;
    if (normalized.includes('intermediate')) return 65;
    if (normalized.includes('beginner')) return 38;
    return 58;
  }
}
