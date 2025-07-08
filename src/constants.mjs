export const DB_NAME = "metadata";

// These are hacky database models. Ensures consistency of names without using an ORM.
export const VIEW_COUNT_TABLE = {
  name: "view_count",
  columns: {
    projectId: "project_id",
    githubViews: "github_views",
    demoViews: "demo_views",
    lastUpdated: "last_updated",
  },
};

export const PROJECT_TABLE = {
  name: "project",
  columns: {
    id: "id",
    name: "name",
    dateAdded: "date_added",
  },
};
