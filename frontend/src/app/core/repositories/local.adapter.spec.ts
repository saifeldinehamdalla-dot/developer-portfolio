import { describe, expect, it, beforeEach } from 'vitest';
import { environment } from '../environments/environment';
import { LocalAdapter } from './local.adapter';

describe('LocalAdapter', () => {
  beforeEach(() => localStorage.clear());

  it('seeds demo content once and persists project, skill, and message CRUD', async () => {
    const adapter = new LocalAdapter();
    const seededProjects = await adapter.listProjects();
    expect(seededProjects.length).toBeGreaterThan(0);

    const project = await adapter.createProject({
      title: 'Test project',
      description: 'Project created by the adapter test.',
      gitHubUrl: 'https://github.com/example/test-project',
      liveUrl: '',
      imageUrl: '',
      tags: ['test'],
      featured: true,
      order: seededProjects.length,
    });
    expect(project.id).toBeGreaterThan(Math.max(...seededProjects.map((item) => item.id)));
    await adapter.updateProject({ ...project, title: 'Updated test project' });

    const skill = await adapter.createSkill({
      name: 'Test skill',
      level: 'Advanced',
      percentage: 80,
      category: 'Tools',
      order: 0,
    });
    const message = await adapter.createMessage({
      name: 'Test sender',
      email: 'sender@example.com',
      message: 'A test message.',
    });

    const reloadedAdapter = new LocalAdapter();
    expect((await reloadedAdapter.listProjects()).find((item) => item.id === project.id)?.title)
      .toBe('Updated test project');
    expect((await reloadedAdapter.listSkills()).find((item) => item.id === skill.id)?.name)
      .toBe('Test skill');
    expect((await reloadedAdapter.listMessages()).find((item) => item.id === message.id)?.message)
      .toBe('A test message.');

    await reloadedAdapter.deleteProject(project.id);
    await reloadedAdapter.deleteSkill(skill.id);
    await reloadedAdapter.deleteMessage(message.id);
    expect((await adapter.listProjects()).some((item) => item.id === project.id)).toBe(false);
    expect((await adapter.listSkills()).some((item) => item.id === skill.id)).toBe(false);
    expect((await adapter.listMessages()).some((item) => item.id === message.id)).toBe(false);
  });

  it('expires local login sessions after eight hours', async () => {
    const startedAt = Date.now();
    const session = await new LocalAdapter().login(environment.adminUsername, environment.adminPassword);
    expect(session.expiresAt - startedAt).toBe(8 * 60 * 60 * 1000);
  });

  it('surfaces corrupted storage without overwriting it with demo data', async () => {
    localStorage.setItem('portfolio-projects', '{}');
    await expect(new LocalAdapter().listProjects())
      .rejects.toThrow(/portfolio-projects.*corrupted/i);
    expect(localStorage.getItem('portfolio-projects')).toBe('{}');
  });
});
