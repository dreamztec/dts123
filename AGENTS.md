# DTS Fast Ride Architecture

## Overview

Dreamz Transportz Servicez is a mobile-first premium mobility PWA built with TanStack Start and deployed on Netlify. It combines a public marketing site, role-specific workspaces, Netlify Identity authentication, Netlify Database persistence, configurable business engines, and serverless integration adapters.

## Key Directories

- `src/routes/` — file-based public, customer, driver, fleet, corporate and admin routes.
- `src/components/` — branded marketing, authentication, booking and workspace components.
- `src/lib/` — domain states, pricing, shared-ride matching and Identity context.
- `src/services/` — replaceable interfaces for maps, payments, messaging, flight data and telematics.
- `db/` — Drizzle schema, Netlify Database client and demo seed.
- `netlify/functions/` — authenticated APIs, location collection and payment webhooks.
- `netlify/database/migrations/` — generated production database migrations.
- `public/` — PWA manifest, service worker, icon and SEO assets.
- `tests/` — focused unit tests for business-critical engines.

## Conventions

- Keep all persistent structured data in Netlify Database using Drizzle.
- Use snake_case database column names and camelCase TypeScript properties.
- Never invent live GPS, fare, payment, flight, availability or telemetry data.
- Provider-dependent UI must show an explicit “not connected” state.
- Protect data on the server; frontend role navigation is not an authorisation boundary.
- Add every schema change to `db/schema.ts` and generate a migration in `netlify/database/migrations/`.
- Treat cities, routes, vehicle classes, pricing, memberships and operational rules as database configuration.
- Use the trip and shared-ride state models rather than arbitrary status mutation.

## Non-Obvious Decisions

- `/$.tsx` supplies a deliberate module shell for the extensive route surface while dedicated high-traffic routes carry richer experiences.
- Demo UI is labelled even when it does not access seeded data; production integrations remain empty until configured.
- Shared matching is deterministic and geospatially constrained so it can later be replaced by optimisation without changing the participant model.
- Membership benefit snapshots and pricing snapshots preserve what applied at transaction time.
