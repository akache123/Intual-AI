-- name: GetAllProjects :many
SELECT p.id, p.created_at, p.name, p.description, p.industry, p.use_case, p.model_type, p.function, pu.permission
FROM projects p
JOIN project_users pu ON p.id = pu.project_id
WHERE pu.user_id = $1
LIMIT 150;

-- name: CreateProject :one
WITH new_project AS (
  INSERT INTO projects (
    name, description, industry, use_case, model_type, function
  ) VALUES (
    $2, $3, $4, $5, $6, $7
  )
  RETURNING id
)

-- Add this user to the project, insert into the join table
INSERT INTO project_users(user_id, project_id, permission)
SELECT $1, id, 0
FROM new_project
RETURNING user_id, project_id, permission;


-- name: GetProjectUserPermission :one
SELECT permission
FROM project_users
WHERE user_id = $1
AND project_id = $2;

-- name: DeleteProject :exec
DELETE FROM projects WHERE id = $1;

-- name: GetProjectByID :one
SELECT p.id, p.created_at, p.name, p.description, p.industry, p.use_case, p.model_type, p.function
FROM projects p
WHERE p.id = $1;

-- name: UpdateProjectDetails :exec
UPDATE projects
SET 
  description = COALESCE($2, description),
  industry = COALESCE($3, industry),
  use_case = COALESCE($4, use_case),
  model_type = COALESCE($5, model_type)
WHERE id = $1;

-- name: InviteUserToProject :exec
INSERT INTO project_users (user_id, project_id, permission, email)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, project_id)
DO UPDATE SET permission = EXCLUDED.permission;

-- name: GetUserByEmail :one
SELECT id, email, name
FROM users
WHERE email = $1;

-- name: GetProjectMembers :many
SELECT u.id, u.name, u.email, pu.permission
FROM users u
JOIN project_users pu ON u.id = pu.user_id
WHERE pu.project_id = $1;

-- name: UpdateProjectUserPermission :exec
UPDATE project_users
SET permission = $3
WHERE user_id = $1
AND project_id = $2;

-- name: InviteUserToProjectByEmail :exec
INSERT INTO project_users (email, project_id, permission)
VALUES ($1, $2, $3)
ON CONFLICT (email, project_id) DO NOTHING;

-- name: DeleteUserFromProject :exec
DELETE FROM project_users
WHERE user_id = $1
AND project_id = $2;

