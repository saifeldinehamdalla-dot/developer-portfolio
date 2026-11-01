import { ContactMessage } from './contact-message';
import { MediaAsset } from './media-asset';
import { PortfolioProfile } from './profile';
import { Project } from './project';
import { Skill } from './skill';
import { isHttpUrl, isSafeAssetReference } from '../utils/url-validation';

export interface PortfolioBackup {
  format: 'portfolio-cms-backup';
  version: 1;
  exportedAt: string;
  projects: Project[];
  skills: Skill[];
  messages: ContactMessage[];
  profile: PortfolioProfile;
  images: MediaAsset[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isValidDate(value: unknown): value is string {
  return isString(value) && Number.isFinite(Date.parse(value));
}

function isUniqueIdList(items: unknown[], getId: (item: unknown) => unknown): boolean {
  const ids = items.map(getId);
  return ids.every((id) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0) &&
    new Set(ids).size === ids.length;
}

function isProject(value: unknown): value is Project {
  if (!isRecord(value)) return false;
  const id = value['id'];
  return typeof id === 'number' &&
    Number.isSafeInteger(id) &&
    id > 0 &&
    isString(value['title']) &&
    isString(value['description']) &&
    isString(value['gitHubUrl']) &&
    isHttpUrl(value['gitHubUrl']) &&
    isString(value['imageUrl']) &&
    isSafeAssetReference(value['imageUrl']) &&
    (value['liveUrl'] === undefined || (isString(value['liveUrl']) && (!value['liveUrl'] || isHttpUrl(value['liveUrl'])))) &&
    (value['tags'] === undefined || (Array.isArray(value['tags']) && value['tags'].every(isString))) &&
    (value['featured'] === undefined || typeof value['featured'] === 'boolean') &&
    (value['order'] === undefined || (typeof value['order'] === 'number' && Number.isFinite(value['order'])));
}

function isSkill(value: unknown): value is Skill {
  if (!isRecord(value)) return false;
  const categories = ['Frontend', 'Backend', 'Database', 'Tools', 'Other'];
  const id = value['id'];
  return typeof id === 'number' &&
    Number.isSafeInteger(id) &&
    id > 0 &&
    isString(value['name']) &&
    isString(value['level']) &&
    (value['percentage'] === undefined ||
      (typeof value['percentage'] === 'number' && value['percentage'] >= 0 && value['percentage'] <= 100)) &&
    (value['category'] === undefined || categories.includes(String(value['category']))) &&
    (value['order'] === undefined || (typeof value['order'] === 'number' && Number.isFinite(value['order'])));
}

function isContactMessage(value: unknown): value is ContactMessage {
  if (!isRecord(value)) return false;
  const id = value['id'];
  return typeof id === 'number' &&
    Number.isSafeInteger(id) &&
    id > 0 &&
    isString(value['name']) &&
    isString(value['email']) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value['email']) &&
    isString(value['message']) &&
    isValidDate(value['createdAt']) &&
    typeof value['isRead'] === 'boolean';
}

function isSocialLinks(value: unknown): value is PortfolioProfile['socialLinks'] {
  return isRecord(value) &&
    isString(value['github']) &&
    (!value['github'] || isHttpUrl(value['github'])) &&
    isString(value['linkedin']) &&
    (!value['linkedin'] || isHttpUrl(value['linkedin']));
}

function isPortfolioProfile(value: unknown): value is PortfolioProfile {
  if (!isRecord(value) || !isRecord(value['sectionVisibility'])) return false;
  const stringFields = [
    'name', 'initials', 'role', 'headline', 'tagline', 'bio', 'location', 'email',
    'yearsExperience', 'projectsCount', 'photoUrl', 'resumeUrl', 'availability',
    'seoTitle', 'seoDescription', 'accentColor',
  ];
  const visibility = value['sectionVisibility'];
  return stringFields.every((field) => isString(value[field])) &&
    (value['email'] === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value['email']))) &&
    Array.isArray(value['roles']) && value['roles'].every(isString) &&
    isSafeAssetReference(String(value['photoUrl'])) &&
    isSafeAssetReference(String(value['resumeUrl'])) &&
    isSocialLinks(value['socialLinks']) &&
    Array.isArray(value['otherSocialLinks']) &&
    value['otherSocialLinks'].every((item: unknown) =>
      isRecord(item) && isString(item['label']) && isString(item['url']) && isHttpUrl(item['url']),
    ) &&
    ['about', 'skills', 'projects', 'contact'].every((key) => typeof visibility[key] === 'boolean') &&
    /^#[0-9a-f]{6}$/i.test(String(value['accentColor'])) &&
    (value['defaultTheme'] === 'dark' || value['defaultTheme'] === 'light');
}

function isMediaAsset(value: unknown): value is MediaAsset {
  if (!isRecord(value)) return false;
  const isImage = value['mimeType'] === 'image/webp';
  const isPdf = value['mimeType'] === 'application/pdf';
  const dataUrl = value['dataUrl'];
  return isString(value['id']) &&
    /^[A-Za-z0-9_-]+$/.test(value['id']) &&
    isString(value['name']) &&
    isString(dataUrl) &&
    ((isImage && /^data:image\/webp;base64,[A-Za-z0-9+/]*={0,2}$/.test(dataUrl)) ||
      (isPdf && /^data:application\/pdf;base64,[A-Za-z0-9+/]*={0,2}$/.test(dataUrl))) &&
    typeof value['size'] === 'number' &&
    Number.isFinite(value['size']) &&
    value['size'] >= 0 &&
    isValidDate(value['updatedAt']);
}

export function isPortfolioBackup(value: unknown): value is PortfolioBackup {
  if (!isRecord(value) || value['format'] !== 'portfolio-cms-backup' || value['version'] !== 1) {
    return false;
  }
  const { projects, skills, messages, images } = value;
  return isValidDate(value['exportedAt']) &&
    Array.isArray(projects) && projects.every(isProject) && isUniqueIdList(projects, (item) => isRecord(item) ? item['id'] : null) &&
    Array.isArray(skills) && skills.every(isSkill) && isUniqueIdList(skills, (item) => isRecord(item) ? item['id'] : null) &&
    Array.isArray(messages) && messages.every(isContactMessage) && isUniqueIdList(messages, (item) => isRecord(item) ? item['id'] : null) &&
    Array.isArray(images) && images.every(isMediaAsset) &&
    new Set(images.map((item) => isRecord(item) ? item['id'] : null)).size === images.length &&
    isPortfolioProfile(value['profile']);
}
