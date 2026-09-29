-- Refuel entry type: enum + column, then backfill existing rows.
-- Additive and backward-compatible (old API code ignores the column).
-- Existing rows carrying reserve readings were completed reserve entries
-- (incomplete markers were never stored before this change).
BEGIN;

CREATE TYPE "RefuelEntryType" AS ENUM ('RESERVE_INCOMPLETE', 'RESERVE_COMPLETE', 'TOPUP');

ALTER TABLE "fuel_records" ADD COLUMN "entry_type" "RefuelEntryType" NOT NULL DEFAULT 'TOPUP';

UPDATE "fuel_records"
SET "entry_type" = 'RESERVE_COMPLETE'
WHERE "trip_meter_at_reserve" IS NOT NULL
   OR "odometer_at_reserve" IS NOT NULL;

COMMIT;
