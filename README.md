This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Developer tooling (recommended MCP servers)

These [MCP](https://modelcontextprotocol.io) servers make working on this project in an AI coding
agent (e.g. Claude Code) much smoother. Add the ones you use:

| MCP | Why it helps here | Setup |
| --- | --- | --- |
| **Neon** | Create dev/preview **DB branches**, run SQL, inspect schema, apply migrations — ideal for giving `dev`/preview deploys their own database. | `claude mcp add neon -- npx -y @neondatabase/mcp-server-neon start` |
| **Netlify** | Trigger deploys, read build logs, set env vars, check deploy/preview status without CLI round-trips. | `claude mcp add netlify -- npx -y @netlify/mcp` |
| **Chrome DevTools / Playwright** | Drive a real browser to click through OAuth, verify the heatmap/appointments UI, and screenshot. | `claude mcp add playwright -- npx -y @playwright/mcp@latest` |
| **Context7** | Pull up-to-date docs for the fast-moving libs we use (Next 16, Better Auth, Prisma 7). | `claude mcp add context7 -- npx -y @upstash/context7-mcp` |

> Tip: Neon + Netlify together let an agent provision a preview DB and wire it into a Netlify deploy
> preview end-to-end. None are required to run the app locally.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
