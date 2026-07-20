-- Add carbon_goal_kg to users so each user can set a personal weekly carbon target.
-- Default 10 matches the previous hardcoded WEEKLY_CARBON_GOAL_KG constant.
ALTER TABLE users ADD COLUMN carbon_goal_kg REAL NOT NULL DEFAULT 10 CHECK (carbon_goal_kg > 0 AND carbon_goal_kg <= 1000);
