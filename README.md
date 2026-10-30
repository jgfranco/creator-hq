# Creator HQ

Business management platform for content creators: campaigns, deliverables, invoicing, and payments.

## Tech stack

Next.js (App Router) · TypeScript · PostgreSQL · Prisma · Tailwind

## Run locally

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm run dev
```

Health check: http://localhost:3000/api/health
