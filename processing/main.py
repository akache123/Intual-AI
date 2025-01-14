import os
import json
import boto3
import aioboto3
import asyncio
from multiprocessing import Pool, cpu_count

import db
import processing

sqs = boto3.client('sqs')

uploads_bucket_name = os.getenv('UPLOADS_BUCKET_NAME')
queue_url = os.getenv('QUEUE_URL')

###################
# File Processing #
###################

# Async S3 file download
async def download_file_from_s3(project_id: str, file_name: str):
  session = aioboto3.Session()
  s3_key = f"{project_id}/{file_name}"

  async with session.client('s3') as s3_client:
    print(f"Downloading {s3_key} from {uploads_bucket_name}")

    # !: File gets read into memory
    # !: Change to /tmp if you want
    response = await s3_client.get_object(Bucket=uploads_bucket_name, Key=s3_key)
    data = await response['Body'].read()
    return data

############################
# Async Message Processing #
############################

# Function to fetch and process a batch of SQS messages
async def process_sqs_message(message: dict):
  body: str = message['Body']

  print(body)

  message_body: dict = {}

  try:
    message_body = json.loads(body)
  except:
    print("Failed to parse JSON message!")
    raise Exception

  project_id: str = message_body['project_id']
  file_name: str = message_body['file_name']

  # Download the file asynchronously from S3
  file_data: bytes = await download_file_from_s3(project_id, file_name)

  try:
    # Process the file using a CPU-bound operation (offload to multiprocessing)
    processing.process_file(file_data, project_id, file_name)

    # If we got here, the message and file were successfully processed
    # Delete it from SQS
    sqs.delete_message(
      QueueUrl=queue_url,
      ReceiptHandle=message['ReceiptHandle']
    )
  except:
    print("Failed to process SQS message OR associated file")
    raise Exception


async def process_messages_async(message_batch: list):
  tasks: list = [process_sqs_message(message) for message in message_batch]
  await asyncio.gather(*tasks)

def worker(message_batch: list):
  asyncio.run(process_messages_async(message_batch))

# Batch retrieve 10 messages simultaneously. They get distributed across the
# available number of workers
def fetch_sqs_messages() -> list:
  response = sqs.receive_message(
    QueueUrl=queue_url,
    MaxNumberOfMessages=10,  # Fetch up to 10 messages at once
    WaitTimeSeconds=10  # Long polling
  )

  return response.get('Messages', [])

def main():
  num_workers: int = cpu_count()
  db.init_db()

  while True:
    messages: list = fetch_sqs_messages()

    if not messages:
      print("No messages in queue, waiting...")

      # *: fetch_sqs_messages() already long polls 10 seconds
      continue

    # Max 10 SQS messages, split them across the number of workers
    batches: list = [messages[i:i + num_workers] for i in range(0, len(messages), num_workers)]

    # Use multiprocessing to process each batch concurrently
    with Pool(processes=num_workers) as pool:
      pool.map(worker, batches)

if __name__ == "__main__":
  main()