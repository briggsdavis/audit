# Audit

A shared content-audit workspace built with Next.js, Convex, and Vercel. One
shared passcode unlocks the workspace for all collaborators; the passcode lives
only in the Convex deployment environment.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npx convex dev
npm run dev
npm run build
```

When Convex opens its dashboard, set `AUDIT_PASSCODE` in the development and
production deployments. Use a long, randomly generated passphrase.

## Vercel

Import this directory into Vercel and add a `CONVEX_DEPLOY_KEY` environment
variable. `vercel.json` deploys the Convex backend first and passes its public
URL into the Next.js build automatically.

## Included Shape

- edit the interface under `app/`
- edit backend functions and schema under `convex/`
- reports and uploaded images are shared through Convex
- sessions expire after 30 days and all data functions validate the session

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the production build
- `npm run convex:dev`: sync backend functions during development

## Learn More

- [Convex Next.js quickstart](https://docs.convex.dev/quickstart/nextjs)
- [Convex on Vercel](https://docs.convex.dev/production/hosting/vercel)
