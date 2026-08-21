# Premium Oils Website

A Next.js storefront for an edible oils brand with server-rendered pages, API routes, and a MongoDB data layer.

## Tech stack

- Frontend + Backend: Next.js (App Router, API routes)
- Database: MongoDB
- Auth: Google Sign-In + JWT-based user/admin authentication

## Project structure

- [frontend-next](frontend-next): the Next.js app — pages, API routes, and all product code
- [memory](memory): product requirements and planning notes

## Local development

```bash
cd frontend-next
npm install
npm run dev
```

## Environment variables

Copy the example env file and fill in real values before running the app:

```bash
cp frontend-next/.env.example frontend-next/.env.local
```

See [frontend-next/.env.example](frontend-next/.env.example) for the required variables.

## Deployment

Deployed on Vercel (see [vercel.json](vercel.json)), with MongoDB Atlas as the database.

## Notes

This project was generated from an initial scaffold and is now being prepared for real deployment and production configuration.
