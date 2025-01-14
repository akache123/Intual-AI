-- name: GetAllFiles :many
SELECT * FROM files
WHERE project_id = $1
LIMIT 10;

-- name: FileExists :one
SELECT EXISTS (
  SELECT 1
  FROM files
  WHERE file_name = $1
  AND project_id = $2
);

-- name: CreateFile :one
INSERT INTO files (
  project_id, file_name, process_state
) VALUES (
  $1, $2, 'UPLOADED'
)
RETURNING *;

-- name: UpdateFileQueued :one
UPDATE files
SET process_state = 'QUEUED'
WHERE project_id = $1
AND file_name = $2
RETURNING *;

-- name: UpdateFileProcessing :one
UPDATE files
SET process_state = 'PROCESSING'
WHERE project_id = $1
AND file_name = $2
RETURNING *;

-- name: UpdateFileFailed :one
UPDATE files
SET process_state = 'FAILED'
WHERE project_id = $1
AND file_name = $2
RETURNING *;

-- name: UpdateFileSucceeded :one
UPDATE files
SET process_state = 'SUCCEEDED'
WHERE project_id = $1
AND file_name = $2
RETURNING *;

-- name: UpdateFileCancelled :one
UPDATE files
SET process_state = 'CANCELLED'
WHERE project_id = $1
AND file_name = $2
RETURNING *;
