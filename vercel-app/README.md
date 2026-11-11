# Word Stream — Vercel build

A standalone Vite + React + Tailwind SPA that mirrors the Lexical Chronos live
word-stream UI. No server, no Base44 runtime — pure client-side rendering, so it
deploys to Vercel as static output.

## How it builds on Vercel

The repo root has a `vercel.json` that tells Vercel to build **this** folder and
serve its `dist/` as static assets. No Vercel project settings need to change:

- install step is skipped at the repo root (the root package.json is the Base44
  app and is not meant to run on Vercel)
- build runs `npm install` + `npm run build` here (`vite build`)
- output directory is `vercel-app/dist`

## Run locally

```bash
cd vercel-app
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview
```
