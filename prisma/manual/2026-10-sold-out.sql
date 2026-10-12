-- Adds the studio's sold-out switch to Product.
--
-- Run this on the LIVE database BEFORE deploying the code that reads it.
-- Additive and idempotent: safe to run twice, and the currently-deployed code
-- ignores the extra column, so there is no downtime in either order of events
-- except "deploy first, then forget this" — that makes every page error.
--
-- Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "soldOut" BOOLEAN NOT NULL DEFAULT false;

-- Check: every existing piece should come back with soldOut = false.
SELECT "soldOut", COUNT(*) FROM "Product" GROUP BY "soldOut";
