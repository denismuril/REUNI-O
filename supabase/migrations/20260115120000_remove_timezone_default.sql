-- Migration: Remove Hardcoded Timezone Default from Branches
-- Date: 2026-01-15
-- Description: Removes the default 'America/Sao_Paulo' value from the timezone column
--              to allow each branch to have its own timezone configuration.
--              Existing branches keep their current timezone values.

-- Remove the DEFAULT constraint from timezone column
-- This allows branches to be created without a default timezone,
-- requiring explicit configuration for each branch.
ALTER TABLE public.branches 
    ALTER COLUMN timezone DROP DEFAULT;

-- Note: Existing branches with 'America/Sao_Paulo' timezone will keep their values.
-- New branches MUST specify a timezone value during creation.

-- For frontend compatibility, when timezone is NULL or empty, 
-- the application should fallback to 'UTC'.

COMMENT ON COLUMN public.branches.timezone IS 
    'Branch timezone identifier (e.g., America/Sao_Paulo, America/New_York). 
     When NULL or empty, frontend should use UTC as fallback.';
