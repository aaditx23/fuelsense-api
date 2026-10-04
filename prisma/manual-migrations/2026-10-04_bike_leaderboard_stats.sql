-- One row per bike model and period with the figures the leaderboard ranks on.
-- Rebuilt nightly from user_bikes, fuel_records and maintenance_records, so
-- reading the leaderboard never scans per-event tables. Additive.
CREATE TABLE "bike_leaderboard_stats" (
  "id" SERIAL NOT NULL,
  "bike_id" INTEGER NOT NULL,
  "period" TEXT NOT NULL,
  "owner_count" INTEGER NOT NULL DEFAULT 0,
  "cost_owner_count" INTEGER NOT NULL DEFAULT 0,
  "avg_mileage" DOUBLE PRECISION,
  "claim_ratio" DOUBLE PRECISION,
  "running_cost_per_km" DOUBLE PRECISION,
  "maintenance_cost_per_1000km" DOUBLE PRECISION,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bike_leaderboard_stats_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bike_leaderboard_stats_bike_id_fkey" FOREIGN KEY ("bike_id") REFERENCES "bikes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "uq_bike_leaderboard_bike_period" ON "bike_leaderboard_stats"("bike_id", "period");
CREATE INDEX "bike_leaderboard_stats_period_idx" ON "bike_leaderboard_stats"("period");
