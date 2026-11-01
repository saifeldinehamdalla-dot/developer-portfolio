# Developer Portfolio with CMS

A full-stack portfolio with an admin dashboard to manage projects, skills and contact messages.

**Live:** https://saif-hamdalla-software-engineer.vercel.app

## Tech stack
- **Frontend:** Angular (standalone components, signals), TypeScript, SCSS
- **Backend:** ASP.NET Core 9 Web API, Entity Framework Core, SQL Server
- **Auth:** JWT (admin only for write operations)

## Features
- Public portfolio: projects, skills, contact form
- Admin dashboard: CRUD for projects and skills, messages inbox, dark/light theme
- Repository pattern with swappable data source (local / API)

## Structure
- `frontend/` Angular app
- `backend/` ASP.NET Core API

## Run locally
### Backend
1. Copy `backend/appsettings.example.json` to `backend/appsettings.json` and fill in your connection string, JWT key and admin credentials.
2. `cd backend && dotnet ef database update && dotnet run`

### Frontend
1. `cd frontend && pnpm install`
2. Set `apiUrl` in `src/app/core/environments/` to your API.
3. `pnpm start`

## Author
Saif El Din Hamdalla, Cairo, Egypt. [LinkedIn](https://www.linkedin.com/in/saif-hamdalla-0402a9214/)
