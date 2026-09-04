# Audit

A shared content-audit workspace built with Next.js, Convex, and Vercel.
Passcode-based access profiles control edit/view permissions and project scope;
passcodes live only in the Convex deployment environment.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npx convex dev
npm run dev
npm run build
```

When Convex opens its dashboard, set the following variables in both development
and production deployments:

- `AUDIT_EDITOR_PASSCODE`: edit and view access to every project
- `AUDIT_GENERAL_VIEW_PASSCODE`: view-only access to every project
- `AUDIT_COM_VIEW_PASSCODE`: view-only access to City of Mara (COM)
- `AUDIT_NORDONE_VIEW_PASSCODE`: view-only access to NordOne
- `AUDIT_VIA_VIEW_PASSCODE`: view-only access to Via Carmina and Via Universitate
- `AUDIT_VIVALIA_VIEW_PASSCODE`: view-only access to Vivalia

`AUDIT_PASSCODE` remains supported as a legacy alias for the editor passcode.
Do not expose these values through `NEXT_PUBLIC_` variables or client-side code.

## Vercel

Import this directory into Vercel and add a `CONVEX_DEPLOY_KEY` environment
variable. `vercel.json` deploys the Convex backend first and passes its public
URL into the Next.js build automatically.

## Included Shape

- edit the interface under `app/`
- edit backend functions and schema under `convex/`
- reports and uploaded images are shared through Convex
- sessions expire after 30 days and all data functions validate the session,
  project scope, and write permission on the Convex backend

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the production build
- `npm run convex:dev`: sync backend functions during development

## Learn More

- [Convex Next.js quickstart](https://docs.convex.dev/quickstart/nextjs)
- [Convex on Vercel](https://docs.convex.dev/production/hosting/vercel)
