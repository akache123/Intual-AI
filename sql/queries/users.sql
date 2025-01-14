-- name: CreateUser :one
INSERT INTO users (id, email, name) 
VALUES ($1, $2, $3) 
RETURNING id;

-- name: UserExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE id = $1);

-- name: CreateOrUpdateUser :exec
INSERT INTO users (id, email, name)
VALUES ($1, $2, $3)
ON CONFLICT (id) 
DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;
