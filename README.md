# FuelSense Backend (NestJS + Prisma + Supabase)

FuelSense is a backend service for motorcycle fuel tracking, bike management, admin moderation, and fuel-price updates.

This repository is the TypeScript migration target of a legacy FastAPI backend, implemented with:

- NestJS
- Prisma ORM (Prisma 7 adapter mode)
- PostgreSQL (Supabase)

## Current Status

Implemented modules:

- Auth (register/login with JWT)
- User profile (get/delete)
- Bikes (public and user flows)
- Admin bike moderation actions
- Refuel records
- Fuel prices (daily/summary/all/manual update)
- Unified success/error response layer

## Architecture

The codebase follows a clean architecture style per module:

- domain: entities + repository contracts
- application: use-cases + module services
- infrastructure: Prisma repository adapters
- presentation: controllers + DTOs

Primary source folders:

- src/modules
- src/common
- prisma/schema.prisma
- test/unit

## Environment

Create .env with at least:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
SECRET_KEY="your-secret"
PORT=3000
```

Notes:

- DATABASE_URL is used by runtime Prisma client.
- DIRECT_URL is used by Prisma migration/config tooling.

## Install and Run

```bash
npm install
npx prisma generate
npm run start:dev
```

Build:

```bash
npm run build
```

Unit tests:

```bash
npm run test
```

E2E tests:

```bash
npm run test:e2e
```

## Implemented API Endpoints

Health:

- GET /
- GET /health

Auth:

- POST /api/v1/auth/register
- POST /api/v1/auth/login

User:

- GET /api/v1/user/profile
- DELETE /api/v1/user/profile

Bikes:

- GET /api/v1/bikes
- GET /api/v1/bikes/my-bikes
- POST /api/v1/bikes/submit
- POST /api/v1/bikes/select
- POST /api/v1/bikes/remove

Admin:

- GET /api/v1/admin/pending-bikes
- PATCH /api/v1/admin/bikes/:bikeId
- POST /api/v1/admin/bikes/:bikeId/approve
- POST /api/v1/admin/bikes/:bikeId/reject
- DELETE /api/v1/admin/bikes/:bikeId

Refuel:

- POST /api/v1/refuel
- GET /api/v1/refuel

Fuel prices:

- GET /api/v1/daily-fuel
- GET /api/v1/fuel-sum
- GET /api/v1/all-fuel-data
- POST /api/v1/manual-fuel-update

## Response Contract

All successful and error responses are normalized to:

```json
{
  "success": true,
  "message": "...",
  "data": null,
  "listData": null,
  "token": null
}
```

- Success formatting is handled by a global interceptor.
- Error formatting is handled by a global exception filter.

## Rules Implemented from Migration Docs

- Bike submit is idempotent by variant.
- Bike select/remove are idempotent per user-bike relation.
- Admin approve prevents duplicate active bike variant.
- Refuel create enforces:
  - Exactly one of fuelLiter or fuelPrice
  - First refuel requires odometerReading
  - Later refuels require odometerReading or tripMeterReading
- Manual fuel update only inserts when values changed.

## Testing Layout

Unit tests are kept under:

- test/unit/auth
- test/unit/bikes
- test/unit/admin
- test/unit/refuel
- test/unit/fuel-prices
- test/unit/common

## Reference Docs

For migration context and legacy behavior mapping:

- docs/FULL_CODEBASE_REFERENCE.md
- docs/MIGRATION_GUIDE.md
- docs/NESTJS_MIGRATION_GUIDE.md
