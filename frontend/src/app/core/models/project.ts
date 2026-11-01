export interface Project {
  id: number;
  title: string;
  description: string;
  gitHubUrl: string;
  imageUrl: string;
  liveUrl?: string;
  tags?: string[];
  featured?: boolean;
  order?: number;
}

export type ProjectInput = Omit<Project, 'id'>;
