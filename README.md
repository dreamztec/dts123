# Dreamz Transportz Servicez — DTS Fast Ride

A production-oriented foundation for a Nigerian premium transportation, chauffeur, membership, corporate mobility and managed fleet platform. The application is mobile-first, installable as a PWA, deployable to Netlify and intentionally avoids presenting invented live operational data.

## Technology

- TanStack Start, React 19 and TypeScript
- Tailwind CSS 4 with a custom premium DTS design system
- Netlify Identity via `@netlify/identity`
- Netlify Database managed Postgres with Drizzle ORM
- Netlify Functions for secure APIs and webhooks
- Browser geolocation architecture, service worker and web app manifest

## Local Development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and configure only the providers being tested.
3. Start the Netlify development environment with `netlify dev --port 8889`.
4. Open the URL printed by Netlify CLI.

Netlify Identity authentication requires a deployed Netlify environment; local development does not provide the hosted Identity backend.

## Database

Netlify Database is automatically provisioned on first connection. Schema is defined in `db/schema.ts`, and deploy-time migrations are stored in `netlify/database/migrations/`.

- Generate a migration: `pnpm db:generate -- --name add_descriptive_change`
- Seed an isolated development database: set `DTS_DEMO_MODE=true`, then run `pnpm db:seed`

Never seed a production database. Demo vehicles and records do not imply DTS ownership or live operations.

## Deployment

1. Connect the repository to the Netlify site.
2. Configure runtime environment variables from `.env.example` in Netlify.
3. Configure Netlify Identity registration, email templates and approved OAuth providers.
4. Add the Paystack webhook endpoint `/api/webhooks/paystack` and matching secret.
5. Configure Mapbox or Google Maps before enabling location-dependent customer experiences.
6. Deploy. Netlify applies database migrations and runs the configured TanStack Start build.

## Security Notes

Payment success is accepted only after server-side signature, amount, currency and reference verification. Driver location updates require an authenticated driver, a matching trip assignment and an authorised trip state. Sensitive administrative operations should follow the same server-side role checks and audit logging patterns shown in the functions.

Legal terms, privacy policy, cancellation language, retention periods and emergency procedures require approval from qualified Nigerian legal and operations teams before public launch.
