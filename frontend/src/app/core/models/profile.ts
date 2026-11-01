export interface SocialLink {
  label: string;
  url: string;
}

export interface PortfolioProfile {
  name: string;
  initials: string;
  role: string;
  roles: string[];
  headline: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  yearsExperience: string;
  projectsCount: string;
  photoUrl: string;
  resumeUrl: string;
  socialLinks: { github: string; linkedin: string };
  otherSocialLinks: SocialLink[];
  availability: string;
  seoTitle: string;
  seoDescription: string;
  sectionVisibility: {
    about: boolean;
    skills: boolean;
    projects: boolean;
    contact: boolean;
  };
  accentColor: string;
  defaultTheme: 'dark' | 'light';
}
