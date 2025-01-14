# Mock Script

# 1. Initializes all databases
# 2. Runs migrations
# 3. Generates API DB models
# 4. Provision dev AWS resources (no Fargate)
# 5. Update doppler personal config

import time
import os
import argparse
import json
from pprint import pprint

from scripts.common import execute
import boto3


#########
# Setup #
#########

# Make relative filepaths work properly
dirname: str = os.path.dirname(__file__)

INTUAL_POSTGRES_HOST = "localhost"
INTUAL_POSTGRES_USER = INTUAL_POSTGRES_PASS = "intual"
INTUAL_POSTGRES_PORT = 5432
INTUAL_POSTGRES_DSN = (
  f"'postgresql://{INTUAL_POSTGRES_USER}:{INTUAL_POSTGRES_PASS}@{INTUAL_POSTGRES_HOST}:{INTUAL_POSTGRES_PORT}?sslmode=disable'"
)

###############
# Arg Parsing #
###############

parser = argparse.ArgumentParser(description="Dev script for starting Intual")

# Get "name" to use for identifying developer-specific resources
# e.x. Your personal dev bucket will be named `dev-intual-{name}-uploads`
# Defaults to $USER
parser.add_argument("--name",
                    type=str,
                    nargs="?",
                    required=True,
                    help="Identifies developer-specific resources. (S3 bucket, Doppler config, etc)")

# Get local AWS profile to use. Defaults to default AWS profile
parser.add_argument("--profile",
                    type=str,
                    nargs="?",
                    default="default",
                    help="AWS named profile to use. Uses default profile if no named profiles exist")

parser.add_argument("--region",
                    type=str,
                    nargs="?",
                    default="us-west-2",
                    help="Default region to deploy to. NOTE: Separate from default region in 'aws configure'")

args = parser.parse_args()

########
# Exec #
########

print("Running mock script")

print("\n[1/6] Starting docker containers")
compose_path: str = os.path.join(dirname, "docker-compose.mock.yml")

execute(
  ["docker", "compose", "-f", compose_path, "up", "-d"],
  "Failed to start docker containers")

# Give docker a second to properly set up the connection, otherwise `migrate` fails by
# trying to use a random port
time.sleep(1)


print("\n[2/6] Running Migrations")
migration_path: str = os.path.join(dirname, "sql/migrations")

execute(["migrate",
         "-database", INTUAL_POSTGRES_DSN,
         "-path", migration_path,
         "up"],
        "Failed to apply migrations. Is golang-migrate installed? Is localhost:{INTUAL_POSTGRES_PORT} reachable?")


print("\n[3/6] Generating Go & Python data models")
go_sqlc_path: str = os.path.join(dirname, "api/sqlc.yml")
python_sqlc_path: str = os.path.join(dirname, "processing/sqlc.yml")

execute(["sqlc", "generate", "-f", go_sqlc_path],
        "Failed to generate golang data models")

execute(["sqlc", "generate", "-f", python_sqlc_path],
        "Failed to generate golang data models")


print("\n[4/6] Deploying dev resources to AWS")
STAGE: str = f"dev-{args.name}"
PROCESSING_STACK: str = f"{STAGE}-intual-processing-stack"
INTUAL_API_ENDPOINT: str = "localhost:8080"

print("AWS profile:", args.profile)
print("AWS region:", args.region)
print(f"{STAGE=}")

CFN_OUTPUT_FILE: str = "./cdk.out/cfn-outputs.json"
execute(
  [
    f"STAGE={STAGE}",
    "cdk", "deploy", "--ci", PROCESSING_STACK,
    "--require-approval", "never",
    "--profile", args.profile,
    "--outputs-file", CFN_OUTPUT_FILE
  ],
  "Failed to deploy dev AWS stack"
)

# After deploying, read the CFN output file to get the SQS Queue URL (among
# other things)
print("[*] reading CFN output file")

cfn_output_handle = open(CFN_OUTPUT_FILE)
cfn_output = json.load(cfn_output_handle)
pprint(cfn_output)

processing_queue_url = cfn_output[f"{STAGE}-intual-processing-stack"]["processingQueueUrl"]
uploads_bucket_name = cfn_output[f"{STAGE}-intual-processing-stack"]["uploadsBucketName"]
api_access_role_arn = cfn_output[f"{STAGE}-intual-processing-stack"]["apiAccessRoleArn"]
processing_access_role_arn = cfn_output[f"{STAGE}-intual-processing-stack"]["processingAccessRoleArn"]

cfn_output_handle.close()


print("\n[5/6] Requesting temporary AWS credentials")

session = boto3.Session(profile_name=args.profile)
sts_client = session.client("sts")

api_temp_creds: dict = None
processing_temp_creds: dict = None

try:
  api_access_response = sts_client.assume_role(
    RoleArn=api_access_role_arn,
    RoleSessionName=f"{args.name}-apidev-session"
  )

  processing_access_response = sts_client.assume_role(
    RoleArn=processing_access_role_arn,
    RoleSessionName=f"{args.name}-processingdev-session"
  )

  api_temp_creds = api_access_response["Credentials"]
  processing_temp_creds = processing_access_response["Credentials"]
except Exception as e:
  print(f"Failed assuming roles: {e}")

print("[*] Got temporary credentials!")


print("\n[6/6] Updating Doppler personal config")
execute(
  ["doppler", "setup", "--no-interactive"],
  "Failed to setup doppler")

# intual-processing
execute(
  [
    "doppler", "secrets", "set",
    "-p", "intual-processing",
    "-c", "dev_personal",
    f"AWS_ACCESS_KEY_ID={processing_temp_creds['AccessKeyId']}",
    f"AWS_SECRET_ACCESS_KEY={processing_temp_creds['SecretAccessKey']}",
    f"AWS_SESSION_TOKEN={processing_temp_creds['SessionToken']}"
    f"REGION={args.region}",
    f"POSTGRES_DSN={INTUAL_POSTGRES_DSN}",
    f"UPLOADS_BUCKET_NAME={uploads_bucket_name}",
    f"QUEUE_URL={processing_queue_url}"
  ],
  "Failed to update intual-processing env vars"
)

# intual-api
execute(
  [
    "doppler", "secrets", "set",
    "-p", "intual-api",
    "-c", "dev_personal",
    f"AWS_ACCESS_KEY_ID={api_temp_creds['AccessKeyId']}",
    f"AWS_SECRET_ACCESS_KEY={api_temp_creds['SecretAccessKey']}",
    f"AWS_SESSION_TOKEN={api_temp_creds['SessionToken']}",
    f"REGION={args.region}",
    f"POSTGRES_DSN={INTUAL_POSTGRES_DSN}",
    f"UPLOADS_BUCKET_NAME={uploads_bucket_name}",
    f"QUEUE_URL={processing_queue_url}"
  ],
  "Failed to update intual-api env vars"
)

# intual-frontend
execute(
  [
    "doppler", "secrets", "set",
    "-p", "intual-frontend",
    "-c", "dev_personal",
    f"INTUAL_API_ENDPOINT={INTUAL_API_ENDPOINT}",
  ],
  "Failed to update intual-frontend env vars"
)


print("\n\nFinished all steps!")
print(
  "Run the following commands in new terminals to start every service:")
print("[*] cd frontend && doppler run -- npm run dev")
print("[*] cd api && doppler run -- go run main.go")
print("[*] cd processing && doppler run -- python3 main.py")

print(f"\n[➡️] Teardown command: python3 teardown.py --profile {args.profile} --env dev --name {args.name}")
