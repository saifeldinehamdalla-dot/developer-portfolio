import { describe, expect, it } from 'vitest';
import { isPortfolioBackup, PortfolioBackup } from './portfolio-backup';
import { portfolioConfig } from '../portfolio.config';

describe('isPortfolioBackup', () => {
  const validBackup: PortfolioBackup = {
    format: 'portfolio-cms-backup',
    version: 1,
    exportedAt: '2026-01-01T00:00:00.000Z',
    projects: [],
    skills: [],
    messages: [],
    profile: portfolioConfig,
    images: [],
  };

  it('accepts a valid versioned backup', () => {
    expect(isPortfolioBackup(validBackup)).toBe(true);
  });

  it('rejects unsupported versions and unsafe profile URLs', () => {
    expect(isPortfolioBackup({ ...validBackup, version: 2 })).toBe(false);
    expect(isPortfolioBackup({
      ...validBackup,
      profile: { ...portfolioConfig, photoUrl: 'javascript:alert(1)' },
    })).toBe(false);
  });
});
