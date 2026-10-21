-- Issue #1: Prevent direct Data API exposure of Express/Prisma-managed tables.
-- The web application authenticates via Express/JWT and accesses PostgreSQL via Prisma.
-- This migration deliberately DOES NOT modify any data, service_role privileges or PostgreSQL owner privileges.
-- IMPORTANT: Validate Prisma connection role and API expectations in staging before deployment.
-- Separate deliberately exposed client tables require independent policies.

REVOKE ALL PRIVILEGES ON TABLE public."build_draft_images" FROM anon, authenticated;
ALTER TABLE public."build_draft_images" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."build_drafts" FROM anon, authenticated;
ALTER TABLE public."build_drafts" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."build_post_images" FROM anon, authenticated;
ALTER TABLE public."build_post_images" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."build_posts" FROM anon, authenticated;
ALTER TABLE public."build_posts" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."gbf_master_availability_links" FROM anon, authenticated;
ALTER TABLE public."gbf_master_availability_links" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."goals" FROM anon, authenticated;
ALTER TABLE public."goals" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."progress_condition_progresses" FROM anon, authenticated;
ALTER TABLE public."progress_condition_progresses" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."progress_goals" FROM anon, authenticated;
ALTER TABLE public."progress_goals" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."progress_stage_progresses" FROM anon, authenticated;
ALTER TABLE public."progress_stage_progresses" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guide_references" FROM anon, authenticated;
ALTER TABLE public."raid_guide_references" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guide_row_links" FROM anon, authenticated;
ALTER TABLE public."raid_guide_row_links" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guide_rows" FROM anon, authenticated;
ALTER TABLE public."raid_guide_rows" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guide_sections" FROM anon, authenticated;
ALTER TABLE public."raid_guide_sections" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guide_sticky_notes" FROM anon, authenticated;
ALTER TABLE public."raid_guide_sticky_notes" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guide_strategies" FROM anon, authenticated;
ALTER TABLE public."raid_guide_strategies" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."raid_guides" FROM anon, authenticated;
ALTER TABLE public."raid_guides" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."round_goals" FROM anon, authenticated;
ALTER TABLE public."round_goals" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_availability_periods" FROM anon, authenticated;
ALTER TABLE public."spark_availability_periods" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_reward_event_types" FROM anon, authenticated;
ALTER TABLE public."spark_reward_event_types" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_reward_month_statuses" FROM anon, authenticated;
ALTER TABLE public."spark_reward_month_statuses" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_reward_records" FROM anon, authenticated;
ALTER TABLE public."spark_reward_records" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_reward_schedules" FROM anon, authenticated;
ALTER TABLE public."spark_reward_schedules" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_savings" FROM anon, authenticated;
ALTER TABLE public."spark_savings" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_savings_histories" FROM anon, authenticated;
ALTER TABLE public."spark_savings_histories" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_shared_audit_logs" FROM anon, authenticated;
ALTER TABLE public."spark_shared_audit_logs" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_target_availability_links" FROM anon, authenticated;
ALTER TABLE public."spark_target_availability_links" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_target_build_links" FROM anon, authenticated;
ALTER TABLE public."spark_target_build_links" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_target_goal_links" FROM anon, authenticated;
ALTER TABLE public."spark_target_goal_links" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."spark_targets" FROM anon, authenticated;
ALTER TABLE public."spark_targets" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."user_item_inventories" FROM anon, authenticated;
ALTER TABLE public."user_item_inventories" ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public."user_progress_shared_values" FROM anon, authenticated;
ALTER TABLE public."user_progress_shared_values" ENABLE ROW LEVEL SECURITY;
