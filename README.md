# Mine Frontend

TanStack Start application for the Mine personal dashboard.

Live site: https://mine.mahathir.site

## Stack

- TanStack Start, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- Zustand, React Hook Form, Zod

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | empty in prod | Backend API base URL. Leave empty in production (same-origin `/api`). |

## Local development

```bash
npm install
npm run dev
```

App runs at http://localhost:3000. Requires the backend API on port 8080.

## Production

Build output: `.output/` and `public/`

Server path: `/opt/mine/frontend`

## CI/CD

GitHub secrets: `DEPLOY_SSH_KEY`, `VPS_HOST`, `VPS_PORT`, `VPS_USER`

Pushes to `main` build and deploy to the VPS.
