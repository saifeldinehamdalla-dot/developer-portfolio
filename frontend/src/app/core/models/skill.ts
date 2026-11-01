export interface Skill {
  id: number;
  name: string;
  level: string;
  percentage?: number | null;
  category?: 'Frontend' | 'Backend' | 'Database' | 'Tools' | 'Other' | null;
  order?: number;
}

export type SkillInput = Omit<Skill, 'id'>;
