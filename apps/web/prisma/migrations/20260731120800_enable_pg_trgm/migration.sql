-- Enables trigram-based text similarity (similarity(), % operator) used by the cooking-log /
-- favorite-meal fuzzy-name-match feature. Isolated to this database only (no other project
-- shares this Postgres container's database).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
