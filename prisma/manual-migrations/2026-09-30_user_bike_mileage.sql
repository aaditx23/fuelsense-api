-- Stored reserve-cycle mileage totals per user bike. Additive: old API code
-- ignores the columns. Existing rows are filled by `npm run backfill:mileage`.
ALTER TABLE "user_bikes" ADD COLUMN "mileage_distance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "user_bikes" ADD COLUMN "mileage_fuel" DOUBLE PRECISION NOT NULL DEFAULT 0;
