-- Drop the manually maintained modules_type_check constraint.
-- @Enumerated(EnumType.STRING) in ModuleEntity rejects unknown values at the application
-- layer before they reach the database, making the DB-level constraint redundant.
-- Future module types no longer require a dedicated migration file.
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_type_check;
