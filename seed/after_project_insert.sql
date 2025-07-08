CREATE OR REPLACE FUNCTION create_view_count_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO view_count (project_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_project_insert
AFTER INSERT ON project
FOR EACH ROW
EXECUTE FUNCTION create_view_count_entry();