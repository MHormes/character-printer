ALTER TABLE backgrounds ADD COLUMN IF NOT EXISTS asi_grants jsonb;
ALTER TABLE backgrounds ADD COLUMN IF NOT EXISTS feat_grant varchar(255);
