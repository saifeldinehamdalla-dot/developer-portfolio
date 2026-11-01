import { InjectionToken } from '@angular/core';
import { ContactMessage, NewContactMessage } from '../models/contact-message';
import { MediaAsset } from '../models/media-asset';
import { PortfolioProfile } from '../models/profile';
import { Project, ProjectInput } from '../models/project';
import { Skill, SkillInput } from '../models/skill';

export interface ProjectsRepo {
  listProjects(): Promise<Project[]>;
  createProject(input: ProjectInput): Promise<Project>;
  updateProject(project: Project): Promise<void>;
  deleteProject(id: number): Promise<void>;
  replaceProjects(items: Project[]): Promise<void>;
}

export interface SkillsRepo {
  listSkills(): Promise<Skill[]>;
  createSkill(input: SkillInput): Promise<Skill>;
  updateSkill(skill: Skill): Promise<void>;
  deleteSkill(id: number): Promise<void>;
  replaceSkills(items: Skill[]): Promise<void>;
}

export interface MessagesRepo {
  listMessages(): Promise<ContactMessage[]>;
  countUnreadMessages(): Promise<number>;
  createMessage(input: NewContactMessage): Promise<ContactMessage>;
  setMessageRead(id: number, isRead: boolean): Promise<void>;
  deleteMessage(id: number): Promise<void>;
  replaceMessages(items: ContactMessage[]): Promise<void>;
}

export interface ProfileRepo {
  getProfile(): Promise<PortfolioProfile>;
  saveProfile(profile: PortfolioProfile): Promise<void>;
}

export interface AuthSession {
  token: string;
  expiresAt: number;
}

export interface AuthRepo {
  login(username: string, password: string): Promise<AuthSession>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

export interface MediaRepo {
  list(): Promise<MediaAsset[]>;
  get(id: string): Promise<MediaAsset | undefined>;
  upload(file: File): Promise<string>;
  rename(id: string, name: string): Promise<void>;
  delete(id: string): Promise<void>;
  replaceAll(items: MediaAsset[]): Promise<void>;
}

export const PROJECTS_REPO = new InjectionToken<ProjectsRepo>('PROJECTS_REPO');
export const SKILLS_REPO = new InjectionToken<SkillsRepo>('SKILLS_REPO');
export const MESSAGES_REPO = new InjectionToken<MessagesRepo>('MESSAGES_REPO');
export const PROFILE_REPO = new InjectionToken<ProfileRepo>('PROFILE_REPO');
export const AUTH_REPO = new InjectionToken<AuthRepo>('AUTH_REPO');
export const MEDIA_REPO = new InjectionToken<MediaRepo>('MEDIA_REPO');
