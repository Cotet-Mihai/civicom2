CREATE TYPE org_category AS ENUM (
  'educatie',
  'mediu',
  'sanatate',
  'social',
  'animale',
  'cultura'
);

ALTER TABLE organizations
  ADD COLUMN categories org_category[] NOT NULL DEFAULT '{}';
