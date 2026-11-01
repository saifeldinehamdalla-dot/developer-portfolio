import { PortfolioProfile } from './models/profile';

/**
 * Edit this file to personalize the portfolio. This is the DEFAULT content
 * (seed) that visitors see until profile data is served by the backend.
 */
export const portfolioConfig: PortfolioProfile = {
  name: 'Saif El Din Hamdalla',
  initials: 'SH',
  role: 'Full-Stack Web Developer',
  roles: [
    'Full-Stack Developer',
    'ASP.NET Core Developer',
    'Angular Developer',
    'NetSuite SuiteScript Developer',
  ],
  headline: 'I build full-stack web apps that run real businesses.',
  tagline:
    'ASP.NET Core, Angular, Node.js and SQL Server, from the database to the UI.',
  bio: 'I’m a Business Information Systems graduate from Cairo University and a full-stack developer who enjoys turning real business problems into working software. I’ve built an e-commerce platform with an admin dashboard (Node.js, Angular, MongoDB) and an HR & Attendance Management System (ASP.NET Core, SQL Server, Entity Framework Core) with leave calculation and an ATS module that ranks CVs against job requirements. I work directly with clients on requirements, and I’m currently training as a NetSuite SuiteScript developer.',
  location: 'Cairo, Egypt',
  email: 'saifeldinehamdalla@gmail.com',
  yearsExperience: '3',
  projectsCount: '5+',
photoUrl: '/NewImage.png',
resumeUrl: '/Saif_Hamdalla_CV_Web_Developer.pdf',
  socialLinks: {
    github: 'https://github.com/saifeldinehamdalla-dot',
    linkedin: 'https://www.linkedin.com/in/saif-hamdalla-0402a9214/',
  },
  otherSocialLinks: [
  { label: 'WhatsApp', url: 'https://wa.me/201119199793' },
],
  availability: 'Open to full-time and freelance roles',
  seoTitle: 'Saif Hamdalla | Full-Stack Developer (ASP.NET Core & Angular)',
  seoDescription:
    'Portfolio of Saif Hamdalla, a Cairo-based full-stack developer building web apps with ASP.NET Core, Angular, Node.js and SQL Server.',
  sectionVisibility: { about: true, skills: true, projects: true, contact: true },
  accentColor: '#a39bff',
  defaultTheme: 'dark',
};