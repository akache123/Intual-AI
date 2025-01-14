BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Most user data is already stored in Clerk, but additional metadata is stored
-- here. Lets us do joins to query projects-per-user & all users-per-project
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,  
  name TEXT NOT NULL
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  use_case TEXT,
  model_type TEXT,
  function TEXT
);

-- Relate users to projects & store permissions (owner, editor, viewer, etc)
-- Many-to-Many relationship
CREATE TABLE project_users (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  permission INT NOT NULL,
  email TEXT,
  PRIMARY KEY (user_id, project_id, email)
);

-- One-to-Many relationship, doesn't need a join table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,  -- TEXT is perfectly ok for storing encrypted data
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- One-To-Many: each project contains several files
CREATE TABLE files (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  process_state TEXT NOT NULL, -- UPLOADED, QUEUED, PROCESSING, FAILED, SUCCEEDED, CANCELLED

  PRIMARY KEY (project_id, file_name)
);

COMMIT;
