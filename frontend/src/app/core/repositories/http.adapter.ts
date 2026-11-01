import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { ContactMessage, NewContactMessage } from '../models/contact-message';
import { Project, ProjectInput } from '../models/project';
import { Skill, SkillInput } from '../models/skill';
import {
  AuthRepo,
  AuthSession,
  MessagesRepo,
  ProjectsRepo,
  SkillsRepo,
} from './repository.tokens';

function normalizeProject(project: Project): Project {
  return {
    ...project,
    gitHubUrl: project.gitHubUrl ?? '',
    imageUrl: project.imageUrl ?? '',
    liveUrl: project.liveUrl ?? undefined,
    tags: project.tags ?? [],
    featured: project.featured ?? false,
    order: project.order ?? 0,
  };
}

function normalizeSkill(skill: Skill): Skill {
  return {
    ...skill,
    percentage: skill.percentage ?? undefined,
    category: skill.category ?? undefined,
    order: skill.order ?? 0,
  };
}

@Injectable({ providedIn: 'root' })
export class HttpAdapter implements ProjectsRepo, SkillsRepo, MessagesRepo, AuthRepo {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl.replace(/\/$/, '');

  async listProjects(): Promise<Project[]> {
    const projects = await firstValueFrom(this.http.get<Project[]>(`${this.apiUrl}/Projects`));
    return projects.map(normalizeProject);
  }

  async createProject(input: ProjectInput): Promise<Project> {
    const project = await firstValueFrom(this.http.post<Project>(`${this.apiUrl}/Projects`, input));
    return normalizeProject(project);
  }

  async updateProject(project: Project): Promise<void> {
    await firstValueFrom(this.http.put<void>(`${this.apiUrl}/Projects/${project.id}`, project));
  }

  async deleteProject(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/Projects/${id}`));
  }

  async replaceProjects(items: Project[]): Promise<void> {
    const current = await this.listProjects();
    const desiredIds = new Set(items.map((item) => item.id));
    const currentIds = new Set(current.map((item) => item.id));
    await Promise.all(current.filter((item) => !desiredIds.has(item.id)).map((item) => this.deleteProject(item.id)));
    await Promise.all(items.map(async ({ id, ...input }) => {
      if (currentIds.has(id)) {
        await this.updateProject({ ...input, id });
      } else {
        await this.createProject(input);
      }
    }));
  }

  async listSkills(): Promise<Skill[]> {
    const skills = await firstValueFrom(this.http.get<Skill[]>(`${this.apiUrl}/Skills`));
    return skills.map(normalizeSkill);
  }

  async createSkill(input: SkillInput): Promise<Skill> {
    const skill = await firstValueFrom(this.http.post<Skill>(`${this.apiUrl}/Skills`, input));
    return normalizeSkill(skill);
  }

  async updateSkill(skill: Skill): Promise<void> {
    await firstValueFrom(this.http.put<void>(`${this.apiUrl}/Skills/${skill.id}`, skill));
  }

  async deleteSkill(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/Skills/${id}`));
  }

  async replaceSkills(items: Skill[]): Promise<void> {
    const current = await this.listSkills();
    const desiredIds = new Set(items.map((item) => item.id));
    const currentIds = new Set(current.map((item) => item.id));
    await Promise.all(current.filter((item) => !desiredIds.has(item.id)).map((item) => this.deleteSkill(item.id)));
    await Promise.all(items.map(async ({ id, ...input }) => {
      if (currentIds.has(id)) {
        await this.updateSkill({ ...input, id });
      } else {
        await this.createSkill(input);
      }
    }));
  }

  async listMessages(): Promise<ContactMessage[]> {
    return firstValueFrom(this.http.get<ContactMessage[]>(`${this.apiUrl}/Messages`));
  }

  async countUnreadMessages(): Promise<number> {
    const response = await firstValueFrom(
      this.http.get<{ count: number } | number>(`${this.apiUrl}/Messages/unread-count`),
    );
    return typeof response === 'number' ? response : response.count;
  }

  async createMessage(input: NewContactMessage): Promise<ContactMessage> {
    return firstValueFrom(this.http.post<ContactMessage>(`${this.apiUrl}/Messages`, input));
  }

  async setMessageRead(id: number, isRead: boolean): Promise<void> {
    await firstValueFrom(this.http.put<void>(`${this.apiUrl}/Messages/${id}/read?isRead=${isRead}`, {}));
  }

  async deleteMessage(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/Messages/${id}`));
  }

  async replaceMessages(items: ContactMessage[]): Promise<void> {
    const current = await this.listMessages();
    const existingById = new Map(current.map((item) => [item.id, item]));
    const unchanged = items.filter((item) => {
      const existing = existingById.get(item.id);
      return existing &&
        existing.name === item.name &&
        existing.email === item.email &&
        existing.message === item.message &&
        existing.createdAt === item.createdAt;
    });
    const unchangedIds = new Set(unchanged.map((item) => item.id));
    await Promise.all(current.filter((item) => !unchangedIds.has(item.id)).map((item) => this.deleteMessage(item.id)));
    for (const item of items) {
      if (unchangedIds.has(item.id)) {
        await this.setMessageRead(item.id, item.isRead);
        continue;
      }
      const created = await this.createMessage({
        name: item.name,
        email: item.email,
        message: item.message,
      });
      if (item.isRead) await this.setMessageRead(created.id, true);
    }
  }

  async login(username: string, password: string): Promise<AuthSession> {
    const response = await firstValueFrom(
      this.http.post<{ token: string }>(`${this.apiUrl}/Auth/login`, { username, password }),
    );
    if (typeof response.token !== 'string' || !response.token.trim()) {
      throw new Error('The authentication service did not return a valid token.');
    }
    return { token: response.token, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
  }

  async changePassword(): Promise<void> {
    throw new Error('Password changes are not supported by the API contract yet.');
  }
}
