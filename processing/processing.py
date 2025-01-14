import db
import gen.files

# File processing function (CPU-bound task)
def process_file(file_data: bytes, project_id: str, file_name: str):
  print(f"Processing file {file_name} for project {project_id}")
  
  # TODO: file processing logic
  # !: file_data is raw file contents
  # !: File stored in memory, can modify function to download them

  querier = gen.files.Querier(db.conn)
  querier.update_file_processing(project_id=project_id, file_name=file_name)
  db.conn.commit() # !: YOU HAVE TO DO THIS

  print(file_data)

  querier.update_file_succeeded(project_id=project_id, file_name=file_name)
  db.conn.commit() # !: YOU HAVE TO DO THIS

  print(f"Completed processing of {file_name}")

  files = querier.get_all_files(project_id=project_id)
