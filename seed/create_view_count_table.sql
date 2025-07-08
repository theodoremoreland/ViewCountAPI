CREATE TABLE view_count (
  id SERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES project(id),
  github_views INTEGER DEFAULT 0,
  demo_views INTEGER DEFAULT 0
);