-- Add per-user weekly carbon goal (kg CO2e). Default matches the hard-coded
-- WEEKLY_CARBON_GOAL_KG constant so existing users keep the same behaviour.
ALTER TABLE users ADD COLUMN weekly_carbon_goal REAL DEFAULT 10.0;
