CREATE TABLE view_count (
  id SERIAL PRIMARY KEY,
  project_id VARCHAR(20) NOT NULL REFERENCES project(id),
  github_views INTEGER DEFAULT 0,
  demo_views INTEGER DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id)
);