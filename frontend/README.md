# IntualAI Frontend

This is the frontend for the IntualAI project, located under in GitHub. It is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install


Then, run the development server:

npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Project Overview
- Open http://localhost:3000 with your browser to see the result.
- Edit `pages/index.tsx` to modify the page; it auto-updates as you edit.

API Routes
- Access API routes at http://localhost:3000/api/hello, edit in `pages/api/hello.ts`.
- `pages/api` directory maps to `/api/*` for API routes instead of React pages.

Fonts
- Uses `next/font` to optimize and load Inter, a custom Google Font.

Directory Structure
- components: Reusable React components.
- lib: Utility functions and configurations.
- pages: Next.js pages for routing.
- public: Static files served by Next.js.
- styles: Global and component-specific styles.

Configuration Files
- .env.local: Environment variables.
- next.config.js: Next.js configuration.
- tailwind.config.ts: Tailwind CSS configuration.
- tsconfig.json: TypeScript configuration.
- fly.toml: Fly.io deployment configuration.
- Dockerfile: Docker configuration for containerization.

Learn More
- Next.js Documentation: https://nextjs.org/docs
- Learn Next.js: https://nextjs.org/learn
- Next.js GitHub Repository: https://github.com/vercel/next.js
