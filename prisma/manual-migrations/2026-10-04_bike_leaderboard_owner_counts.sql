-- The two cost metrics are backed by different owners (one needs a fuel amount,
-- the other a maintenance log), so each gets its own owner count.
ALTER TABLE "bike_leaderboard_stats" RENAME COLUMN "cost_owner_count" TO "running_owner_count";
ALTER TABLE "bike_leaderboard_stats" ADD COLUMN "maintenance_owner_count" INTEGER NOT NULL DEFAULT 0;
