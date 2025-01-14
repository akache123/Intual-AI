import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  endpoint: process.env.NEXT_PUBLIC_TIGRIS_ENDPOINT_URL || 'default-endpoint',
  accessKeyId: process.env.NEXT_PUBLIC_TIGRIS_ACCESS_KEY_ID || 'default-access-key',
  secretAccessKey: process.env.NEXT_PUBLIC_TIGRIS_SECRET_ACCESS_KEY || 'default-secret-key',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

// Function to merge class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to upload user information to an S3 bucket
export const uploadUserInfo = async (userId: string, firstName: string, lastName: string) => {
  const bucketName = process.env.NEXT_PUBLIC_TIGRIS_BUCKET_NAME_CUSTOMER;
  if (!bucketName) {
    console.error('Bucket name is undefined');
    return;
  }

  const params = {
    Bucket: bucketName,
    Key: `${userId}.json`,
    Body: JSON.stringify({ firstName, lastName }),
    ContentType: 'application/json'
  };

  try {
    await s3.putObject(params).promise();
  } catch (error) {
    console.error('Failed to upload user info');
  }
};

// Function to create a new project JSON file in an S3 bucket
export const createNewProject = async (projectId: string) => {
  const bucketName = process.env.NEXT_PUBLIC_TIGRIS_BUCKET_NAME_PROJECT;
  if (!bucketName) {
    console.error('Bucket name is undefined');
    return;
  }

  const params = {
    Bucket: bucketName,
    Key: `${projectId}.json`,
    Body: JSON.stringify({ projectId }),
    ContentType: 'application/json'
  };

  try {
    await s3.putObject(params).promise();
  } catch (error) {
    console.error('Failed to create new project');
  }
};

// Function to delete a project JSON file from an S3 bucket
export const deleteProject = async (projectId: string) => {
  const bucketName = process.env.NEXT_PUBLIC_TIGRIS_BUCKET_NAME_PROJECT;
  if (!bucketName) {
    console.error('Bucket name is undefined');
    return;
  }

  const params = {
    Bucket: bucketName,
    Key: `${projectId}.json`
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Failed to delete project');
  }
};
