# Intual Processing

Multi-threaded python script. Features:

1. Batch fetches SQS messages (10 max)
2. Asynchronously downloads files from S3
3. Processes files & uploads to Qdrant

`pip3 install -r requirements.txt`

### Codegen

Just like the API, this service also uses `sqlc` to codegen Python data models.
